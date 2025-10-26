import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PercentIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { redirect, useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Route } from "./+types/create-tax";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { IconBulb } from "@tabler/icons-react";
import { CreateTaxSchema, type CreateTaxFormValues } from "@ecom/shared/schemas/taxes.schema";
import { TaxesService } from "@ecom/shared/services/taxes.service";
import { TaxTypesQuery } from "~/queries/taxes.q";
import { categoriesForTaxesQuery } from "~/queries/categories.q";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";

export const action = async ({ request }: Route.ActionArgs) => {
	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const parseResult = CreateTaxSchema.safeParse({
		name: formData.get("name") as string,
		rate: formData.get("rate") as string,
		tax_type: formData.get("tax_type") as string,
		status: formData.get("status") as string,
		categories: JSON.parse(formData.get("categories") as string),
	});

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { name, rate, tax_type, status, categories } = parseResult.data;

	const taxService = new TaxesService(request);

	try {
		await taxService.createNewTax({
			name,
			rate,
			tax_type,
			status,
			categories,
		});

		await queryClient.invalidateQueries({ queryKey: ["tax_types"] });
		await queryClient.invalidateQueries({ queryKey: ["taxes"] });
		await queryClient.invalidateQueries({ queryKey: ["taxes_fp"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create new tax";

		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const loader = async ({ request }: Route.LoaderArgs) => {
	const tax_types = await queryClient.fetchQuery(TaxTypesQuery({ request }));
	const categories = await queryClient.fetchQuery(categoriesForTaxesQuery({ request }));

	if (categories.categories?.length == 0 || categories.error != null) {
		redirect("/settings/taxes");
	}

	return {
		tax_types,
		categories,
	};
};

export default function CreateNewTaxPage() {
	const navigate = useNavigate();
	const actionData: ActionResponse = useActionData();

	const taxLoaderData = useLoaderData<typeof loader>();
	const tax_types = taxLoaderData?.tax_types.tax_types ?? [];
	const categories = taxLoaderData?.categories.categories ?? [];

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const form = useForm<CreateTaxFormValues>({
		resolver: zodResolver(CreateTaxSchema),
		mode: "onSubmit",
		defaultValues: {
			name: "",
			rate: "",
			status: "true",
			tax_type: "",
			categories: [],
		},
	});

	const { setError, control, handleSubmit } = form;
	const submit = useSubmit();

	const selectedCategories = useWatch({ control, name: "categories" });

	const onFormSubmit = (data: CreateTaxFormValues) => {
		if (tax_types.length === 0) {
			toast.error("Please create a tax type first");
			return;
		}
		if (selectedCategories.length === 0) {
			toast.error("Please select at least one category");
			return;
		}

		const formData = new FormData();

		for (const [key, value] of Object.entries(data)) {
			if (key === "categories") {
				formData.append(key, JSON.stringify(value));
			} else {
				formData.append(key, (value as keyof Omit<CreateTaxFormValues, "categories">).trim());
			}
		}

		submit(formData, { method: "POST", action: "" });
	};

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Tax rate created successfully");
				navigate(-1);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof CreateTaxFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	return (
		<Sheet defaultOpen onOpenChange={() => navigate("/settings/taxes")}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create Tax</SheetTitle>
					<SheetDescription>
						Create a new tax rate for your store orders. Click save when you are done.
					</SheetDescription>
				</SheetHeader>
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 flex flex-col p-4 h-full">
					<Form {...form}>
						<FormField
							control={control}
							name="tax_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tax Type</FormLabel>
									<FormControl>
										<div className="*:w-full grid gap-2">
											<Select onValueChange={field.onChange} value={field.value}>
												<SelectTrigger>
													<SelectValue placeholder="Select Tax Type" />
												</SelectTrigger>
												<SelectContent>
													{tax_types.map((item) => (
														<SelectItem key={item.id} value={item.id.toString()}>
															{item.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g GST" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="rate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tax Rate</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												placeholder="e.g 18"
												min={0}
												minLength={0}
												type="number"
												step={0.01}
												className="pr-6"
												{...field}
											/>
											<PercentIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<FormControl>
										<div className="*:w-full">
											<Select
												value={field.value}
												onValueChange={field.onChange}
												name="status"
											>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="true">Active</SelectItem>
													<SelectItem value="false">Inactive</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="categories"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Applicable Categories</FormLabel>
									<FormControl>
										<div className="max-h-64 overflow-y-auto space-y-2 mt-1">
											{categories.map((cat) => (
												<div
													key={cat.id}
													className="flex items-center gap-2 hover:underline underline-offset-4"
												>
													<Checkbox
														id={`cat-${cat.id}`}
														checked={selectedCategories.includes(cat.id)}
														onCheckedChange={(checked) => {
															const newCats = new Set(selectedCategories);
															checked
																? newCats.add(cat.id)
																: newCats.delete(cat.id);
															field.onChange(Array.from(newCats));
														}}
													/>
													<Label
														htmlFor={`cat-${cat.id}`}
														className="font-medium text-sm cursor-pointer"
													>
														{cat.category_name}
													</Label>
												</div>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<SheetFooter className="self-end px-0">
							<Alert variant="default" className="mb-4">
								<AlertTitle className="flex gap-2 mb-1 items-center">
									<IconBulb className="w-4 h-4" />
									<p>Tip</p>
								</AlertTitle>
								<AlertDescription>
									Always use meaningful and descriptive names for your taxes because they
									will be considered for the order placement.
								</AlertDescription>
							</Alert>
							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting && <Loader2 className="animate-spin" />}
								<span>Save</span>
							</Button>
							<SheetClose asChild className="w-full">
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</Form>
				</form>
			</SheetContent>
		</Sheet>
	);
}
