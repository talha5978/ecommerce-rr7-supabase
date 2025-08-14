import { z } from "zod";
import { productSortByEnums, sortTypeEnums } from "@ecom/shared/constants/constants";

export const ProductFilterFormSchema = z.object({
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

export type ProductsFilterFormData = z.infer<typeof ProductFilterFormSchema>;

export interface ProductFilters {
	status?: boolean;
	is_featured?: boolean;
	category?: string[];
	sub_category?: string[];
	free_shipping?: boolean;
	createdAt?: { from: Date; to: Date } | null;
	sortBy?: ProductsFilterFormData["sortBy"];
	sortType?: ProductsFilterFormData["sortType"];
}
