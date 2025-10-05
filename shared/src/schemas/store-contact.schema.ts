import { z } from "zod";

export const UpdateStoreContactSchema = z.object({
	phone_1: z
		.string({ required_error: "Primary phone number is required" })
		.min(1, "Primary phone number is required"),
	phone_2: z
		.string({ required_error: "Secondary phone number is required" })
		.min(1, "Secondary phone number is required"),
	email_1: z
		.string({ required_error: "Email is required" })
		.email({ message: "Please enter a valid email address" })
		.min(1, "Email is required"),
	email_2: z
		.string({ required_error: "Email is required" })
		.email({ message: "Please enter a valid email address" })
		.min(1, "Email is required"),
});

export type UpdateStoreContactData = z.infer<typeof UpdateStoreContactSchema>;

export const CheckerSchema = z
	.object({
		phone_1: z.string().optional(),
		phone_2: z.string().optional(),
		email_1: z.string().email().optional(),
		email_2: z.string().email().optional(),
	})
	.refine((values) => {
		const { phone_1, phone_2, email_1, email_2 } = values;
		return phone_1 || phone_2 || email_1 || email_2;
	});
