import type { CouponActionData } from "@ecom/shared/schemas/coupons.schema";
import type {
	BuyMinType,
	CouponType,
	DiscountCondType,
	DiscountCustomerGrps,
	FullCoupon,
	GetFullCoupon,
	GetHighLevelCouponsResp,
	GroupsConditionRole,
} from "@ecom/shared/types/coupons";
import { ApiError } from "@ecom/shared/utils/ApiError";
import type { TypesToSelect } from "@ecom/shared/types/coupons-comp";
import { Service } from "@ecom/shared/services/service";
import { stringToBooleanConverter } from "@ecom/shared/lib/utils";
import { defaults } from "@ecom/shared/constants/constants";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { UseMiddleware } from "@ecom/shared/decorators/useMiddleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { requireAllPermissions } from "@ecom/shared/middlewares/permissions.middleware";
import { Permission } from "@ecom/shared/permissions/permissions.enum";

@UseClassMiddleware(loggerMiddleware)
export class CouponsService extends Service {
	// Check for duplicate coupon code
	private async checkForDuplicateCode(input_code: string) {
		const { data: existingCoupon, error: checkError } = await this.supabase
			.from(this.COUPONS_TABLE)
			.select("code")
			.eq("code", input_code)
			.maybeSingle();

		if (checkError) {
			throw new ApiError(`Error checking for duplicate coupon code: ${checkError.message}`, 500, []);
		} else if (existingCoupon) {
			throw new ApiError(`Coupon code ${input_code} already exists`, 400, []);
		}
	}

	private async deleteCoupon(coupon_id: number) {
		await this.supabase.from(this.COUPONS_TABLE).delete().eq("coupon_id", coupon_id);
	}

	private async insertConditionGroups({
		coupon_id,
		group_role,
	}: {
		coupon_id: number;
		group_role: GroupsConditionRole;
	}): Promise<number | null> {
		const { data: groupData, error: groupInsertError } = await this.supabase
			.from(this.CONDITION_GROUPS_TABLE)
			.insert({ coupon_id, role: group_role })
			.select("group_id")
			.single();

		if (groupInsertError || !groupData) {
			throw new ApiError(
				`Failed to insert condition group: ${groupInsertError?.message || "No data returned"}`,
				500,
				[],
			);
		}

		return groupData?.group_id ?? null;
	}

	private async deleteConditionGroup(condition_group_id: number) {
		await this.supabase.from(this.CONDITION_GROUPS_TABLE).delete().eq("group_id", condition_group_id);
	}

	private async insertCollectionsConditionGroup({
		group_id,
		collection_id,
	}: {
		group_id: number;
		collection_id: string;
	}) {
		const { error } = await this.supabase
			.from(this.CONDITION_GROUP_COLLECTIONS_TABLE)
			.insert({ condition_group_id: group_id, collection_id });

		if (error) throw new ApiError(`Failed to insert collection group: ${error.message}`, 500, []);
	}

	private async deleteCollectionConditionGroups(condition_group_ids: string[]) {
		await this.supabase
			.from(this.CONDITION_GROUP_COLLECTIONS_TABLE)
			.delete()
			.in("collection_id", condition_group_ids);
	}

	private async insertSKUsConditionGroup({ group_id, sku_id }: { group_id: number; sku_id: string }) {
		const { error } = await this.supabase
			.from(this.CONDITION_GROUP_SKUS_TABLE)
			.insert({ condition_group_id: group_id, sku_id });

		if (error) throw new ApiError(`Failed to insert sku group: ${error.message}`, 500, []);
	}

	private async deleteSKUsConditionGroups(condition_group_ids: string[]) {
		await this.supabase.from(this.CONDITION_GROUP_SKUS_TABLE).delete().in("sku_id", condition_group_ids);
	}

	private async insertSubCategoriesConditionGroup({
		group_id,
		sub_category_id,
	}: {
		group_id: number;
		sub_category_id: string;
	}) {
		const { error } = await this.supabase
			.from(this.CONDITION_GROUP_SUB_CATEGORIES_TABLE)
			.insert({ condition_group_id: group_id, sub_category_id });

		if (error) throw new ApiError(`Failed to insert sub-category group: ${error.message}`, 500, []);
	}

	private async deleteSubCategoriesConditionGroups(condition_group_ids: string[]) {
		await this.supabase
			.from(this.CONDITION_GROUP_SUB_CATEGORIES_TABLE)
			.delete()
			.in("sub_category_id", condition_group_ids);
	}

	private async insertBuyXGetYDetails({
		coupon_id,
		buy_min_type,
		buy_min_value,
		get_quantity,
		get_discount_percent,
		buy_group_id,
		get_group_id,
	}: {
		coupon_id: number;
		buy_min_type: BuyMinType;
		buy_min_value: string;
		get_quantity: string;
		get_discount_percent: string;
		buy_group_id: number;
		get_group_id: number;
	}) {
		const { error: detailsError } = await this.supabase.from(this.BUY_X_GET_Y_TABLE).insert({
			coupon_id,
			buy_min_type,
			buy_min_value: parseFloat(buy_min_value),
			get_quantity: parseInt(get_quantity, 10),
			get_discount_percent: parseFloat(get_discount_percent),
			buy_group_id,
			get_group_id,
		});

		if (detailsError) {
			throw new ApiError(`Failed to insert buy_x_get_y_details: ${detailsError.message}`, 500, []);
		}
	}

	private async deleteBuyXGetYDetails(coupon_id: number) {
		await this.supabase.from(this.BUY_X_GET_Y_TABLE).delete().eq("coupon_id", coupon_id);
	}

	private async insertProductCondition({
		group_id,
		condition,
	}: {
		group_id: number;
		condition: {
			type: string;
			operator: string;
			value_decimal: string | null;
			value_text: string[] | null;
			min_quantity: string | null;
		};
	}): Promise<number | null> {
		const { error, data: condition_data } = await this.supabase
			.from(this.PRODUCT_CONDITIONS_TABLE)
			.insert({
				// @ts-ignore
				group_id,
				type: condition.type,
				operator: condition.operator,
				value_decimal: condition.value_decimal ? parseFloat(condition.value_decimal) : null,
				min_quantity: condition.min_quantity ? parseInt(condition.min_quantity, 10) : null,
				value_ids: condition.value_text || null,
			})
			.select("condition_id")
			.single();

		if (error) {
			throw new ApiError(`Failed to insert product_condition: ${error.message}`, 500, []);
		}

		return condition_data.condition_id ?? null;
	}

	private async deleteProductConditions(condition_ids: number[]) {
		await this.supabase.from(this.PRODUCT_CONDITIONS_TABLE).delete().in("condition_id", condition_ids);
	}

	private async insertCustomerConditions({
		coupon_id,
		customer_group,
		min_purchased_amount,
	}: {
		coupon_id: number;
		customer_group: DiscountCustomerGrps | null;
		min_purchased_amount: string | null;
	}) {
		const { data: customerData, error: customerError } = await this.supabase
			.from(this.CUSTOMER_CONDITIONS_TABLE)
			.insert({
				coupon_id,
				customer_type: customer_group || null,
				min_purchased_amount:
					min_purchased_amount !== "" && min_purchased_amount !== null
						? parseFloat(min_purchased_amount)
						: null,
			})
			.select("customer_condition_id")
			.single();

		if (customerError || !customerData) {
			throw new ApiError(
				`Failed to insert customer_conditions: ${customerError?.message || "No data returned"}`,
				500,
				[],
			);
		}

		return customerData?.customer_condition_id ?? null;
	}

	private async deleteCustomerCondition(customer_condition_id: number) {
		await this.supabase
			.from(this.CUSTOMER_CONDITIONS_TABLE)
			.delete()
			.eq("customer_condition_id", customer_condition_id);
	}

	private async insertCustomerEmails({
		customer_condition_id,
		emails,
	}: {
		customer_condition_id: number;
		emails: string[];
	}) {
		const { data: emailData, error } = await this.supabase
			.from(this.CUSTOMER_EMAILS_TABLE)
			.insert(emails.map((email) => ({ customer_condition_id, email })))
			.select("email_id");

		if (error || !emailData) {
			throw new ApiError(
				`Failed to insert customer emails: ${error?.message || "No data returned"}`,
				500,
				[],
			);
		}

		return emailData.map((email) => email.email_id) ?? [];
	}

	private async deleteCustomerEmails(email_ids: number[]) {
		await this.supabase.from(this.CUSTOMER_EMAILS_TABLE).delete().in("email_id", email_ids);
	}

	/** Create a coupon */
	@UseMiddleware(
		asServiceMiddleware<CouponsService>(verifyUser),
		requireAllPermissions([Permission.MANAGE_COUPONS]),
	)
	async createCoupon({
		input,
		coupon_type,
	}: {
		input: CouponActionData;
		coupon_type: CouponType;
	}): Promise<void | null> {
		console.log("Input in service 🗽", input);
		if (!coupon_type) {
			throw new ApiError("Invalid coupon type", 400, []);
		}
		// return

		let coupon_id: number | null = null;
		let buy_group_id: number | null = null;
		let get_group_id: number | null = null;
		let target_group_id: number | null = null;
		let order_group_id: number | null = null;
		let customer_condition_id: number | null = null;
		const inserted_collection_ids: string[] = [];
		const inserted_sku_ids: string[] = [];
		const inserted_sub_category_ids: string[] = [];
		const inserted_customer_email_ids: number[] = [];
		const inserted_condition_ids: number[] = [];

		try {
			// Check for duplicate code
			await this.checkForDuplicateCode(input.code);

			// Insert into coupons
			const { data: couponData, error: couponError } = await this.supabase
				.from(this.COUPONS_TABLE)
				.insert({
					code: input.code,
					description: input.description,
					status: stringToBooleanConverter(input.status),
					discount_type: input.discount_type,
					discount_value: input.discount_value ? parseFloat(input.discount_value) : null,
					min_purchase_amount: input.order_conditions.min_purchase_amount
						? parseFloat(input.order_conditions.min_purchase_amount)
						: null,
					min_purchase_qty: input.order_conditions.min_purchase_qty
						? parseInt(input.order_conditions.min_purchase_qty, 10)
						: null,
					coupon_type,
					max_uses_per_order: input.order_conditions.max_uses_per_order
						? parseInt(input.order_conditions.max_uses_per_order, 10)
						: null,
					max_total_uses: input.usage_conditions.max_total_uses
						? parseInt(input.usage_conditions.max_total_uses, 10)
						: null,
					one_use_per_customer: input.usage_conditions.one_use_per_customer
						? input.usage_conditions.one_use_per_customer === "true"
						: false,
					start_timestamp: input.start_timestamp,
					end_timestamp: input.end_timestamp,
				})
				.select("coupon_id")
				.single();

			if (couponError || !couponData) {
				throw new ApiError(
					`Failed to insert coupon: ${couponError?.message || "No data returned"}`,
					500,
					[],
				);
			}

			coupon_id = couponData.coupon_id;

			// Handle buy_x_get_y_fields
			if (input.discount_type === "buy_x_get_y") {
				if (!input.buy_x_get_y_fields) {
					throw new ApiError(
						"buy_x_get_y_fields is required for discount_type buy_x_get_y",
						400,
						[],
					);
				}

				const { buy_group, get_group } = input.buy_x_get_y_fields;

				// Validate buy_group
				if (!buy_group.buy_min_type || !buy_group.buy_min_value || !buy_group.condition_type) {
					throw new ApiError(
						"buy_group must contain buy_min_type, buy_min_value, and condition_type",
						400,
						[],
					);
				}
				if (!buy_group.selected_ids || buy_group.selected_ids.length === 0) {
					throw new ApiError("buy_group selected_ids must be a non-empty array", 400, []);
				}

				// Validate get_group
				if (!get_group.quantity || !get_group.discount_percent || !get_group.condition_type) {
					throw new ApiError(
						"get_group must contain quantity, discount_percent, and condition_type",
						400,
						[],
					);
				}
				if (!get_group.selected_ids || get_group.selected_ids.length === 0) {
					throw new ApiError("get_group selected_ids must be a non-empty array", 400, []);
				}

				// Insert buy_group and get its id
				buy_group_id = await this.insertConditionGroups({
					coupon_id,
					group_role: "buy_x",
				});

				if (buy_group_id === null) {
					throw new ApiError("Failed to insert buy_group", 500, []);
				}

				// Insert buy_group selected_ids
				for (const id of buy_group.selected_ids) {
					if ((buy_group.condition_type as TypesToSelect) === "collection") {
						await this.insertCollectionsConditionGroup({
							group_id: buy_group_id,
							collection_id: id,
						});
						inserted_collection_ids.push(id);
					} else if ((buy_group.condition_type as TypesToSelect) === "sku") {
						await this.insertSKUsConditionGroup({
							group_id: buy_group_id,
							sku_id: id,
						});
						inserted_sku_ids.push(id);
					} else if ((buy_group.condition_type as TypesToSelect) === "category") {
						await this.insertSubCategoriesConditionGroup({
							group_id: buy_group_id,
							sub_category_id: id,
						});
						inserted_sub_category_ids.push(id);
					} else {
						throw new ApiError(
							`Invalid buy_group condition_type: ${buy_group.condition_type}`,
							400,
							[],
						);
					}
				}

				// Insert get_group and get its id
				get_group_id = await this.insertConditionGroups({
					coupon_id,
					group_role: "get_y",
				});

				if (get_group_id === null) {
					throw new ApiError("Failed to insert get_group", 500, []);
				}

				// Insert get_group selected_ids
				for (const id of get_group.selected_ids) {
					if ((get_group.condition_type as TypesToSelect) === "collection") {
						await this.insertCollectionsConditionGroup({
							group_id: get_group_id,
							collection_id: id,
						});
						inserted_collection_ids.push(id);
					} else if ((get_group.condition_type as TypesToSelect) === "sku") {
						await this.insertSKUsConditionGroup({
							group_id: get_group_id,
							sku_id: id,
						});
						inserted_sku_ids.push(id);
					} else if ((get_group.condition_type as TypesToSelect) === "category") {
						await this.insertSubCategoriesConditionGroup({
							group_id: get_group_id,
							sub_category_id: id,
						});
						inserted_sub_category_ids.push(id);
					} else {
						throw new ApiError(
							`Invalid get_group condition_type: ${buy_group.condition_type}`,
							400,
							[],
						);
					}
				}

				// Insert buy_x_get_y_details
				await this.insertBuyXGetYDetails({
					coupon_id,
					buy_group_id,
					get_group_id,
					buy_min_type: buy_group.buy_min_type,
					buy_min_value: buy_group.buy_min_value,
					get_quantity: get_group.quantity,
					get_discount_percent: get_group.discount_percent,
				});
			}

			// Handle specific_target_products
			if (input.specific_target_products && input.specific_target_products.length > 0) {
				target_group_id = await this.insertConditionGroups({
					coupon_id,
					group_role: "discount_application",
				});

				if (target_group_id === null) {
					throw new ApiError("Failed to insert target_group", 500, []);
				}

				for (const condition of input.specific_target_products) {
					if (!condition.type || !condition.operator) {
						throw new ApiError(
							"specific_target_products condition must have type and operator",
							400,
							[],
						);
					}
					if (!condition.value_decimal && !condition.value_text) {
						throw new ApiError(
							"specific_target_products condition must have value_decimal or value_text",
							400,
							[],
						);
					}

					const condition_id = await this.insertProductCondition({
						group_id: target_group_id,
						condition: {
							type: condition.type,
							operator: condition.operator,
							value_decimal: condition.value_decimal ?? null,
							value_text: condition.value_text ?? null,
							min_quantity: null,
						},
					});

					if (condition_id === null) {
						throw new ApiError("Target products upload failed", 500);
					}

					inserted_condition_ids.push(condition_id);
				}
			}

			// Handle order_conditions.conditions
			if (input.order_conditions.conditions && input.order_conditions.conditions.length > 0) {
				order_group_id = await this.insertConditionGroups({
					coupon_id,
					group_role: "eligibility",
				});

				if (order_group_id === null) {
					throw new ApiError("Failed to insert order_group", 500);
				}

				for (const condition of input.order_conditions.conditions) {
					if (!condition.type || !condition.operator) {
						throw new ApiError("order_conditions condition must have type and operator", 400);
					}
					if (!condition.value_decimal && !condition.value_text) {
						throw new ApiError(
							"order_conditions condition must have value_decimal or value_text",
							400,
						);
					}

					const condition_id = await this.insertProductCondition({
						group_id: order_group_id,
						condition: {
							type: condition.type,
							operator: condition.operator,
							value_decimal: condition.value_decimal ?? null,
							value_text: condition.value_text ?? null,
							min_quantity: condition.min_quantity,
						},
					});

					if (condition_id === null) {
						throw new ApiError("Upload of items in products conditions failed.", 500);
					}

					inserted_condition_ids.push(condition_id);
				}
			}

			// Handle customer_conditions
			if (input.customer_conditions) {
				if (input.customer_conditions.customer_groups != null) {
					// min purchased amount and emails are only sent to database if customer type is provided
					customer_condition_id = await this.insertCustomerConditions({
						coupon_id,
						customer_group: input.customer_conditions.customer_groups,
						min_purchased_amount: input.customer_conditions.min_purchased_amount,
					});

					if (
						input.customer_conditions.customer_emails != null &&
						input.customer_conditions.customer_emails.length !== 0
					) {
						const email_ids = await this.insertCustomerEmails({
							customer_condition_id,
							emails: input.customer_conditions.customer_emails,
						});

						inserted_customer_email_ids.push(...email_ids);
					}
				}
			}

			return null;
		} catch (err) {
			if (coupon_id) {
				await this.deleteBuyXGetYDetails(coupon_id);
				await this.deleteCoupon(coupon_id);
			}
			if (inserted_condition_ids.length > 0) {
				await this.deleteProductConditions(inserted_condition_ids);
			}
			if (inserted_collection_ids.length > 0) {
				await this.deleteCollectionConditionGroups(inserted_collection_ids);
			}
			if (inserted_sku_ids.length > 0) {
				await this.deleteSKUsConditionGroups(inserted_sku_ids);
			}
			if (inserted_sub_category_ids.length > 0) {
				await this.deleteSubCategoriesConditionGroups(inserted_sub_category_ids);
			}
			if (buy_group_id) {
				await this.deleteConditionGroup(buy_group_id);
			}
			if (get_group_id) {
				await this.deleteConditionGroup(get_group_id);
			}
			if (target_group_id) {
				await this.deleteConditionGroup(target_group_id);
			}
			if (order_group_id) {
				await this.deleteConditionGroup(order_group_id);
			}
			if (customer_condition_id) {
				await this.deleteCustomerCondition(customer_condition_id);
			}
			if (inserted_customer_email_ids.length > 0) {
				await this.deleteCustomerEmails(inserted_customer_email_ids);
			}

			throw err;
		}
	}

	/** Get high level coupons for main page */
	@UseMiddleware(
		asServiceMiddleware<CouponsService>(verifyUser),
		requireAllPermissions([Permission.MANAGE_COUPONS]),
	)
	async getHighLevelCoupons({
		searchQuery,
		pageIndex = 0,
		pageSize = defaults.DEFAULT_COUPONS_PAGE_SIZE,
	}: {
		searchQuery?: string;
		pageIndex?: number;
		pageSize?: number;
	}): Promise<GetHighLevelCouponsResp> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase
				.from(this.COUPONS_TABLE)
				.select("coupon_id, code, status, coupon_type, start_timestamp, end_timestamp, created_at", {
					count: "exact",
				});

			if (searchQuery) {
				query = query.ilike("code", `%${searchQuery}%`);
			}

			query = query.order("created_at", { ascending: false });
			query = query.range(from, to);

			const { data, error: fetchError, count } = await query;

			let error: null | ApiError = null;

			if (fetchError || data == null) {
				error = new ApiError(fetchError.message, 500, [fetchError.details]);
			}

			return {
				coupons:
					data?.flatMap((coupon) => {
						return {
							id: coupon.coupon_id,
							code: coupon.code,
							coupon_type: coupon.coupon_type,
							end_timestamp: coupon.end_timestamp,
							start_timestamp: coupon.start_timestamp,
							status: coupon.status,
							created_at: coupon.created_at,
						};
					}) ?? null,
				total: count ?? 0,
				error: error ?? null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					coupons: null,
					total: 0,
					error: err,
				};
			}
			return {
				coupons: null,
				total: 0,
				error: new ApiError("Unknown error occured whiel fetching coupons.", 500, [err]),
			};
		}
	}

	// utility function to give us fully mapped coupon data 😊
	// private createFullCouponReturn(couponData: any): FullCoupon {
	// 	const coupon: FullCoupon = {
	// 		coupon_type: couponData.coupon_type,
	// 		created_at: couponData.created_at,
	// 		code: couponData.code,
	// 		description: couponData.description,
	// 		status: couponData.status,
	// 		discount_type: couponData.discount_type,
	// 		discount_value: couponData.discount_value,
	// 		start_timestamp: couponData.start_timestamp,
	// 		end_timestamp: couponData.end_timestamp,
	// 		// Other HighLevelCoupon fields if needed...
	// 		main_simple_conditions: couponData.condition_groups
	// 			.filter((group: any) => group.role === "discount_application")
	// 			.flatMap((group: any) =>
	// 				group.product_conditions.map((cond: any) => ({
	// 					type: cond.type,
	// 					operator: cond.operator,
	// 					value_decimal: cond.value_decimal ? cond.value_decimal.toString() : null,
	// 					value_ids: cond.value_ids || null,
	// 				})),
	// 			),

	// 		buy_x_get_y_conditions: couponData.buy_x_get_y_details
	// 			? {
	// 					buy_group: {
	// 						min_value_type: couponData.buy_x_get_y_details.buy_min_type,
	// 						min_value: couponData.buy_x_get_y_details.buy_min_value.toString(),
	// 						entitiy_type: "collection", // Fetch from condition_groups based on buy_group_id
	// 						ids: [], // Fetch from linking tables based on buy_group_id
	// 					},
	// 					get_group: {
	// 						get_quantity: couponData.buy_x_get_y_details.get_quantity.toString(),
	// 						discount_percent: couponData.buy_x_get_y_details.get_discount_percent.toString(),
	// 						entitiy_type: "sku", // Fetch from condition_groups based on get_group_id
	// 						ids: [], // Fetch from linking tables based on get_group_id
	// 					},
	// 				}
	// 			: null,

	// 		order_conditions: {
	// 			min_purchase_qty: couponData.min_purchase_qty ? couponData.min_purchase_qty.toString() : null,
	// 			min_purchase_amount: couponData.min_purchase_amount
	// 				? couponData.min_purchase_amount.toString()
	// 				: null,
	// 			max_uses_per_order: couponData.max_uses_per_order
	// 				? couponData.max_uses_per_order.toString()
	// 				: null,
	// 			conditions: couponData.condition_groups
	// 				.filter((group: any) => group.role === "eligibility")
	// 				.flatMap((group: any) =>
	// 					group.product_conditions.map((cond: any) => ({
	// 						type: cond.type,
	// 						operator: cond.operator,
	// 						value_decimal: cond.value_decimal ? cond.value_decimal.toString() : null,
	// 						value_ids: cond.value_ids || null,
	// 						min_quantity: cond.min_quantity.toString(),
	// 					})),
	// 				),
	// 		},

	// 		customer_conditions: couponData.customer_conditions
	// 			? {
	// 					customer_group: couponData.customer_conditions.customer_groups || null,
	// 					customer_emails:
	// 						couponData.customer_conditions.customer_emails.map((email: any) => email.email) ||
	// 						[],
	// 					min_purchased_amount: couponData.customer_conditions.min_purchased_amount
	// 						? couponData.customer_conditions.min_purchased_amount.toString()
	// 						: null,
	// 				}
	// 			: null,

	// 		usage_conditions: {
	// 			max_total_uses: couponData.max_total_uses ? couponData.max_total_uses.toString() : null,
	// 			one_use_per_customer: couponData.one_use_per_customer || null,
	// 		},
	// 	};

	// 	return coupon;
	// }

	/** Get single coupon details for admin panel coupons page */
	@UseMiddleware(
		asServiceMiddleware<CouponsService>(verifyUser),
		requireAllPermissions([Permission.MANAGE_COUPONS]),
	)
	async getSingleCouponDetails(coupon_id: number): Promise<GetFullCoupon> {
		try {
			const { data: couponData, error: couponError } = await this.supabase
				.from(this.COUPONS_TABLE)
				.select(
					`
					code,
					coupon_type,
					created_at,
					description,
					discount_type,
					discount_value,
					status,
					start_timestamp,
					end_timestamp,
					max_total_uses,
					max_uses_per_order,
					min_purchase_amount,
					min_purchase_qty,
					one_use_per_customer,
					${this.CONDITION_GROUPS_TABLE} (
						role,
						${this.PRODUCT_CONDITIONS_TABLE} (
							type,
							operator,
							value_decimal,
							value_ids,
							min_quantity
						)
					),
					${this.BUY_X_GET_Y_TABLE} (
						buy_min_type,
						buy_min_value,
						get_quantity,
						get_discount_percent,
						buy_group: ${this.CONDITION_GROUPS_TABLE}!buy_group_id (
							role,
							collections: ${this.CONDITION_GROUP_COLLECTIONS_TABLE} (collection_id),
							sub_categories: ${this.CONDITION_GROUP_SUB_CATEGORIES_TABLE} (sub_category_id),
							skus: ${this.CONDITION_GROUP_SKUS_TABLE} (sku_id)
						),
						get_group: ${this.CONDITION_GROUPS_TABLE}!get_group_id (
							role,
							collections: ${this.CONDITION_GROUP_COLLECTIONS_TABLE} (collection_id),
							sub_categories: ${this.CONDITION_GROUP_SUB_CATEGORIES_TABLE} (sub_category_id),
							skus: ${this.CONDITION_GROUP_SKUS_TABLE} (sku_id)
						)
					),
					${this.CUSTOMER_CONDITIONS_TABLE} (
						customer_type,
						min_purchased_amount,
						${this.CUSTOMER_EMAILS_TABLE} (
							email_id,
							email
						)
					)
				`,
				)
				.eq("coupon_id", coupon_id)
				.single();

			if (couponError || !couponData) {
				return {
					coupon: null,
					error: new ApiError(`${couponError?.message || "No data found"}`, 404, []),
				};
			}

			console.log("couponData: ", couponData);

			const coupon: FullCoupon = {
				id: coupon_id,
				coupon_type: couponData.coupon_type,
				created_at: couponData.created_at || null,
				code: couponData.code,
				description: couponData.description ?? null,
				status: couponData.status,
				discount_type: couponData.discount_type,
				discount_value: couponData.discount_value ?? null,
				start_timestamp: couponData.start_timestamp,
				end_timestamp: couponData.end_timestamp,

				main_simple_conditions: couponData.condition_groups
					.filter((group: any) => (group.role as GroupsConditionRole) === "discount_application")
					.flatMap((group: any) =>
						group.product_conditions.map((cond: any) => ({
							type: cond.type,
							operator: cond.operator,
							value_decimal:
								(cond.type as DiscountCondType) === "price" && cond.value_decimal
									? cond.value_decimal.toString()
									: null,
							value_ids:
								(cond.type as DiscountCondType) !== "price" && cond.value_ids
									? cond.value_ids
									: null,
						})),
					),

				buy_x_get_y_conditions:
					Array.isArray(couponData.buy_x_get_y_details) && couponData.buy_x_get_y_details.length > 0
						? {
								buy_group: {
									min_value_type: couponData.buy_x_get_y_details[0].buy_min_type,
									min_value:
										couponData.buy_x_get_y_details[0].buy_min_value?.toString() ?? "",
									entitiy_type: "collection",
									ids: [],
								},
								get_group: {
									get_quantity: couponData.buy_x_get_y_details[0].get_quantity.toString(),
									discount_percent:
										couponData.buy_x_get_y_details[0].get_discount_percent?.toString() ??
										"",
									entitiy_type: "collection",
									ids: [],
								},
							}
						: null,

				order_conditions: {
					min_purchase_qty: couponData.min_purchase_qty
						? couponData.min_purchase_qty.toString()
						: null,
					min_purchase_amount: couponData.min_purchase_amount
						? couponData.min_purchase_amount.toString()
						: null,
					max_uses_per_order: couponData.max_uses_per_order
						? couponData.max_uses_per_order.toString()
						: null,
					conditions:
						Array.isArray(couponData.condition_groups) && couponData.condition_groups.length > 0
							? couponData.condition_groups
									.filter(
										(group: any) => (group.role as GroupsConditionRole) === "eligibility",
									)
									.flatMap((group: any) =>
										group.product_conditions.map((cond: any) => ({
											type: cond.type,
											operator: cond.operator,
											value_decimal: cond.value_decimal
												? cond.value_decimal.toString()
												: null,
											value_ids: cond.value_ids || null,
											min_quantity: cond.min_quantity.toString(),
										})),
									)
							: null,
				},

				customer_conditions: {
					customer_group: couponData.customer_conditions[0]
						? couponData.customer_conditions[0].customer_type
						: null,
					customer_emails: couponData.customer_conditions[0]
						? (couponData.customer_conditions[0].customer_emails.map(
								(email: any) => email.email,
							) as string[])
						: [],
					min_purchased_amount:
						couponData.customer_conditions[0] &&
						couponData.customer_conditions[0].min_purchased_amount != null
							? couponData.customer_conditions[0].min_purchased_amount.toString()
							: null,
				},

				usage_conditions: {
					max_total_uses: couponData.max_total_uses ? couponData.max_total_uses.toString() : null,
					one_use_per_customer: couponData.one_use_per_customer || false,
				},
			};

			return { coupon, error: null };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					coupon: null,
					error: err,
				};
			}
			return {
				coupon: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}
}
