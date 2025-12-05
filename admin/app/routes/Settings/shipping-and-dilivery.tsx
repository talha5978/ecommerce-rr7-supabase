import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { StoreSettingsService } from "@ecom/shared/services/store-settings.service";
import { Check, PencilLineIcon, X } from "lucide-react";
import { useState } from "react";
import { ActionFunctionArgs, useLoaderData, useSubmit, type LoaderFunctionArgs } from "react-router";
import { toast } from "sonner";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { StoreSettingsQUery } from "~/queries/store-settings.q";

export const action = async ({ request }: ActionFunctionArgs) => {
	const data = await request.formData();
	const shipping_rate = data.get("shipping_rate") as string;
	const store_id = data.get("store_id") as string;

	const storeSettingsService = new StoreSettingsService(request);
	await storeSettingsService.updateShippingRate({ id: store_id, shipping_rate: parseFloat(shipping_rate) });
	await queryClient.invalidateQueries({ queryKey: ["store_settings"] });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const data = await queryClient.fetchQuery(StoreSettingsQUery({ request }));
	return {
		data,
	};
};

export type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function ShippingAndDiliveryPage() {
	const loaderData: LoaderData = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle="Shipping and Dilivery Settings | Store Settings"
				metaDescription="Manage all the shipping and dilivery settings of the store."
				metaKeywords="Store Settings, Shipping and Dilivery settings"
			/>
			<section className="space-y-4">
				<div>
					<h1 className="text-2xl font-semibold">Shipping Rate</h1>
				</div>
				{/* Shipping Rate Card*/}
				<ShippingRateCard
					initial={loaderData.data.store_settings?.shipping_rate ?? undefined}
					store_id={loaderData.data.store_settings?.id ?? undefined}
				/>
			</section>
		</>
	);
}
function formatPKR(value: number | string | undefined) {
	if (value == null || value === "") return "N/A";
	const v = typeof value === "number" ? value : Number(value);
	if (Number.isNaN(v)) return String(value);
	return new Intl.NumberFormat("en-PK", {
		style: "currency",
		currency: "PKR",
		maximumFractionDigits: 2,
	}).format(v);
}

const ShippingRateCard = ({ initial, store_id }: { initial?: number | string; store_id?: string }) => {
	const parsed = typeof initial === "string" ? Number(initial) : initial;
	const [amount, setAmount] = useState<number>(Number(parsed ?? 0));
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<string>(String(amount ?? 0));

	const startEdit = () => {
		setDraft(String(amount ?? 0));
		setEditing(true);
	};

	const cancelEdit = () => {
		setEditing(false);
	};

	const submit = useSubmit();

	const saveEdit = () => {
		const n = Number(draft);
		if (!Number.isFinite(n) || n < 0) {
			toast.error("Enter a valid non-negative number for shipping rate.");
			return;
		}

		if (!store_id) {
			toast.error("Store id not found");
			return;
		}

		setAmount(n);
		const data = new FormData();
		data.set("shipping_rate", String(n));
		data.set("store_id", store_id);

		submit(data, {
			method: "PATCH",
			action: "/settings/shipping-and-dilivery",
			navigate: false,
		});

		setEditing(false);
		toast.success("Shipping rate updated successfully");
	};

	return (
		<div className="max-w-md w-full rounded-xl border shadow-sm p-4 dark:bg-muted">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="text-xs text-muted-foreground">Shipping Rate</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="text-2xl font-semibold tracking-tight">{formatPKR(amount)}</span>
						<span className="text-xs text-muted-foreground">per order</span>
					</div>
					<p className="mt-2 text-xs text-muted-foreground">
						This value is applied to each order at checkout.
					</p>
				</div>

				<div className="flex-shrink-0 flex items-start">
					{!editing ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={startEdit}
							aria-label="Edit shipping rate"
							className="inline-flex items-center gap-2"
						>
							<PencilLineIcon className="h-4 w-4" />
							<span className="text-sm">Update</span>
						</Button>
					) : (
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={saveEdit}
								className="inline-flex items-center gap-2"
							>
								<Check className="h-4 w-4" />
								Save
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={cancelEdit}
								className="inline-flex items-center gap-2"
							>
								<X className="h-4 w-4" />
								Cancel
							</Button>
						</div>
					)}
				</div>
			</div>

			{editing && (
				<div className="mt-4">
					<label className="text-xs text-muted-foreground mb-1 block">Amount (PKR)</label>
					<div className="flex gap-2 items-center">
						<input
							type="number"
							step="0.01"
							min="0"
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							className="w-full px-3 py-2 rounded border focus:ring-1 focus:ring-primary focus:outline-none"
							aria-label="Shipping amount in PKR"
						/>
						<div className="text-sm text-muted-foreground">PKR</div>
					</div>
					<p className="mt-2 text-xs text-muted-foreground">
						Enter shipping charge applied to orders. Leave blank or zero to disable.
					</p>
				</div>
			)}
		</div>
	);
};
