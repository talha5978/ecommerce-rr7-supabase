import { z } from "zod";
import {
	DEFAULT_DICOUNT_TYPE,
	DISCOUNT_TYPE_ENUM,
	DISCOUNT_CUSTOMER_TYPE_ENUM,
} from "@ecom/shared/constants/constants";

// Capital letters, small letters, 0 to 9 and [-]
const CodeRegx: RegExp = /^[a-zA-Z0-9-]+$/;

// For creation
export const CouponInputSchema = z
	.object({
		code: z
			.string({ required_error: "Code is required." })
			.min(1, "Code is required.")
			.max(25, "Code must be less than 25 characters.")
			.regex(CodeRegx, "Code can only contain letters, numbers, and hyphens.")
			.refine((value) => value.trim().length > 0, {
				message: "Code is required.",
			}),
		status: z.enum(["true", "false"]).default("true"),
		description: z.string().max(255, "Code description must be less than 255 characters.").optional(),
		discount_type: z.enum(DISCOUNT_TYPE_ENUM).default(DEFAULT_DICOUNT_TYPE),
		discount_value: z.string(),
		one_use_per_customer: z.enum(["true", "false"]).optional().default("true"),
		want_max_total_uses: z.enum(["yes", "no"]).optional().default("no"),
		max_total_uses: z.string().optional(),
		start_timestamp: z.date(),
		end_timestamp: z.date(),
		fixed_products: z.array(z.string()).optional().default([]),
		customer_groups: z.enum(DISCOUNT_CUSTOMER_TYPE_ENUM).nullable(),
		customer_emails: z
			.array(z.string().email({ message: "Invalid email address provided." }))
			.optional()
			.default([]),
		customer_min_purchased_amount: z.string().nullable(),
	})
	.refine((data) => data.end_timestamp > data.start_timestamp, {
		message: "Start date and time must be before end date and time.",
		path: ["start_timestamp"],
	})
	.refine((data) => data.end_timestamp > data.start_timestamp, {
		message: "End date and time must be after start date and time.",
		path: ["end_timestamp"],
	})
	.refine(
		(data) => {
			if (data.discount_type === "fixed_product" || data.discount_type === "percentage_product") {
				return data.fixed_products.length > 0;
			}
			return true;
		},
		{ message: "Target products are required.", path: ["fixed_products"] },
	)
	.refine(
		(data) => {
			return data.discount_value === "" || data.discount_value == null ? false : true;
		},
		{ message: "Discount value is required.", path: ["discount_value"] },
	)
	.refine(
		(data) =>
			data.want_max_total_uses === "yes"
				? data.max_total_uses != null && data.max_total_uses != ""
				: true,
		{
			message: "Max total uses are required.",
			path: ["max_total_uses"],
		},
	)
	.refine(
		(data) =>
			data.discount_type === "percentage_order" || data.discount_type === "percentage_product"
				? Number(data.discount_value) >= 0 && Number(data.discount_value) <= 100
				: true,
		{
			message: "Discount value must be between 0 and 100.",
			path: ["discount_value"],
		},
	);

export type CouponFormValues = z.input<typeof CouponInputSchema>;

export const CouponActionDataSchema = z
	.object({
		code: z.string().refine((value) => value.trim().length > 0, {
			message: "Code is required.",
		}),
		status: z.enum(["true", "false"]),
		description: z.string().nullable(),
		discount_type: z.enum(DISCOUNT_TYPE_ENUM),
		discount_value: z.string().nullable(),
		start_timestamp: z.string(),
		end_timestamp: z.string(),
		specific_target_products: z.array(z.string()).nullable(),
		customer_conditions: z.object({
			customer_groups: z.enum(DISCOUNT_CUSTOMER_TYPE_ENUM).nullable(),
			customer_emails: z.array(z.string().email()).nullable(),
			min_purchased_amount: z.string().nullable(),
		}),
		usage_conditions: z.object({
			max_total_uses: z.string().nullable(),
			one_use_per_customer: z.enum(["true", "false"]).nullable(),
		}),
	})
	.refine(
		(data) => {
			if (data.discount_type === "fixed_product" || data.discount_type === "percentage_product") {
				if (data?.specific_target_products == null) return false;
				return data?.specific_target_products.length > 0 ? true : false;
			}
			return true;
		},
		{ message: "Target products are required.", path: ["s?.specific_target_products"] },
	);

export type CouponActionData = z.infer<typeof CouponActionDataSchema>;

export const TimeSlotUpdateSchema = z
	.object({
		start_timestamp: z.date({ required_error: "Start date and time is required." }),
		end_timestamp: z.date({ required_error: "End date and time is required." }),
	})
	.refine((data) => data.end_timestamp > data.start_timestamp, {
		message: "Start date and time must be before end date and time.",
		path: ["start_timestamp"],
	})
	.refine((data) => data.end_timestamp > data.start_timestamp, {
		message: "End date and time must be after start date and time.",
		path: ["end_timestamp"],
	});

export type TimeSlotUpdateInput = z.infer<typeof TimeSlotUpdateSchema>;
