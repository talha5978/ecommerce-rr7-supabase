import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { orderDetailsQuery } from "~/queries/orders.q";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const orderId = params.orderId as string;

	if (!orderId || orderId == "") {
		throw new Response("Order ID is required", { status: 400 });
	}

	const data = await queryClient.fetchQuery(orderDetailsQuery({ request, orderId }));

	return {
		data,
	};
};
export default function OrderDetailsPage() {
	const data = useLoaderData();
	console.log(data);

	return <div>Order details page</div>;
}
