import { z } from "zod";
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_SIZE } from "~/constants";

// For creation
export const ProductVariantInputSchema = z.object({
	images: z
		.array(
			z
				.instanceof(File, { message: "Image is required." })
				.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
				.refine(
					(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
					"Only JPEG, PNG, or WebP image formats are allowed.",
				)
				.nullable(),
		)
		.refine(
			(arr) =>
				arr.filter((file) => Boolean(file)).length >= 1 &&
				arr.filter((file) => Boolean(file)).length <= 4,
			{
				message: "At least one image is required.",
			},
		),

	is_default: z.string().default("false").optional(),

	original_price: z
		.string({ required_error: "Original price is required." })
		.min(1, "Original price is required."),

	sale_price: z.string({ required_error: "Sale price is required." }).min(1, "Sale price is required."),

	reorder_level: z
		.string({ required_error: "Reorder level is required." })
		.min(1, "Reorder level is required.")
		.default("10"),

	sku: z
		.string({ required_error: "SKU is required." })
		.min(1, "SKU is required.")
		.refine((value) => value.trim().length > 0, { message: "SKU is required." }),

	status: z.string().default("true"),

	stock: z.string({ required_error: "Stock is required." }).min(1, "Stock is required."),

	weight: z.string().default("0").optional(),

	required_attributes: z
		.array(z.string().nonempty({ message: "This attribute is required." }))
		.length(2, "Both color and size attributes are required."),
});

export type ProductVariantFormValues = z.input<typeof ProductVariantInputSchema>;

export const ProductVariantActionDataSchema = z.object({
	images: z.array(z.instanceof(File)),
	is_default: z.string(),
	original_price: z.string(),
	sale_price: z.string(),
	reorder_level: z.string(),
	sku: z.string(),
	status: z.string(),
	stock: z.string(),
	weight: z.string(),
	attributes: z.array(z.string()),
});

export type ProductVariantActionData = z.infer<typeof ProductVariantActionDataSchema>;

export const DuplicateVariantActionDataSchema = z.object({
	images: z.array(z.string()),
	is_default: z.string(),
	original_price: z.number(),
	sale_price: z.number(),
	reorder_level: z.number(),
	sku: z.string(),
	stock: z.number(),
	weight: z.number(),
	product_id: z.string(),
	id: z.string(), // used to get the variant attributes
});

export type DuplicateVariantActionData = z.infer<typeof DuplicateVariantActionDataSchema>;

// For updation
export const ProductVariantUpdateInputSchema = z.object({
	images: z
		.array(
			z.union([
				z
					.instanceof(File, { message: "Image is required." })
					.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
					.refine(
						(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
						"Only JPEG, PNG, or WebP image formats are allowed.",
					)
					.nullable(),
				z.string().min(1, "Image path is required."),
			]),
		)
		.refine(
			(arr) =>
				arr.filter((file) => Boolean(file)).length >= 1 &&
				arr.filter((file) => Boolean(file)).length <= 4,
			{
				message: "At least one image is required.",
			},
		),

	is_default: z.string().default("false").optional(),

	original_price: z
		.string({ required_error: "Original price is required." })
		.min(1, "Original price is required."),

	sale_price: z.string({ required_error: "Sale price is required." }).min(1, "Sale price is required."),

	reorder_level: z
		.string({ required_error: "Reorder level is required." })
		.min(1, "Reorder level is required.")
		.default("10"),

	sku: z
		.string({ required_error: "SKU is required." })
		.min(1, "SKU is required.")
		.refine((value) => value.trim().length > 0, { message: "SKU is required." }),

	status: z.string().default("true"),

	stock: z.string({ required_error: "Stock is required." }),

	weight: z.string().default("0").optional(),

	required_attributes: z
		.array(z.string().nonempty({ message: "This attribute is required." }))
		.length(2, "Both color and size attributes are required."),
});

export type ProductVariantUpdateFormValues = z.input<typeof ProductVariantUpdateInputSchema>;

export const ProductVariantUpdateActionDataSchema = z.object({
	images: z.array(z.instanceof(File)).optional(),
	removed_images: z.array(z.string()).optional(),
	is_default: z.string().optional(),
	original_price: z.string().optional(),
	sale_price: z.string().optional(),
	reorder_level: z.string().optional(),
	sku: z.string().optional(),
	status: z.string().optional(),
	stock: z.string().optional(),
	weight: z.string().optional(),
	added_attributes: z.array(z.string()).optional(),
	removed_attributes: z.array(z.string()).optional(),
});

export type ProductVariantUpdateActionData = z.infer<typeof ProductVariantUpdateActionDataSchema>;

// SCHEMA FOR UPDATION OF STATUS
export const VariantStatusUpdateInputSchema = z.object({
	status: z.enum(["true", "false"]).default("true"),
});

export type VariantStatusUpdateFormValues = z.input<typeof VariantStatusUpdateInputSchema>;
