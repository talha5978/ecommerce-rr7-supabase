import { z } from "zod";
import { type FilterOp, filterOps, sortTypeEnums, productVariantsSortByEnums } from "~/constants";

export const defaultOp = "eq";

export const ProductVariantsFilterFormSchema = z.object({
	q: z.string().optional(),
	page: z.string().optional(),
	size: z.string().optional(),
	status: z.enum(["true", "false", "null"]).optional(),
	original_price: z.string().optional(),
	original_price_op: z.enum(filterOps).default(defaultOp).optional(),
	sale_price: z.string().optional(),
	sale_price_op: z.enum(filterOps).default(defaultOp).optional(),
	stock: z.array(z.number(), z.number()).optional(),
	reorder_level: z.string().optional(),
	reorder_level_op: z.enum(filterOps).default(defaultOp).optional(),
	createdAt: z
		.object({
			from: z.date(),
			to: z.date(),
		})
		.nullable()
		.optional(),
	sortBy: z.enum(productVariantsSortByEnums).optional(),
	sortType: z.enum(sortTypeEnums).optional(),
});

export type ProductVaraintsFilterFormData = z.infer<typeof ProductVariantsFilterFormSchema>;

export interface ProductVariantsFilters {
	status?: boolean;
	original_price?: number;
	original_price_op?: FilterOp;
	sale_price?: number;
	sale_price_op?: FilterOp;
	stock?: number[];
	reorder_level?: number;
	reorder_level_op?: FilterOp;
	createdAt?: { from: Date; to: Date } | null;
	sortBy?: ProductVaraintsFilterFormData["sortBy"];
	sortType?: ProductVaraintsFilterFormData["sortType"];
}