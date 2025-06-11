import { z } from "zod";

export const MetaDetailsInputSchema = z.object({
	meta_description: z
		.string({ required_error: "Meta description is required." })
		.min(1, "Meta description is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Meta description is required.",
		}),

	meta_title: z
		.string({ required_error: "Meta title is required." })
		.min(1, "Meta title is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Meta title is required.",
		}),

	url_key: z
		.string({ required_error: "URL key is required." })
		.min(1, "URL key is required.")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"URL key must be lowercase, alphanumeric, and hyphen-separated only."
		)
		.refine((value) => value.trim().length > 0, {
			message: "URL key is required.",
		}),

	meta_keywords: z
		.array(z.string())
		.optional()
		.default([]),
});

// for category creation
export const CategoryInputSchema = z.object({
	category_name: z
		.string({ required_error: "Category name is required." })
		.min(1, "Category name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Category name is required.",
		}),

	description: z
		.string({ required_error: "Description is required." })
		.min(50, "Description must be at least 50 characters long.")
		.refine((value) => value.trim().length > 0, {
			message: "Description is required.",
		}),

	sort_order: z
		.string()
		.optional()
		.default("1"),

	meta_details: MetaDetailsInputSchema,
});

export type MetaDetailsInput = Omit<z.infer<typeof MetaDetailsInputSchema>, "meta_keywords"> & { meta_keywords: string[] };

export type CategoryFormValues = z.input<typeof CategoryInputSchema>;


export const CategoryActionDataSchema = z.object({
	category_name: z.string(),
	description: z.string(),
	sort_order: z.number(),
	meta_details: z.object({
		meta_title: z.string(),
		meta_description: z.string(),
		url_key: z.string(),
		meta_keywords: z.string(),
	}),
});

export type CategoryActionData = z.infer<typeof CategoryActionDataSchema>;

export type CategoryInput = Omit<z.infer<typeof CategoryInputSchema>, "sort_order"> & { sort_order: number };


// For sub_categories creation
export const SubCategoryInputSchema = z.object({
	sub_category_name: z
		.string({ required_error: "Sub category name is required." })
		.min(1, "Sub category name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Sub category name is required.",
		}),

	description: z
		.string({ required_error: "Description is required." })
		.min(50, "Description must be at least 50 characters long.")
		.refine((value) => value.trim().length > 0, {
			message: "Description is required.",
		}),
	
	parent_id: z
		.string({ required_error: "Parent category is required." })
		.min(1, "Parent category is required."),

	sort_order: z
		.string()
		.optional()
		.default("1"),

	meta_details: MetaDetailsInputSchema,
});

export type SubCategoryFormValues = z.input<typeof SubCategoryInputSchema>;

export const SubCategoryActionDataSchema = z.object({
	sub_category_name: z.string(),
	description: z.string(),
	sort_order: z.number(),
	parent_id: z.string(),
	meta_details: z.object({
		meta_title: z.string(),
		meta_description: z.string(),
		url_key: z.string(),
		meta_keywords: z.string(),
	}),
});

export type SubCategoryActionData = z.infer<typeof SubCategoryActionDataSchema>;


// for category updation

export const CategoryUpdateActionDataSchema = z.object({
	category_name: z.string().optional(),
	description: z.string().optional(),
	sort_order: z.number().optional(),
	meta_details: z
		.object({
			meta_title: z.string().optional(),
			meta_description: z.string().optional(),
			url_key: z.string().optional(),
			meta_keywords: z.string().optional(),
		})
		.optional(),
});
export type CategoryUpdateActionData = z.infer<typeof CategoryUpdateActionDataSchema>;

// for sub category updation

export const SubCategoryUpdateActionDataSchema = z.object({
	sub_category_name: z.string().optional(),
	description: z.string().optional(),
	sort_order: z.number().optional(),
	meta_details: z
		.object({
			meta_title: z.string().optional(),
			meta_description: z.string().optional(),
			url_key: z.string().optional(),
			meta_keywords: z.string().optional(),
		})
		.optional(),
});
export type SubCategoryUpdateActionData = z.infer<typeof SubCategoryUpdateActionDataSchema>;

