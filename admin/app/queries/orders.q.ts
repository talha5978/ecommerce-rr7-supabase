import { OrdersService } from "@ecom/shared/services/orders.service";
import type { GetHighLevelOrders } from "@ecom/shared/types/orders";
import { queryOptions } from "@tanstack/react-query";

interface ordersQueryArgs {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
}

export const highLvlOrdersQuery = ({ request, q, pageIndex, pageSize }: ordersQueryArgs) => {
	return queryOptions<GetHighLevelOrders>({
		queryKey: ["highLvlOrders", q, pageIndex, pageSize],
		queryFn: async () => {
			const svc = new OrdersService(request);
			const result = await svc.getAllOrders(q, pageIndex, pageSize);
			return result;
		},
	});
};
