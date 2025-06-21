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
					"Only JPEG, PNG, or WebP image formats are allowed."
				)
				.nullable()
		)
		.refine(
			(arr) =>
				arr.filter((file) => Boolean(file)).length >= 1 &&
				arr.filter((file) => Boolean(file)).length <= 4,
			{
				message: "At least one image is required and a maximum of four images are allowed.",
			}
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

	optional_attributes: z.array(z.string().nullable()),
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
});

export type DuplicateVariantActionData = z.infer<typeof DuplicateVariantActionDataSchema>;

// For updation

// export const ProductUpdateInputSchema = z.object({
//     cover_image: z.union([
//         z.instanceof(File, { message: "Cover image is required." })
//             .refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
//             .refine(
//                 (file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
//                 "Only JPEG, PNG, or WebP image formats are allowed."
//             ),
//         z.string().min(1, "Cover image path is required."),
//     ]),
//     description: z
//         .string({ required_error: "Description is required." })
//         .min(50, "Description must be at least 50 characters long.")
//         .refine((value) => value.trim().length > 0, { message: "Description is required." }),
//     free_shipping: z.string().default("false"),
//     is_featured: z.string().default("false"),
//     meta_details: MetaDetailsInputSchema,
//     name: z
//         .string({ required_error: "Name is required." })
//         .min(1, "Name is required.")
//         .refine((value) => value.trim().length > 0, { message: "Name is required." }),
//     status: z.string().default("true"),
//     category: z.string({ required_error: "Category is required." }).min(1, "Category is required."),
//     sub_category: z
//         .string({ required_error: "Sub category is required." })
//         .min(1, "Sub category is required."),
// });

// export type ProductUpdateFormValues = z.input<typeof ProductUpdateInputSchema>;

// export const ProductUpdateActionDataSchema = z.object({
// 	cover_image: z.union([z.instanceof(File), z.string()]).optional(),
// 	description: z.string().optional(),
// 	free_shipping: z.string().optional(),
// 	is_featured: z.string().optional(),
// 	meta_details: z
// 		.object({
// 			meta_title: z.string().optional(),
// 			meta_description: z.string().optional(),
// 			url_key: z.string().optional(),
// 			meta_keywords: z.string().optional(),
// 		})
// 		.optional(),
// 	name: z.string().optional(),
// 	status: z.string().optional(),
// 	sub_category: z.string().optional(),
// });

// export type ProductUpdateActionData = z.infer<typeof ProductUpdateActionDataSchema>;