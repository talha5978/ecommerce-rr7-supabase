import type { ApiError } from "@ecom/shared/utils/ApiError";

export type MainBarChartData = {
	data: { date: string; sales: number; orders: number }[];
	error: null | ApiError;
};

export type LowStockProduct = {
	id: string;
	product_id: string;
	product_name: string;
	image_url: string;
	sku: string;
	stock: number;
	reorder_level: number;
};

export type GetLowStocksResp = {
	products: LowStockProduct[];
	error: null | ApiError;
};

export type TopSellingProduct = {
	product_id: string;
	variant_id: string;
	product_name: string;
	sku: string;
	image_url: string;
	original_price: number;
	stock: number;
};

export type GetTopSellingProducts = {
	products: TopSellingProduct[];
	error: null | ApiError;
};

export type ProvinceSalesDataItem = {
	province: string;
	sales: number;
};

export type GetProvinceWiseSalesData = {
	data: ProvinceSales[];
	error: null | ApiError;
};

export type RecentOrder = {
	order_id: string;
	customer_name: string;
	customer_email?: string;
	customer_phone?: string;
	payment_status: "paid" | "pending" | "failed" | "refunded" | string;
	total_amount: number;
	currency?: string;
	order_date: string | number | Date;
	items: {
		sku: string;
		qty: number;
	}[];
	avatar_url?: string | null;
};
