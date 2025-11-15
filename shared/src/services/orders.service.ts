import { Service } from "@ecom/shared/services/service";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import type {
	GetHighLevelOrders,
	HighLevelOrder,
	InsertOrderItemsPayload,
	PlaceOrderServicePayload,
} from "@ecom/shared/types/orders";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { UseMiddleware } from "@ecom/shared/decorators/useMiddleware";
import { defaults, FilterOp } from "@ecom/shared/constants/constants";
import { AuthService } from "@ecom/shared/services/auth.service";
import { defaultOp, OrderFilters } from "@ecom/shared/schemas/orders-filter.schema";
import { applyFilterOps } from "@ecom/shared/utils/applyFilterOps";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<OrdersService>(verifyUser))
export class OrdersService extends Service {
	/** Fetch all orders with filters */
	async getAllOrders(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_ORDERS_PAGE_SIZE,
		filters: OrderFilters = {},
	): Promise<GetHighLevelOrders> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.ORDERS_TABLE)
				.select(
					`
					id, status, created_at, total,
					${this.USERS_TABLE}(user_id, first_name, last_name),
					${this.PAYMENTS_TABLE}(method, status)
				`,
					{ count: "exact" },
				)
				.order(filters.sortBy || defaults.defaultOrdersSortByFilter, {
					ascending: filters.sortType === "asc",
				});

			if (filters.status != undefined) {
				query = query.eq("status", filters.status);
			}

			const numericFields: Array<[keyof OrderFilters, keyof OrderFilters]> = [
				["total", "total_op"],
				["discount", "discount_op"],
			];

			for (const [colKey, opKey] of numericFields) {
				const columnName = colKey as string;
				const op = ((filters as OrderFilters)[opKey] as FilterOp) || defaultOp;
				const value = (filters as OrderFilters)[colKey] as number | undefined;
				query = applyFilterOps(query, columnName, op, value);
			}

			if (filters.createdAt) {
				query = query
					.gte("created_at", filters.createdAt.from.toISOString())
					.lte("created_at", filters.createdAt.to.toISOString());
			}

			if (q.length > 0) {
				query = query.eq("id", q);
			}

			query = query.range(from, to);

			const { data, error: queryError, count } = await query;

			let payload: HighLevelOrder[] =
				data?.flatMap((order) => {
					return {
						id: order.id,
						created_at: order.created_at,
						status: order.status,
						total: order.total,
						payment: {
							method: order[this.PAYMENTS_TABLE][0].method,
							status: order[this.PAYMENTS_TABLE][0].status,
						},
						user: {
							name:
								order[this.USERS_TABLE].first_name + " " + order[this.USERS_TABLE].last_name,
							user_id: order[this.USERS_TABLE].user_id,
							email: "",
							avatar: "",
						},
					};
				}) ?? [];

			if (data != null) {
				for (let i = 0; i < payload.length; i++) {
					const auth_svc = await this.createSubService(AuthService);
					const { data: email_resp } = await auth_svc.getAuthSchemaUser(payload[i].user.user_id);

					payload[i].user.email = email_resp.user?.email ?? "";
					payload[i].user.avatar = email_resp.user?.user_metadata?.avatar_url ?? "";
				}
			}

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
				console.log(error);
			}

			return {
				orders: payload,
				total: count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { orders: [], total: 0, error: err };
			}
			return {
				orders: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}
}

@UseClassMiddleware(loggerMiddleware)
export class FP_OrdersService extends Service {
	/** Delete address entry for rollbacks */
	async deleteAddress(address_id: string) {
		const { error } = await this.supabase
			.from(this.ADDRESSES_TABLE)
			.delete()
			.eq("id", address_id)
			.single();
		if (error) {
			throw new ApiError(error.message, Number(error.code), [error.details]);
		}
	}

	/** Create address entry like for billing and shipping */
	async createAddressForOrder({
		shipping_address,
		billing_address,
	}: {
		shipping_address: PlaceOrderServicePayload["shipping_address"];
		billing_address: PlaceOrderServicePayload["billing_address"];
	}): Promise<{
		shipping_address_id: string | null;
		billing_address_id: string | null;
	}> {
		if (this.currentUser == null) {
			throw new ApiError("User not found", 400, []);
		}

		if (shipping_address == null) {
			throw new ApiError("Shipping address is required", 400, []);
		}

		let shipping_address_id = null,
			billing_address_id = null;

		const { data: shippingData, error: shippingErr } = await this.supabase
			.from(this.ADDRESSES_TABLE)
			.insert({
				address_type: "shipping",
				city: shipping_address.city,
				email: shipping_address.email,
				first_name: shipping_address.first_name,
				last_name: shipping_address.last_name,
				phone: shipping_address.phone,
				address_name: shipping_address.address.formattedAddress ?? "",
				latitude: shipping_address.address.lat ?? null,
				longitude: shipping_address.address.lng ?? null,
				province: shipping_address.province ?? null,
				user_id: this.currentUser.id, // created by
			})
			.select("id")
			.single();

		if (shippingErr) {
			throw new ApiError(shippingErr.message, Number(shippingErr.code), [shippingErr.details]);
		}

		shipping_address_id = shippingData.id ?? null;

		if (billing_address && billing_address != null) {
			const { data: billingData, error: billingErr } = await this.supabase
				.from(this.ADDRESSES_TABLE)
				.insert({
					address_type: "billing",
					city: billing_address.city,
					email: billing_address.email,
					first_name: billing_address.first_name,
					last_name: billing_address.last_name,
					phone: billing_address.phone,
					address_name: billing_address.address.formattedAddress ?? "",
					latitude: billing_address.address.lat ?? null,
					longitude: billing_address.address.lng ?? null,
					province: billing_address.province ?? null,
					user_id: this.currentUser.id, // created by
				})
				.select("id")
				.single();

			if (billingErr) {
				await this.deleteAddress(shipping_address_id);
				throw new ApiError(billingErr.message, Number(billingErr.code), [billingErr.details]);
			}

			billing_address_id = billingData.id ?? null;
		}

		return {
			shipping_address_id,
			billing_address_id,
		};
	}

	/** Delete order entry for rollbacks */
	async deleteOrderEntry(order_id: string) {
		const { error } = await this.supabase.from(this.ORDERS_TABLE).delete().eq("id", order_id).single();
		if (error) {
			throw new ApiError(error.message, Number(error.code), [error.details]);
		}
	}

	/** Create initial order entry */
	async insertInitialOrderEntry({
		billing_address_id,
		shipping_address_id,
		cart_summary,
		order_note,
		isBillingSameAsShipping,
	}: {
		billing_address_id: string | null;
		shipping_address_id: string | null;
		cart_summary: PlaceOrderServicePayload["cart_summary"];
		order_note: PlaceOrderServicePayload["order_note"];
		isBillingSameAsShipping: PlaceOrderServicePayload["isBillingSameAsShipping"];
	}) {
		if (this.currentUser == null) {
			throw new ApiError("Error placing order because no user found", 400, []);
		}

		if (shipping_address_id == null) {
			throw new ApiError("Error inserting shipping address", 500, []);
		}

		if (isBillingSameAsShipping == "n" && billing_address_id == null) {
			throw new ApiError("Error inserting billing address", 500, []);
		}

		let order_id: null | string = null;

		const { data, error: OrderInsertErr } = await this.supabase
			.from(this.ORDERS_TABLE)
			.insert({
				status: "pending",
				sub_total: parseFloat(cart_summary.subtotal),
				tax_amount: parseFloat(cart_summary.tax), // -> taxed amount (not percentage)
				shipping: parseFloat(cart_summary.shipping),
				discount: parseFloat(cart_summary.discount),
				total: parseFloat(cart_summary.total),
				order_note: order_note ?? null,
				user_id: this.currentUser.id,
				shipping_address_id,
				billing_address_id,
			})
			.select("id")
			.single();

		if (OrderInsertErr) {
			throw new ApiError(OrderInsertErr.message, Number(OrderInsertErr.code), [OrderInsertErr.details]);
		}

		order_id = data.id ?? null;

		return order_id;
	}

	async insertOrderItems(payload: InsertOrderItemsPayload) {
		const { error } = await this.supabase.from(this.ORDER_ITEMS_TABLE).insert(payload);

		let dbError: null | ApiError = null;

		if (error) {
			dbError = new ApiError(error.message, Number(error.code), [error.details]);
		}

		return dbError;
	}

	/** Places an order by when user confirms checkout */
	@UseMiddleware(asServiceMiddleware<FP_OrdersService>(verifyUser))
	async placeInitialOrder(payload: PlaceOrderServicePayload) {
		try {
			if (this.currentUser == null) {
				throw new ApiError("Error placing order because no user found", 400, []);
			}

			const {
				order_note,
				cart_summary,
				isBillingSameAsShipping,
				shipping_address,
				billing_address,
				cart_items,
				payment_method: _,
			} = payload;

			if (cart_items == null || cart_items.length == 0) {
				throw new ApiError("Error placing order because no cart items found", 400, []);
			}

			const { billing_address_id, shipping_address_id } = await this.createAddressForOrder({
				shipping_address,
				billing_address,
			});

			if (shipping_address_id == null) {
				throw new ApiError("Error inserting shipping address", 500, []);
			}

			const order_id = await this.insertInitialOrderEntry({
				shipping_address_id,
				billing_address_id,
				cart_summary,
				isBillingSameAsShipping,
				order_note,
			});

			if (order_id == null) {
				await this.deleteAddress(shipping_address_id);
				if (billing_address_id != null) {
					await this.deleteAddress(billing_address_id);
				}
				throw new ApiError("Error inserting order", 500, []);
			}

			const orderItemsErr = await this.insertOrderItems(
				cart_items.flatMap((i) => {
					return {
						order_id,
						...i,
					};
				}),
			);

			if (orderItemsErr && orderItemsErr != null) {
				await this.deleteAddress(shipping_address_id);
				if (billing_address_id != null) {
					await this.deleteAddress(billing_address_id);
				}
				await this.deleteOrderEntry(order_id);
				throw orderItemsErr;
			}

			return { order_id };
		} catch (error) {
			throw error;
		}
	}
}
