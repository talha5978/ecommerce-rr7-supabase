import { z } from "zod";
import { MetaDetailsInputSchema } from "./meta-details.schema";
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_SIZE } from "~/constants";

// For creation
export const ProductInputSchema = z.object({
	cover_image: z
		.instanceof(File, { message: "Cover image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			"Only JPEG, PNG, or WebP image formats are allowed."
		),

	description: z
		.string({ required_error: "Description is required." })
		.min(50, "Description must be at least 50 characters long.")
		.refine((value) => value.trim().length > 0, {
			message: "Description is required.",
		}),

	free_shipping: z.string().default("false"),
	is_featured: z.string().default("false"),

	meta_details: MetaDetailsInputSchema,

	name: z
		.string({ required_error: "Name is required." })
		.min(1, "Name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required.",
		}),

	status: z.string().default("true"),

	category: z.string({ required_error: "Category is required." }).min(1, "Category is required."),

	sub_category: z
		.string({ required_error: "Sub category is required." })
		.min(1, "Sub category is required."),
});

export type ProductFormValues = z.input<typeof ProductInputSchema>;

export const ProductActionDataSchema = z.object({
	cover_image: z.instanceof(File),
	description: z.string(),
	free_shipping: z.string(),
	is_featured: z.string(),
	meta_details: z.object({
		meta_title: z.string(),
		meta_description: z.string(),
		url_key: z.string(),
		meta_keywords: z.string(),
	}),
	name: z.string(),
	status: z.string(),
	sub_category: z.string(),
});

export type ProductActionData = z.infer<typeof ProductActionDataSchema>;

// For updation

export const ProductUpdateInputSchema = z.object({
    cover_image: z.union([
        z.instanceof(File, { message: "Cover image is required." })
            .refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
            .refine(
                (file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
                "Only JPEG, PNG, or WebP image formats are allowed."
            ),
        z.string().min(1, "Cover image path is required."),
    ]),
    description: z
        .string({ required_error: "Description is required." })
        .min(50, "Description must be at least 50 characters long.")
        .refine((value) => value.trim().length > 0, { message: "Description is required." }),
    free_shipping: z.string().default("false"),
    is_featured: z.string().default("false"),
    meta_details: MetaDetailsInputSchema,
    name: z
        .string({ required_error: "Name is required." })
        .min(1, "Name is required.")
        .refine((value) => value.trim().length > 0, { message: "Name is required." }),
    status: z.string().default("true"),
    category: z.string({ required_error: "Category is required." }).min(1, "Category is required."),
    sub_category: z
        .string({ required_error: "Sub category is required." })
        .min(1, "Sub category is required."),
});

export type ProductUpdateFormValues = z.input<typeof ProductUpdateInputSchema>;

export const ProductUpdateActionDataSchema = z.object({
	cover_image: z.union([z.instanceof(File), z.string()]).optional(),
	description: z.string().optional(),
	free_shipping: z.string().optional(),
	is_featured: z.string().optional(),
	meta_details: z
		.object({
			meta_title: z.string().optional(),
			meta_description: z.string().optional(),
			url_key: z.string().optional(),
			meta_keywords: z.string().optional(),
		})
		.optional(),
	name: z.string().optional(),
	status: z.string().optional(),
	sub_category: z.string().optional(),
});

export type ProductUpdateActionData = z.infer<typeof ProductUpdateActionDataSchema>;