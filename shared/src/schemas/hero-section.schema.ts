import { z } from "zod";
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_SIZE } from "@ecom/shared/constants/constants";

const MIN_DESCRIPTION_LENGTH = 10;

// for hero-section creation
export const HeroSectionCreateSchema = z.object({
	description: z
		.string({ required_error: "Description is required." })
		.min(
			MIN_DESCRIPTION_LENGTH,
			`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`,
		)
		.refine((value) => value.trim().length > 0, {
			message: "Description is required.",
		}),

	sort_order: z.string().optional().default("1"),

	url: z
		.string({ required_error: "URL is required." })
		.min(1, "URL is required.")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"URL must be lowercase, alphanumeric, and hyphen-separated only.",
		)
		.refine((value) => value.trim().length > 0, {
			message: "URL is required.",
		}),

	status: z.string().default("true"),

	image: z
		.instanceof(File, { message: "Image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			"Only JPEG, PNG, or WebP image formats are allowed.",
		),
});

export type HeroSectionCreateFormValues = z.input<typeof HeroSectionCreateSchema>;

export const HeroSectionCreateActionDataSchema = z.object({
	description: z.string(),
	sort_order: z.number(),
	url: z.string(),
	status: z.string(),
	image: z.instanceof(File),
});

export type HeroSectionCreateData = z.infer<typeof HeroSectionCreateActionDataSchema>;

// for hero-section updation
export const HeroSectionUpdateSchema = z.object({
	description: z
		.string({ required_error: "Description is required." })
		.min(
			MIN_DESCRIPTION_LENGTH,
			`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`,
		)
		.refine((value) => value.trim().length > 0, {
			message: "Description is required.",
		}),

	sort_order: z.string().optional().default("1"),

	url: z
		.string({ required_error: "URL is required." })
		.min(1, "URL is required.")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"URL must be lowercase, alphanumeric, and hyphen-separated only.",
		)
		.refine((value) => value.trim().length > 0, {
			message: "URL is required.",
		}),

	status: z.string().default("true"),

	image: z.union([
		z
			.instanceof(File, { message: "Image is required." })
			.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
			.refine(
				(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
				"Only JPEG, PNG, or WebP image formats are allowed.",
			),
		z.string().min(1, "Image path is required."),
	]),
});

export type HeroSectionUpdateFormValues = z.input<typeof HeroSectionUpdateSchema>;

export const HeroSecUpdateActionDataSchema = z.object({
	image: z.union([z.instanceof(File), z.string()]).optional(),
	description: z.string().optional(),
	sort_order: z.number().optional(),
	url: z.string().optional(),
	status: z.string().optional(),
});

export type HeroUpdateActionData = z.infer<typeof HeroSecUpdateActionDataSchema>;
