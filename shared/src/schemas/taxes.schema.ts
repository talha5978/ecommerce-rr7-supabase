import { z } from "zod";

export const CreateTaxSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.refine((data) => data.trim().length > 0, "Name is required"),

	rate: z
		.string()
		.min(1, "Tax rate is required")
		.refine((data) => data.trim().length > 0, "Tax rate is required"),

	tax_type: z
		.string()
		.min(1, "Tax type is required")
		.refine((data) => data.trim().length > 0, "Tax type is required"),

	status: z
		.string()
		.min(1, "Status is required")
		.refine((data) => data.trim().length > 0, "Status is required"),

	categories: z.array(z.string()).refine((data) => data.length > 0, "At least one category is required"),
});

export type CreateTaxFormValues = z.infer<typeof CreateTaxSchema>;

export const CreateTaxTypeSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.refine((data) => data.trim().length > 0, "Name is required"),
});

export type CreateTaxTypeFormValues = z.infer<typeof CreateTaxTypeSchema>;
