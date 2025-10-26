import z from "zod";

export const CheckoutSchema = z
	.object({
		shipping_address: z.object({
			first_name: z
				.string()
				.min(1, "First name is required")
				.refine((value) => value.trim().length > 0, {
					message: "First name is required",
				}),
			last_name: z
				.string()
				.min(1, "Last name is required")
				.refine((value) => value.trim().length > 0, {
					message: "Last name is required",
				}),
			email: z
				.string()
				.min(1, "Email is required")
				.refine((value) => value.trim().length > 0, {
					message: "Email is required",
				}),
			phone: z
				.string()
				.min(1, "Phone number is required")
				.refine((value) => value.trim().length > 0, {
					message: "Phone number is required",
				}),
			province: z.string().optional(),
			city: z
				.string()
				.min(1, "City is required")
				.refine((value) => value.trim().length > 0, {
					message: "City is required",
				}),
			postal_code: z.string().optional(),
			address: z.object({
				formattedAddress: z.string().min(1, "Address is required"),
				lat: z.number({ error: "Latitude is required" }),
				lng: z.number({ error: "Longitude is required" }),
			}),
		}),
		isBillingSameAsShipping: z.string().min(1, "Billing address is required"),
		billing_address: z
			.object({
				first_name: z
					.string()
					.min(1, "First name is required")
					.refine((value) => value.trim().length > 0, {
						message: "First name is required",
					}),
				last_name: z
					.string()
					.min(1, "Last name is required")
					.refine((value) => value.trim().length > 0, {
						message: "Last name is required",
					}),
				email: z
					.string()
					.min(1, "Email is required")
					.refine((value) => value.trim().length > 0, {
						message: "Email is required",
					}),
				phone: z
					.string()
					.min(1, "Phone number is required")
					.refine((value) => value.trim().length > 0, {
						message: "Phone number is required",
					}),
				province: z.string().optional(),
				city: z
					.string()
					.min(1, "City is required")
					.refine((value) => value.trim().length > 0, {
						message: "City is required",
					}),
				postal_code: z.string().optional(),
				address: z.object({
					formattedAddress: z.string().min(1, "Address is required"),
					lat: z.number({ error: "Latitude is required" }),
					lng: z.number({ error: "Longitude is required" }),
				}),
			})
			.optional(),
		manual_coupon: z.string().optional(),
	})
	.refine(
		(data) =>
			data.isBillingSameAsShipping === "y" ||
			(data.billing_address != null && Object.keys(data.billing_address).length > 0),
		{
			message: "Billing address is required if not same as shipping",
			path: ["billing_address"],
		},
	);

export type CheckoutFormData = z.infer<typeof CheckoutSchema>;
