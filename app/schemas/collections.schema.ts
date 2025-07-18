import { z } from "zod";
import { MetaDetailsInputSchema } from "./meta-details.schema";
import { ALLOWED_IMAGE_FORMATS, collectionsSelectionTypeEnum, MAX_IMAGE_SIZE } from "~/constants";
import { getSimpleImgFormats } from "~/components/Custom-Inputs/image-input";

// For creation
export const CollectionInputSchema = z.object({
	image: z
		.instanceof(File, { message: "Image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			"Only JPEG, PNG, or WebP image formats are allowed."
		),

	description: z
		.string({ required_error: "Description is required." })
		.min(10, "Description must be at least 10 characters long.")
		.refine((value) => value.trim().length > 0, {
			message: "Description is required.",
		}),

	meta_details: MetaDetailsInputSchema,

	sort_order: z.string().optional().default("1"),

	name: z
		.string({ required_error: "Name is required." })
		.min(1, "Name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required.",
		}),

	status: z.string().default("true"),

	// Product selection fields
	selections: z
		.array(
			z.object({
				name: z.string().min(1, "Product name is required."),
				id: z.string().min(1, "At least one product must be selected"),
			})
		)
		.min(1, "At least one product is required")
		.refine(
			(selections) =>
				selections.every((product) => product.id.length > 0),
			{
				message: "At least one product must be selected",
			}
		),
});

export type CollectionFormValues = z.input<typeof CollectionInputSchema>;

export const CollectionActionDataSchema = z.object({
	image: z.instanceof(File),
	description: z.string(),
	meta_details: z.object({
		meta_title: z.string(),
		meta_description: z.string(),
		url_key: z.string(),
		meta_keywords: z.string(),
	}),
	name: z.string(),
	status: z.string(),
	sort_order: z.string(),
	product_ids: z.array(z.string()),
});

export type CollectionActionData = z.infer<typeof CollectionActionDataSchema>;

// For updation

export const CollectionUpdateInputSchema = z.object({
    image: z.union([
        z.instanceof(File, { message: "Image is required." })
            .refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
            .refine(
                (file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
                `Only ${getSimpleImgFormats()} image formats are allowed.`
            ),
        z.string().min(1, "Image path is required."),
    ]),
    
	description: z
		.string({ required_error: "Description is required." })
		.min(10, "Description must be at least 10 characters long.")
		.refine((value) => value.trim().length > 0, {
			message: "Description is required.",
		}),

	meta_details: MetaDetailsInputSchema,

	sort_order: z.string().optional().default("1"),

	name: z
		.string({ required_error: "Name is required." })
		.min(1, "Name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required.",
		}),

	status: z.string().default("true"),

	// Product selection fields
	selections: z
		.array(
			z.object({
				name: z.string().min(1, "Product name is required."),
				id: z.string().min(1, "At least one product must be selected"),
			})
		)
		.min(1, "At least one product is required")
		.refine(
			(selections) =>
				selections.every((product) => product.id.length > 0),
			{
				message: "At least one product must be selected",
			}
		),
});

export type CollectionUpdateFormValues = z.input<typeof CollectionUpdateInputSchema>;

export const CollectionUpdateActionDataSchema = z.object({
	image: z.instanceof(File).optional(),
	removed_image: z.string().optional(),
	description: z.string().optional(),
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
	sort_order: z.string().optional(),
	added_product_ids: z.array(z.string()).optional(),
	removed_product_ids: z.array(z.string()).optional(),
});

export type CollectionUpdateActionData = z.infer<typeof CollectionUpdateActionDataSchema>;


// SCHEMA FOR UPDATION OF STATUS
export const CollectionStatusUpdateInputSchema = z.object({
    status: z.enum(["true", "false"]).default("true"),
});

export type CollectionStatusUpdateFormValues = z.input<typeof CollectionStatusUpdateInputSchema>;