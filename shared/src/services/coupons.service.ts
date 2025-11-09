import type { CouponActionData } from "@ecom/shared/schemas/coupons.schema";
import type {
	CouponType,
	DiscountCustomerGrps,
	FullCoupon,
	FP_GetAllCouponsDetailsResp,
	GetFullCoupon,
	GetHighLevelCouponsResp,
} from "@ecom/shared/types/coupons";
import { ApiError } from "@ecom/shared/utils/ApiError";
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

class Utils extends Service {
	async checkForDuplicateCode(input_code: string) {
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

	async deleteCoupon(coupon_id: number) {
		await this.supabase.from(this.COUPONS_TABLE).delete().eq("coupon_id", coupon_id);
	}

	async insertSpecificCouponProducts({
		coupon_id,
		product_ids,
	}: {
		coupon_id: number;
		product_ids: string[];
	}): Promise<string[]> {
		let payload: {
			coupon_id: number;
			variant_id: string;
		}[] = [];

		// We are nameing it product_id but it is actually an individual sku (variant id)

		for (const product_id of product_ids) {
			payload.push({
				coupon_id,
				variant_id: product_id,
			});
		}

		const { data: ids, error } = await this.supabase
			.from(this.SPECIFIC_COUPON_PRODUCTS_TABLE)
			.insert(payload)
			.select("variant_id");

		if (error) {
			throw new ApiError(
				`Failed to insert specific coupon products: ${error.message}`,
				Number(error.code),
				[error.details],
			);
		}

		return ids.map((id) => id.variant_id) ?? [];
	}

	async deleteSpecificCouponProducts(ids: string[]) {
		await this.supabase.from(this.SPECIFIC_COUPON_PRODUCTS_TABLE).delete().in("variant_id", ids);
	}

	async insertCustomerConditions({
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

	async deleteCustomerCondition(customer_condition_id: number) {
		await this.supabase
			.from(this.CUSTOMER_CONDITIONS_TABLE)
			.delete()
			.eq("customer_condition_id", customer_condition_id);
	}

	async insertCustomerEmails({
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

	async deleteCustomerEmails(email_ids: number[]) {
		await this.supabase.from(this.CUSTOMER_EMAILS_TABLE).delete().in("email_id", email_ids);
	}

	/**Utility function to give us fully mapped coupon data */
	getMappedFullCoupon = (item: any, coupon_id: number): FullCoupon => {
		console.log("ITEM IN THE  MAPPING FUNCTION", item[this.SPECIFIC_COUPON_PRODUCTS_TABLE]);

		const coupon: FullCoupon = {
			id: coupon_id ?? item?.coupon_id,
			coupon_type: item.coupon_type,
			created_at: item.created_at || null,
			code: item.code,
			description: item.description ?? null,
			status: item.status,
			discount_type: item.discount_type,
			discount_value: item.discount_value ?? null,
			start_timestamp: item.start_timestamp,
			end_timestamp: item.end_timestamp,
			specific_products: item[this.SPECIFIC_COUPON_PRODUCTS_TABLE].map(
				(item: {
					sku: {
						id: string;
						sku: string;
						product: {
							cover_image: string;
						};
					};
				}) => {
					return {
						id: item.sku.id,
						sku: item.sku.sku,
						cover_image: item.sku.product?.cover_image,
					};
				},
			),
			customer_conditions: {
				customer_group: item.customer_conditions[0]
					? item.customer_conditions[0].customer_type
					: null,
				customer_emails: item.customer_conditions[0]
					? (item.customer_conditions[0].customer_emails.map(
							(email: any) => email.email,
						) as string[])
					: [],
				min_purchased_amount:
					item.customer_conditions[0] && item.customer_conditions[0].min_purchased_amount != null
						? item.customer_conditions[0].min_purchased_amount.toString()
						: null,
			},

			usage_conditions: {
				max_total_uses: item.max_total_uses ? item.max_total_uses.toString() : null,
				one_use_per_customer: item.one_use_per_customer || false,
			},
		};
		// console.log("coupon in the mapping function", coupon.buy_x_get_y_conditions?.buy_group.entities);

		return coupon;
	};
}

@UseClassMiddleware(loggerMiddleware)
export class CouponsService extends Service {
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
		// console.log("Input in service 🗽", input);
		if (!coupon_type) {
			throw new ApiError("Invalid coupon type", 400, []);
		}
		// return

		let coupon_id: number | null = null;
		let customer_condition_id: number | null = null;
		const inserted_customer_email_ids: number[] = [];
		const inserted_specific_product_ids: string[] = [];

		const utilsSvc = await this.createSubService(Utils);

		try {
			// Check for duplicate code
			await utilsSvc.checkForDuplicateCode(input.code);

			// Insert into coupons
			const { data: couponData, error: couponError } = await this.supabase
				.from(this.COUPONS_TABLE)
				.insert({
					coupon_type,
					code: input.code,
					description: input.description,
					status: stringToBooleanConverter(input.status),
					discount_type: input.discount_type,
					discount_value: input.discount_value ? parseFloat(input.discount_value) : null,
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
			// console.log(couponData);

			if (couponError || !couponData) {
				throw new ApiError(
					`Failed to insert coupon: ${couponError?.message || "No data returned"}`,
					500,
					[],
				);
			}

			coupon_id = couponData.coupon_id;

			// Handle specific_target_products
			if (input.specific_target_products && input.specific_target_products.length > 0) {
				const product_ids = await utilsSvc.insertSpecificCouponProducts({
					coupon_id,
					product_ids: input.specific_target_products,
				});

				inserted_specific_product_ids.push(...product_ids);
			}

			// Handle customer_conditions
			if (input.customer_conditions) {
				if (input.customer_conditions.customer_groups != null) {
					// min purchased amount and emails are only sent to database if customer type is provided
					customer_condition_id = await utilsSvc.insertCustomerConditions({
						coupon_id,
						customer_group: input.customer_conditions.customer_groups,
						min_purchased_amount: input.customer_conditions.min_purchased_amount,
					});

					if (
						input.customer_conditions.customer_emails != null &&
						input.customer_conditions.customer_emails.length !== 0
					) {
						const email_ids = await utilsSvc.insertCustomerEmails({
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
				await utilsSvc.deleteCoupon(coupon_id);
			}
			if (customer_condition_id) {
				await utilsSvc.deleteCustomerCondition(customer_condition_id);
			}
			if (inserted_customer_email_ids.length > 0) {
				await utilsSvc.deleteCustomerEmails(inserted_customer_email_ids);
			}
			if (inserted_specific_product_ids.length > 0) {
				await utilsSvc.deleteSpecificCouponProducts(inserted_specific_product_ids);
			}

			throw err;
		}
	}

	/** Delete coupon */
	@UseMiddleware(
		asServiceMiddleware<CouponsService>(verifyUser),
		requireAllPermissions([Permission.MANAGE_COUPONS]),
	)
	async deleteFullCoupon({ coupon_id }: { coupon_id: number }) {
		try {
			const { data, error: fetchError } = await this.supabase
				.from(this.COUPONS_TABLE)
				.select(
					`
					${this.CUSTOMER_CONDITIONS_TABLE} (
						customer_condition_id,
						${this.CUSTOMER_EMAILS_TABLE} (
							email_id
						)
					)
				`,
				)
				.eq("coupon_id", coupon_id)
				.single();

			if (fetchError || !data) {
				throw new ApiError(
					`Failed to fetch coupon: ${fetchError?.message || "No data returned"}`,
					500,
					[],
				);
			}

			const utilsSvc = await this.createSubService(Utils);
			await utilsSvc.deleteCoupon(coupon_id);

			if (data.customer_conditions.length > 0) {
				const customer_condition_id = data.customer_conditions[0].customer_condition_id;
				await utilsSvc.deleteCustomerCondition(customer_condition_id);
				if (data.customer_conditions[0].customer_emails.length > 0) {
					const email_ids = data.customer_conditions[0].customer_emails.map(
						(email) => email.email_id,
					);
					await utilsSvc.deleteCustomerEmails(email_ids);
				}
			}

			return null;
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			} else {
				throw new ApiError("Failed to delete coupon", 500, []);
			}
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
					one_use_per_customer,
					${this.SPECIFIC_COUPON_PRODUCTS_TABLE}(
						sku: ${this.PRODUCT_VARIANT_TABLE}!inner(
							id, sku, ${this.PRODUCTS_TABLE}!inner(
								cover_image
							)
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
			// console.log(couponData);

			if (couponError || !couponData) {
				return {
					coupon: null,
					error: new ApiError(`${couponError?.message || "No data found"}`, 404, []),
				};
			}
			//console.log("Coupon data in the service func. ", couponData);

			const utilsSvc = await this.createSubService(Utils);
			const coupon = utilsSvc.getMappedFullCoupon(couponData, coupon_id);

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
				error: new ApiError("Unknown error", err?.code ?? 500, [err]),
			};
		}
	}

	/** Update a coupon */
	@UseMiddleware(
		asServiceMiddleware<CouponsService>(verifyUser),
		requireAllPermissions([Permission.MANAGE_COUPONS]),
	)
	async updateCouponTimeSlots({
		input,
		coupon_id,
	}: {
		input: {
			start_timestamp: string | null;
			end_timestamp: string | null;
		};
		coupon_id: number;
	}): Promise<void | null> {
		const payload = {
			...(input.start_timestamp != null &&
				input.start_timestamp !== "" && { start_timestamp: input.start_timestamp }),
			...(input.end_timestamp != null &&
				input.end_timestamp !== "" && { end_timestamp: input.end_timestamp }),
		};

		if (Object.keys(payload).length === 0) {
			throw new ApiError("Invalid Input", 400, []);
		}

		try {
			const { error: couponError } = await this.supabase
				.from(this.COUPONS_TABLE)
				.update(payload)
				.eq("coupon_id", coupon_id);

			if (couponError) {
				throw new ApiError(`${couponError?.message || "No data returned"}`, 500, []);
			}

			return null;
		} catch (err) {
			throw err;
		}
	}
}

@UseClassMiddleware(loggerMiddleware)
export class FP_CouponsService extends CouponsService {
	/** This method is used to get all coupons all details on the root of the front panel */
	async getAllFullCoupons(): Promise<FP_GetAllCouponsDetailsResp> {
		try {
			const { data: couponData, error: couponError } = await this.supabase
				.from(this.COUPONS_TABLE)
				.select(
					`
					coupon_id,
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
					one_use_per_customer,
					${this.SPECIFIC_COUPON_PRODUCTS_TABLE}(
						sku: ${this.PRODUCT_VARIANT_TABLE}!inner(
							id, sku, ${this.PRODUCTS_TABLE}!inner(
								cover_image
							)
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
				.eq("status", true)
				.lte("start_timestamp", new Date().toISOString())
				.gte("end_timestamp", new Date().toISOString())
				.order("created_at", { ascending: false });

			if (couponError || !couponData) {
				return {
					coupons: null,
					error: new ApiError(`${couponError?.message || "No data found"}`, 404, []),
				};
			}

			// console.log("couponData: ", couponData);

			let coupons: FullCoupon[] = [];
			const utilsSvc = await this.createSubService(Utils);

			for (const item of couponData) {
				const coupon: FullCoupon = utilsSvc.getMappedFullCoupon(item, item.coupon_id);
				coupons.push(coupon);
			}
			// console.log(coupons);

			return { coupons, error: null };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					coupons: null,
					error: err,
				};
			}
			return {
				coupons: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}
}
