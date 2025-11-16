import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { GetOrderDetails } from "@ecom/shared/types/orders";
import { Suspense } from "react";
import { Await, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { OrderDetails } from "~/components/Orders/OrderDetails";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { orderDetailsQuery } from "~/queries/orders.q";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const orderId = params.orderId as string;

	if (!orderId || orderId == "") {
		throw new Response("Order ID is required", { status: 400 });
	}

	const data = queryClient.fetchQuery(orderDetailsQuery({ request, orderId }));

	return {
		data,
	};
};

export default function OrderDetailsPage() {
	const { data } = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle={`Order Details | Admin Panel`}
				metaDescription="See all the related details for the order."
				metaKeywords="Orders, Order, Order details"
			/>
			<Suspense fallback={<p>Loading.....</p>}>
				<Await resolve={data as Promise<GetOrderDetails>}>
					{(resolvedData: GetOrderDetails) => <OrderDetails data={resolvedData} />}
				</Await>
			</Suspense>
		</>
	);
}
