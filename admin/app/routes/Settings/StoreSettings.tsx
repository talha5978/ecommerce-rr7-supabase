import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { StoreSettingsQUery } from "~/queries/store-settings.q";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import AddressSettings from "~/components/Settings/AddressSettings";
import ContactSettings from "~/components/Settings/ContactSettings";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import BasicInfoSettings from "~/components/Settings/BasicInfoSettings";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const data = await queryClient.fetchQuery(StoreSettingsQUery({ request }));

	return {
		data: data.store_settings,
		error: data.error,
	};
};

export default function StoreSettingsPage() {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle="Store Details | Settings"
				metaDescription="Manage all the settings according to the store details here."
				metaKeywords="Store details, store Settings"
			/>
			<section className="space-y-4">
				<div>
					<h1 className="text-2xl font-semibold">Store Details</h1>
				</div>
				<BasicInfoSettings />
				<ContactSettings loaderData={loaderData} />
				<AddressSettings loaderData={loaderData} />
			</section>
		</>
	);
}
