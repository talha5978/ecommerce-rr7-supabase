import { z } from "zod";

export const loginSchema = z.object({
	email: z.string({ required_error: "Email is required" }).min(1, "Email is required").email(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
