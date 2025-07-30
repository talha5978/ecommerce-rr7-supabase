import { z } from "zod";
import {
	DEFAULT_DICOUNT_TYPE,
	PRODUCT_COND_OPERATOR_ENUM,
	DISCOUNT_COND_TYPE_ENUM,
	DISCOUNT_TYPE_ENUM,
	DISCOUNT_CUSTOMER_TYPE_ENUM,
} from "~/constants";

// Capital letters, small letters, 0 to 9 and [-]
const CodeRegx: RegExp = /^[a-zA-Z0-9-]+$/;

const ConditionSchema = z.object({
	type: z.enum(DISCOUNT_COND_TYPE_ENUM),
	operator: z.enum(PRODUCT_COND_OPERATOR_ENUM),
	value_text: z.string().optional(),
	value_decimal: z.string().optional(),
	min_quantity: z.string().optional(),
});

const BuyXGetYSchema = z.object({
	sku: z.string({ required_error: "Sku is required." }),
	buy_qty: z.string({ required_error: "Buy quantity is required." }),
	get_qty: z.string({ required_error: "Get quantity is required." }),
	get_discount_percent: z.string({ required_error: "Get discount percent is required." }),
});

// For creation
export const CouponInputSchema = z
	.object({
		code: z
			.string({ required_error: "Code is required." })
			.regex(CodeRegx, "Code must be alphanumeric.")
			.min(1, "Code is required.")
			.refine((value) => value.trim().length > 0, {
				message: "Code is required.",
			}),
		status: z.enum(["true", "false"]).default("true"),
		description: z.string().optional(),
		discount_type: z.enum(DISCOUNT_TYPE_ENUM).default(DEFAULT_DICOUNT_TYPE),
		discount_value: z.string().optional(),
		one_use_per_customer: z.enum(["true", "false"]).optional().default("false"),
		want_max_total_uses: z.enum(["yes", "no"]).optional().default("no"),
		max_total_uses: z.string().optional(),
		want_max_uses_per_order: z.enum(["yes", "no"]).optional().default("no"),
		max_uses_per_order: z.string().optional(),
		min_purchase_amount: z.string().optional(),
		min_purchase_qty: z.string().optional(),
		start_timestamp: z.date(),
		end_timestamp: z.date(),
		fixed_products: z.array(ConditionSchema).optional().default([]),
		buy_x_get_y: z.array(BuyXGetYSchema).optional().default([]),
		conditions: z
			.array(ConditionSchema)
			.optional()
			.default([])
			.refine(
				(conditions) => {
					if (conditions.length > 0) {
						conditions.forEach((condition) => {
							if (
								condition.type == null ||
								condition.operator == null ||
								condition.min_quantity == null
							) {
								return false;
							}
						});
					}

					return true;
				},
				{
					message: "Please fill out all fields in the order condition(s).",
				},
			),
		customer_groups: z.enum(DISCOUNT_CUSTOMER_TYPE_ENUM).nullable(),
		customer_emails: z
			.array(z.string().email({ message: "Invalid email address provided." }))
			.optional()
			.default([]),
	})
	.refine((data) => {
		if (data.discount_type === "fixed_product" || data.discount_type === "percentage_product") {
			return data.fixed_products.length === 0 ? "Target products are required." : true;
		}

		if (data.discount_type !== "buy_x_get_y") {
			return data.discount_value === null ? "Discount value is required." : true;
		}

		if (data.want_max_total_uses === "yes" && data.max_total_uses == null) {
			return "Max total uses is required.";
		}

		return true;
	});

export type CouponFormValues = z.input<typeof CouponInputSchema>;

// export const ProductActionDataSchema = z.object({
// 	cover_image: z.instanceof(File),
// 	description: z.string(),
// 	free_shipping: z.string(),
// 	is_featured: z.string(),
// 	meta_details: z.object({
// 		meta_title: z.string(),
// 		meta_description: z.string(),
// 		url_key: z.string(),
// 		meta_keywords: z.string(),
// 	}),
// 	name: z.string(),
// 	status: z.string(),
// 	sub_category: z.string(),
// 	optional_attributes: z.array(z.string()),
// });

// export type ProductActionData = z.infer<typeof ProductActionDataSchema>;
