import { memo, useEffect } from "react";
import { Loader2, Mail, Voicemail } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { useFetcher } from "react-router";
import type { StoreSettings_Raw } from "@ecom/shared/types/store-settings";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { type ApiError } from "@ecom/shared/utils/ApiError";
import { Separator } from "~/components/ui/separator";
import {
	type UpdateStoreContactData,
	UpdateStoreContactSchema,
} from "@ecom/shared/schemas/store-contact.schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/Custom-Inputs/phone-number-input";

const ContactSettings = memo(function ContactSettingsFunc({
	loaderData,
}: {
	loaderData: {
		data: StoreSettings_Raw | null;
		error: ApiError | null;
	};
}) {
	if (loaderData.data == null) {
		toast.error(loaderData.error?.message || "Something went wrong");
		// throw redirect("/");
	}

	const fetcher = useFetcher();

	const form = useForm<UpdateStoreContactData>({
		resolver: zodResolver(UpdateStoreContactSchema),
		defaultValues: {
			email_1: loaderData.data?.email_1 ?? "",
			email_2: loaderData.data?.email_2 ?? "",
			phone_1: loaderData.data?.phone_1 ?? "",
			phone_2: loaderData.data?.phone_2 ?? "",
		},
	});

	const { control, handleSubmit } = form;

	// Handle fetcher state for toasts and query invalidation
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Contact info updated successfully");
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
		// console.log(fetcher.data);
	}, [fetcher.data, queryClient]);

	const onSubmit = (data: UpdateStoreContactData) => {
		const store_id = (loaderData.data as StoreSettings_Raw).id;
		if (!store_id) {
			toast.error("Something went wrong");
			return;
		}

		const payload: Record<string, string> = {};

		for (const field in data) {
			if (
				data[field as keyof UpdateStoreContactData] !==
				(loaderData.data as StoreSettings_Raw)[field as keyof StoreSettings_Raw]
			) {
				payload[field] = data[field as keyof UpdateStoreContactData];
			}
		}

		if (Object.keys(payload).length === 0) {
			toast.warning("No changes detected in contact info");
			return;
		}

		// console.log(payload);

		const formData = new FormData();
		formData.append("id", store_id);
		formData.append("contact_info", JSON.stringify(payload));
		fetcher.submit(formData, {
			method: "PATCH",
			action: `/settings/store-details/${store_id}/contact/update`,
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Card>
				<CardContent>
					<div className="flex gap-4">
						<span className="bg-accent p-2 rounded-full self-center">
							<Voicemail className="h-5 w-5" />
						</span>
						<div className="flex-1 space-y-1">
							<h2 className="font-semibold">Contact information</h2>
							<p className="text-sm text-muted-foreground">
								Will be used for customer support and also in order confirmation and
								notifications.
							</p>
						</div>
					</div>
				</CardContent>
				<Separator />
				<CardContent className="space-y-4">
					<Form {...form}>
						<div className="flex gap-4 md:flex-row flex-col *:flex-1">
							<FormField
								control={control}
								name="phone_1"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Primary Phone Number</FormLabel>
										<FormControl>
											<PhoneInput
												{...field}
												defaultCountry="PK"
												placeholder="Enter primary phone number"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={control}
								name="phone_2"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Secondary Phone Number</FormLabel>
										<FormControl>
											<PhoneInput
												{...field}
												defaultCountry="PK"
												placeholder="Enter secondary phone number"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex gap-4 md:flex-row flex-col *:flex-1">
							<FormField
								control={control}
								name="email_1"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Primary Email</FormLabel>
										<FormControl>
											<div className="relative">
												<Mail
													className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
													width={18}
												/>
												<Input
													placeholder="Enter primary email"
													type="email"
													className="w-full px-8"
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={control}
								name="email_2"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Secondary Email</FormLabel>
										<FormControl>
											<div className="relative">
												<Mail
													className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
													width={18}
												/>
												<Input
													placeholder="Enter secondary email"
													type="email"
													className="w-full px-8"
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</Form>
					<div className="flex justify-end">
						<Button type="submit" disabled={fetcher.state === "submitting"}>
							{fetcher.state === "submitting" ? <Loader2 className="animate-spin" /> : null}
							Save
						</Button>
					</div>
				</CardContent>
			</Card>
		</form>
	);
});

export default ContactSettings;
