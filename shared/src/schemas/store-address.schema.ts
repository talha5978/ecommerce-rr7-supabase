import { z } from "zod";

export const UpdateStoreAddressSchema = z.object({
	address: z.object({
		formattedAddress: z.string().min(1, "Address is required"),
		lat: z.number(),
		lng: z.number(),
	}),
});

export type UpdateStoreAddressData = z.infer<typeof UpdateStoreAddressSchema>;

export const CheckerSchema = z.object({
	address: z.object({
		formattedAddress: z.string().optional(),
		lat: z.number().optional(),
		lng: z.number().optional(),
	}),
});
