import { format, startOfDay, subDays, subYears } from "date-fns";
import { Service } from "@ecom/shared/services/service";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import type {
	GetLowStocksResp,
	GetProvinceWiseSalesData,
	GetTopSellingProducts,
	MainBarChartData,
} from "@ecom/shared/types/admin-dashboard";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<AdminDashboardService>(verifyUser))
export class AdminDashboardService extends Service {
	async getSalesAndOrdersData(): Promise<MainBarChartData> {
		try {
			const now = new Date();
			const threeMonthsAgo = subDays(startOfDay(now), 90);

			const { data, error } = await this.supabase
				.from(this.ORDERS_TABLE)
				.select("created_at, total")
				.in("status", ["paid", "shipped"])
				.gte("created_at", threeMonthsAgo.toISOString())
				.lte("created_at", now.toISOString());

			if (error) {
				console.error("Error fetching sales overview:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				return {
					data: [],
					error: error ?? null,
				};
			}

			// Group by date (truncate to day)
			const grouped = new Map<string, { sales: number; orders: number }>();

			data.forEach((order) => {
				const dateKey = format(new Date(order.created_at), "yyyy-MM-dd");
				const existing = grouped.get(dateKey) || { sales: 0, orders: 0 };

				existing.sales += order.total;
				existing.orders += 1;

				grouped.set(dateKey, existing);
			});

			// Generate full date range and fill missing days with 0
			const result: { date: string; sales: number; orders: number }[] = [];
			let currentDate = threeMonthsAgo;

			while (currentDate <= now) {
				const dateStr = format(currentDate, "yyyy-MM-dd");
				const dayData = grouped.get(dateStr) || { sales: 0, orders: 0 };

				result.push({
					date: dateStr,
					sales: Math.round(dayData.sales),
					orders: dayData.orders,
				});

				currentDate = new Date(currentDate);
				currentDate.setDate(currentDate.getDate() + 1);
			}

			return {
				data: result,
				error: null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { data: [], error: err };
			}

			return {
				data: [],
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	async getTopSellingProducts(): Promise<GetTopSellingProducts> {
		try {
			const now = new Date();
			const threeMonthsAgo = subDays(startOfDay(now), 90);

			// Join order_items → product_variant → product
			// Only count paid/shipped orders in last 90 days
			const { data, error } = await this.supabase
				.from(this.ORDER_ITEMS_TABLE)
				.select(
					`
					quantity,
					price,
					product_variant!inner (
						id,
						sku,
						original_price,
						stock,
						images,
						product_id,
						product!inner (
							id,
							name,
							cover_image
						)
					),
					orders!inner (
						status,
						created_at
					)
				`,
				)
				.in("orders.status", ["paid", "shipped"])
				.gte("orders.created_at", threeMonthsAgo.toISOString())
				.lte("orders.created_at", now.toISOString());

			if (error) {
				console.error("Error fetching top selling products:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				return { products: [], error: null };
			}

			// Group by variant (since multiple SKUs can belong to same product)
			const grouped = new Map<
				string,
				{
					variant_id: string;
					product_id: string;
					product_name: string;
					image_url: string;
					sku: string;
					original_price: number;
					total_quantity: number;
					stock: number;
				}
			>();

			data.forEach((item: any) => {
				const variant = item.product_variant;
				const product = variant.product;

				const key = variant.id; // group by variant ID

				const existing = grouped.get(key) || {
					variant_id: variant.id,
					product_id: product.id,
					product_name: product.name,
					image_url: variant.images[0] || product.cover_image || "",
					sku: variant.sku,
					original_price: variant.original_price,
					total_quantity: 0,
					stock: variant.stock,
				};

				existing.total_quantity += item.quantity;

				grouped.set(key, existing);
			});

			// Convert to array, sort by quantity sold (desc), limit to top 10
			const topProducts = Array.from(grouped.values())
				.sort((a, b) => b.total_quantity - a.total_quantity)
				.slice(0, 10)
				.map((p) => ({
					product_id: p.product_id,
					variant_id: p.variant_id,
					product_name: p.product_name,
					sku: p.sku,
					image_url: p.image_url,
					original_price: p.original_price,
					stock: p.stock,
				}));

			return {
				products: topProducts,
				error: null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { products: [], error: err };
			}

			return {
				products: [],
				error: new ApiError("Failed to fetch top selling products", 500, [err]),
			};
		}
	}

	async getLowStockVariants(): Promise<GetLowStocksResp> {
		const { data, error } = await this.supabase
			.from(this.PRODUCT_VARIANT_TABLE)
			.select(
				`
                id,
                sku,
                stock,
                reorder_level,
                images,
                product_id,
                product (
                    name
                )
                `,
			)
			.eq("status", true)
			.order("stock", { ascending: true })
			.order("reorder_level", { ascending: false });

		if (error) {
			console.error("Error fetching low stock variants:", error);
			throw error;
		}

		let filtered = (data ?? []).filter((variant: any) => {
			const reorder = variant.reorder_level ?? 0;
			return variant.stock <= reorder;
		});

		return {
			products:
				filtered.map((variant) => {
					return {
						id: variant.id,
						product_id: variant.product_id,
						product_name: variant.product.name,
						image_url: variant.images[0],
						sku: variant.sku,
						stock: variant.stock,
						reorder_level: variant.reorder_level,
					};
				}) ?? [],
			error: null,
		};
	}

	async getProvinceWiseSales(): Promise<GetProvinceWiseSalesData> {
		try {
			const now = new Date();
			const oneYearAgo = subYears(startOfDay(now), 1);

			const { data, error } = await this.supabase
				.from(this.ORDERS_TABLE)
				.select(
					`
					addresses!orders_shipping_address_id_fkey (
						province
					)
				`,
				)
				.in("status", ["paid", "shipped"])
				.in("addresses.address_type", ["shipping"])
				.gte("created_at", oneYearAgo.toISOString())
				.lte("created_at", now.toISOString());

			if (error) {
				console.error("Error fetching province-wise sales:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				return { data: [], error: null };
			}

			// Group by province
			const grouped = new Map<string, number>();

			data.forEach((order: any) => {
				const province = order.addresses.province || "Unknown";
				const existing = grouped.get(province) || 0;
				grouped.set(province, existing + 1);
			});

			// Convert to array
			const result = Array.from(grouped.entries()).map(([province, sales]) => ({
				province,
				sales: Math.round(sales),
			}));

			result.sort((a, b) => b.sales - a.sales);

			return {
				data: result,
				error: null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { data: [], error: err };
			}

			return {
				data: [],
				error: new ApiError("Failed to fetch province-wise sales", 500, [err]),
			};
		}
	}
}
