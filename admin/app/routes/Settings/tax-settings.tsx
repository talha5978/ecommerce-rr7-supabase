import { defaults } from "@ecom/shared/constants/constants";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import TaxSettings from "~/components/Settings/TaxSettings";
import { TaxesQuery, TaxTypesQuery } from "~/queries/taxes.q";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: 1,
		defaultPageSize: defaults.DEFAULT_TAXES_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(TaxesQuery({ request, q, pageIndex, pageSize }));
	const tax_types = await queryClient.fetchQuery(TaxTypesQuery({ request }));

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
		tax_types,
	};
};

export type TaxesLoaderData = Awaited<ReturnType<typeof loader>>;

export default function TaxesSettingsPage() {
	const loaderData: TaxesLoaderData = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle="Tax Settings | Store Settings"
				metaDescription="Manage all the settings for taxes of the store."
				metaKeywords="Store Settings, tax settings"
			/>
			<section className="space-y-4">
				<div>
					<h1 className="text-2xl font-semibold">Taxes</h1>
				</div>
				<TaxSettings loaderData={loaderData} />
			</section>
		</>
	);
}
