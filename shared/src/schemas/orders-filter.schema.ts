import { z } from "zod";
import { type FilterOp, filterOps, orderSortByEnums, sortTypeEnums } from "@ecom/shared/constants/constants";
import type { OrderStatus } from "@ecom/shared/types/orders";

export const defaultOp = "gte";

export const OrdersFilterFormSchema = z.object({
	q: z.string().optional(),
	page: z.string().optional(),
	size: z.string().optional(),
	status: z.string().optional(),
	total: z.string().optional(),
	total_op: z.enum(filterOps).default(defaultOp).optional(),
	discount: z.string().optional(),
	discount_op: z.enum(filterOps).default(defaultOp).optional(),
	createdAt: z
		.object({
			from: z.date(),
			to: z.date(),
		})
		.nullable()
		.optional(),
	sortBy: z.enum(orderSortByEnums).optional(),
	sortType: z.enum(sortTypeEnums).optional(),
});

export type OrdersFilterFormData = z.infer<typeof OrdersFilterFormSchema>;

export interface OrderFilters {
	status?: OrderStatus;
	total?: number;
	total_op?: FilterOp;
	discount?: number;
	discount_op?: FilterOp;
	createdAt?: { from: Date; to: Date } | null;
	sortBy?: OrdersFilterFormData["sortBy"];
	sortType?: OrdersFilterFormData["sortType"];
}
