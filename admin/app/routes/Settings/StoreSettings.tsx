import { Suspense, lazy, useEffect } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { StoreSettingsQUery } from "~/queries/store-settings.q";
import { useFetcher, useLoaderData, type LoaderFunctionArgs } from "react-router";
import type { StoreSettings_Raw } from "@ecom/shared/types/store-settings";
import { toast } from "sonner";
import {
	type UpdateStoreAddressData,
	UpdateStoreAddressSchema,
} from "@ecom/shared/schemas/store-address.schema";
import { Button } from "~/components/ui/button";

const AddressPicker = lazy(() => import("~/components/Custom-Inputs/address-picker"));

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const data = await queryClient.fetchQuery(StoreSettingsQUery({ request }));

	return {
		data: data.store_settings,
		error: data.error,
	};
};

export default function StoreSettingsPage() {
	return (
		<section className="space-y-4">
			<div>
				<h1 className="text-2xl font-semibold">Store Details</h1>
			</div>
			<Separator />
			<AddressSettings />
		</section>
	);
}

function AddressSettings() {
	const loaderData = useLoaderData<typeof loader>();
	if (loaderData.data == null) {
		// toast.error(loaderData.error?.message || "Something went wrong");
		// throw redirect("/");
	}

	const initialData = loaderData?.data?.store_address ?? {};

	const fetcher = useFetcher();

	const { control, handleSubmit } = useForm<UpdateStoreAddressData>({
		resolver: zodResolver(UpdateStoreAddressSchema),
		// @ts-ignore
		defaultValues: {
			address: {
				// @ts-ignore
				formattedAddress: initialData.formattedAddress, // @ts-ignore
				lat: initialData?.lat ?? 29.394644, // @ts-ignore
				lng: initialData?.lng ?? 71.6638747,
			},
		},
	});

	// Handle fetcher state for toasts and query invalidation
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Store address updated successfully");
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
		// console.log(fetcher.data);
	}, [fetcher.data, queryClient]);

	const onSubmit = (data: UpdateStoreAddressData) => {
		const store_id = (loaderData.data as StoreSettings_Raw).id;
		if (!store_id) {
			toast.error("Something went wrong");
			return;
		}

		const payload = {
			address: {
				...(data.address.formattedAddress && {
					formattedAddress: data.address.formattedAddress,
				}),
				...(data.address.lat && {
					lat: data.address.lat,
				}),
				...(data.address.lng && {
					lng: data.address.lng,
				}),
			},
		};

		const formData = new FormData();
		formData.append("id", store_id);
		formData.append("address", JSON.stringify(payload));

		fetcher.submit(formData, {
			method: "PATCH",
			action: `/settings/store-details/${store_id}/update`,
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Card>
				<CardContent className="space-y-3">
					<div className="flex gap-4">
						<span className="bg-accent p-2 rounded-full self-center">
							<MapPin className="h-5 w-5" />
						</span>
						<div className="flex-1 space-y-1">
							<h2 className="font-semibold">Address</h2>
							<p className="text-sm text-muted-foreground">
								Used on your front panel to display and also in order confirmation.
							</p>
						</div>
					</div>
					<div>
						<Suspense fallback={<div>Loading map...</div>}>
							<Controller
								name="address"
								control={control}
								render={({ field }) => (
									<AddressPicker value={field.value} onChange={field.onChange} />
								)}
							/>
						</Suspense>
					</div>
					<div className="mt-4 flex justify-end">
						<Button type="submit" disabled={fetcher.state === "submitting"}>
							{fetcher.state === "submitting" ? <Loader2 className="animate-spin" /> : null}
							Save
						</Button>
					</div>
				</CardContent>
			</Card>
		</form>
	);
}
