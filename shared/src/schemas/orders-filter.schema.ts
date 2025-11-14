import { z } from "zod";
import { productSortByEnums, sortTypeEnums } from "@ecom/shared/constants/constants";

export const OrdersFilterFormSchema = z.object({
	q: z.string().optional(),
	page: z.string().optional(),
	size: z.string().optional(),
	status: z.enum(["true", "false", "null"]).optional(),
	is_featured: z.enum(["true", "false", "null"]).optional(),
	category: z.array(z.string()).optional(),
	sub_category: z.array(z.string()).optional(),
	free_shipping: z.enum(["true", "false", "null"]).optional(),
	createdAt: z
		.object({
			from: z.date(),
			to: z.date(),
		})
		.nullable()
		.optional(),
	sortBy: z.enum(productSortByEnums).optional(),
	sortType: z.enum(sortTypeEnums).optional(),
});

export type OrdersFilterFormData = z.infer<typeof OrdersFilterFormSchema>;

export interface ProductFilters {
	status?: boolean;
	is_featured?: boolean;
	category?: string[];
	sub_category?: string[];
	free_shipping?: boolean;
	createdAt?: { from: Date; to: Date } | null;
	sortBy?: OrdersFilterFormData["sortBy"];
	sortType?: OrdersFilterFormData["sortType"];
}
