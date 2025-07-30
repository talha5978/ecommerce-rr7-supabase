import { z } from "zod";

export const ProductAttributesInputSchema = z.object({
	attribute_type: z
		.string({ required_error: "Attribute type is required." })
		.min(1, "Attribute type is required."),

	name: z
		.string({ required_error: "Attribute name is required." })
		.min(1, "Attribute name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Attribute name is required.",
		}),

	value: z
		.string({ required_error: "Attribute value is required." })
		.min(1, "Attribute value is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Attribute value is required.",
		}),
});

export type ProductAttributesFormValues = z.input<typeof ProductAttributesInputSchema>;
export type ProductAttributeActionData = z.infer<typeof ProductAttributesInputSchema>;

// For updation

export const ProductAttributesUpdateActionSchema = z.object({
	attribute_type: z.string().optional(),
	name: z.string().optional(),
	value: z.string().optional(),
});

export type ProductAttributesUpdateActionData = z.infer<typeof ProductAttributesUpdateActionSchema>;
