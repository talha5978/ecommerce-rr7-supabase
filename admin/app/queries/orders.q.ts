import type { OrderFilters } from "@ecom/shared/schemas/orders-filter.schema";
import { OrdersService } from "@ecom/shared/services/orders.service";
import type { GetHighLevelOrders } from "@ecom/shared/types/orders";
import { queryOptions } from "@tanstack/react-query";

interface ordersQueryArgs {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
	filters?: OrderFilters;
}

export const highLvlOrdersQuery = ({ request, q, pageIndex, pageSize, filters }: ordersQueryArgs) => {
	return queryOptions<GetHighLevelOrders>({
		queryKey: ["highLvlOrders", q, pageIndex, pageSize, filters],
		queryFn: async () => {
			const svc = new OrdersService(request);
			const result = await svc.getAllOrders(q, pageIndex, pageSize, filters);
			return result;
		},
	});
};
