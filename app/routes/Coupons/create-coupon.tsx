import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, UseFieldArrayAppend, useForm, useWatch } from "react-hook-form";
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	useActionData,
	useNavigate,
	useNavigation,
	useSearchParams,
	useSubmit,
} from "react-router";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { DollarSign, Info, Loader2, Percent, PlusCircle, RefreshCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useTransition } from "react";
import {
	TagsInput,
	TagsInputClear,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { COUPON_TYPE_ENUM, DEFAULT_DICOUNT_TYPE, DISCOUNT_CUSTOMER_TYPE_ENUM } from "~/constants";
import { toast } from "sonner";
import type { ActionResponse } from "~/types/action-data";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/create-coupon";
import { DataTable, TableColumnsToggle } from "~/components/Table/data-table";
import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { CouponFormValues, CouponInputSchema } from "~/schemas/coupons.schema";
import type { CouponType, DiscountCondType, DiscountType } from "~/types/coupons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import DateTimePicker from "~/components/Custom-Inputs/date-time-picker";
import {
	ConditionOperatorCell,
	ConditionValueCell,
	TableRowSelector,
	TypeCell,
} from "~/components/Coupons/TableComponents";
import {
	buy_x_get_y_detault_values,
	CustomerGroupsLabels,
	discount_type_fields,
	getAllSearchParams,
	getDiscountAmntConstraint,
	resetFieldValsOnTypeChange,
	resetParamsOnTypeChange,
	typesToSelect,
	typeToParamMap,
} from "~/utils/couponsConstants";
import { BuyXGetYCard } from "~/components/Coupons/BuyXGetYCard";
import { getMappedData } from "~/utils/getCouponsMutationsLoaderData";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import { Separator } from "~/components/ui/separator";
import {
	appendFixProdCondition,
	appendOrderCondition,
	FixedProductsCols,
	OrderConditionsCols,
	remOrderSelectedRows,
} from "~/components/Coupons/coupons-mutation-page-tables";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	console.log("Form data: ", formData);

	// return;
	// const data = {
	// 	name: formData.get("name") as string,
	// 	description: formData.get("description") as string,
	// 	image: formData.get("image") as File,
	// 	sort_order: formData.get("sort_order") as string,
	// 	status: formData.get("status") as string,
	// 	meta_details: {
	// 		meta_title: formData.get("meta_details.meta_title") as string,
	// 		meta_description: formData.get("meta_details.meta_description") as string,
	// 		url_key: formData.get("meta_details.url_key") as string,
	// 		meta_keywords: formData.get("meta_details.meta_keywords"),
	// 	},
	// 	product_ids: formData.getAll("product_ids") as string[],
	// };

	// const parseResult = CollectionActionDataSchema.safeParse(data);
	// // console.log("Parse result: ", parseResult?.error);

	// if (!parseResult.success) {
	// 	return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
	// 		status: 400,
	// 		headers: { "Content-Type": "application/json" },
	// 	});
	// }

	// // console.log("Data in the action: ", parseResult.data);

	// const collectionSvc = new CollectionsService(request);
	// // return;
	// try {
	// 	await collectionSvc.createCollection(parseResult.data);
	// 	await queryClient.invalidateQueries({ queryKey: ["highLvlCollections"] });
	// 	return { success: true };
	// } catch (error: any) {
	// 	// console.error("Error in action:", error);
	// 	const errorMessage =
	// 		error instanceof ApiError ? error.message : error.message || "Failed to create coupon";

	// 	if (error instanceof ApiError && error.details.length) {
	// 		console.error("ApiError details:", error.details);
	// 	}
	// 	return {
	// 		success: false,
	// 		error: errorMessage,
	// 	};
	// }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const couponType = params.couponType;

	if (!couponType || couponType == null || !COUPON_TYPE_ENUM.includes(couponType as CouponType)) {
		throw new Response("Invalid Coupon Type", { status: 404 });
	}

	const data = getMappedData({ request });
	// console.log(data);

	return data;
};

export type CreateCouponsLoader = typeof loader;

function getDefaultDates(): { start_timestamp: Date; end_timestamp: Date } {
	const today = new Date();

	// Get the date after 5 days from now
	const delayedDate = new Date(today);
	delayedDate.setDate(delayedDate.getDate() + 5);

	return {
		start_timestamp: today,
		end_timestamp: delayedDate,
	};
}

type Condition = CouponFormValues["conditions"];

export default function CreateCouponPage({ loaderData, params }: Route.ComponentProps) {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();

	const couponType = params.couponType as CouponType;

	const actionData: ActionResponse = useActionData();

	const form = useForm<CouponFormValues>({
		resolver: zodResolver(CouponInputSchema),
		mode: "onSubmit",
		defaultValues: {
			code: "",
			status: "true",
			description: "",
			one_use_per_customer: "false",
			want_max_total_uses: "no",
			want_max_uses_per_order: "no",
			discount_type: DEFAULT_DICOUNT_TYPE,
			discount_value: "",
			min_purchase_amount: "",
			min_purchase_qty: "",
			start_timestamp: getDefaultDates().start_timestamp,
			end_timestamp: getDefaultDates().end_timestamp, // 5 days ahead of start date by default
			fixed_products: [],
			conditions: [],
			customer_groups: null,
			customer_emails: [],
			buy_x_get_y: buy_x_get_y_detault_values,
		},
	});

	const {
		handleSubmit,
		setError,
		control,
		setValue,
		formState: { errors },
		resetField,
	} = form;

	const {
		fields: order_fields,
		append: append_order_field,
		remove: remove_order_fields,
	} = useFieldArray({
		control: control,
		name: "conditions",
	});

	const {
		fields: fixed_prodcts_fields,
		append: append_fix_prd_fields,
		remove: remove_fix_prd_fields,
	} = useFieldArray({
		control: control,
		name: "fixed_products",
	});

	console.log("Re rendering..");

	const watchedDiscountType = useWatch({ control, name: "discount_type" });
	// Keep track of previous discount type for resetting fields and params ⬇
	const prevDiscountType = useRef(watchedDiscountType);
	const watchedCustomerGroups = useWatch({ control, name: "customer_groups" }) || "";
	const watchedWantMaxTotalUses = useWatch({ control, name: "want_max_total_uses" });
	const watchedWantMaxUsesPerOrder = useWatch({ control, name: "want_max_uses_per_order" });
	const SelectedFixedProductsType = (index: number) =>
		useWatch({ control, name: `fixed_products.${index}.type` }) as DiscountCondType;
	const SelectedCouponsCondsType = (index: number) =>
		useWatch({ control, name: `conditions.${index}.type` }) as DiscountCondType;

	const [searchParams, setSearchParams] = useSearchParams();
	const suppressNavigation = useSuppressTopLoadingBar();

	const resetProductsFieldVals = useCallback(() => {
		resetFieldValsOnTypeChange({
			prevDiscountType: prevDiscountType.current,
			resetField,
			setValue,
		});
	}, [prevDiscountType]);

	const resetParamsonTypeChange = useCallback(() => {
		// Clear related search parameters
		resetParamsOnTypeChange({
			searchParams,
			suppressNavigation,
		});
	}, [searchParams, suppressNavigation]);

	// Reset form fields and search params when discount_type changes
	useEffect(() => {
		if (prevDiscountType.current !== watchedDiscountType) {
			// Reset form fields based on previous discount type
			resetProductsFieldVals();
			resetParamsonTypeChange();

			// Update previous discount type
			prevDiscountType.current = watchedDiscountType;
			console.clear();
		}
	}, [watchedDiscountType, form, searchParams, setSearchParams, suppressNavigation]);

	// console.log(order_fields);

	const conditionsTable = useReactTable({
		data: order_fields as any,
		columns: OrderConditionsCols({
			control,
			remove_fields: remove_order_fields,
			selectedType: SelectedCouponsCondsType,
			setValue,
		}),
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection: true,
		state: {
			pagination: {
				pageIndex: 0,
				pageSize: 10,
			},
		},
	});

	const fixedProductsTable = useReactTable({
		data: fixed_prodcts_fields as any,
		columns: FixedProductsCols({
			control,
			setValue,
			selectedType: SelectedFixedProductsType,
			remove_fields: remove_fix_prd_fields,
		}),
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection: true,
		state: {
			pagination: {
				pageIndex: 0,
				pageSize: 10,
			},
		},
	});

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Coupon created successfully");
				navigate(`/coupons`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof CouponFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: CouponFormValues) {
		// toast.info("Creating coupon...");
		console.log("🔤 Form values: ", values);
	}

	const isFixedProdctsEnabled =
		watchedDiscountType === "fixed_product" || watchedDiscountType === "percentage_product";
	const isBuyXGetYEnabled = watchedDiscountType === "buy_x_get_y";

	const [isAppendingOrderCondition, setAppendOrderCondTransition] = useTransition();
	const [isAppendingFixedProductCondition, setAppendFixedProductCondTransition] = useTransition();

	useEffect(() => {
		console.log("Errors: ", errors);
	}, [errors]);

	return (
		<>
			<MetaDetails
				metaTitle="Create Coupon | Admin Panel"
				metaDescription="Create new coupon"
				metaKeywords="Coupons, Product Coupons, Promotion, Discount"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/coupons" />
					<h1 className="text-2xl font-semibold">Create Coupon</h1>
				</div>

				<form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
					<div className="grid gap-4 grid-cols-8 *:col-span-8">
						<Form {...form}>
							{/* General Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">General</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Coupon Code */}
									<FormField
										control={control}
										name="code"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Code</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g. AZADI76"
														className="font-mono"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Description */}
									<FormField
										control={control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Description</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Describe the coupon in a few words"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div>
										<p className="text-muted-foreground italic text-sm">
											{couponType === "automatic"
												? "This coupon will automatically apply to the order when required conditions are met."
												: "The customers will have to manually enter the code at checkout to avail discount."}
										</p>
									</div>
								</CardContent>
							</Card>

							{/* Discount Selection Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Discount Selection</CardTitle>
								</CardHeader>
								<CardContent className="space-y-8">
									{/* Discount Type Selection */}
									<div className="flex flex-col gap-2">
										<Label className="text-md font-semibold">Type</Label>
										<section className="grid md:grid-cols-5 grid-cols-1 gap-6">
											<div className="md:col-span-3">
												<FormField
													control={control}
													name="discount_type"
													render={({ field }) => (
														<FormItem className="space-y-1">
															<FormControl>
																<RadioGroup
																	onValueChange={field.onChange}
																	value={field.value}
																>
																	{discount_type_fields.map(
																		(discount_type) => (
																			<div
																				key={discount_type.value}
																				className="flex items-center gap-3 *:cursor-pointer"
																			>
																				<RadioGroupItem
																					value={
																						discount_type.value
																					}
																					id={discount_type.value}
																				/>
																				<Label
																					htmlFor={
																						discount_type.value
																					}
																				>
																					{discount_type.label}
																				</Label>
																			</div>
																		),
																	)}
																</RadioGroup>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<Card className="md:col-span-2 p-4 gap-1 h-fit max-md:hidden">
												<CardTitle className="text-sm font-medium mb-2 flex gap-2 items-center">
													<span>
														<Info className="h-4 w-4" />
													</span>
													<p>Example</p>
												</CardTitle>
												<p className="text-sm text-muted-foreground mb-1">
													{discount_type_fields.find(
														(discount_type) =>
															discount_type.value === watchedDiscountType,
													)?.example || "Select a discount type to see an example."}
												</p>
											</Card>
										</section>
									</div>
									{/* Discount Value */}
									{watchedDiscountType !== "buy_x_get_y" && (
										<FormField
											control={control}
											name="discount_value"
											render={({ field }) => (
												<FormItem className={`max-w-[350px]`}>
													<FormLabel className="text-md font-semibold">
														Discount{" "}
														{getDiscountAmntConstraint(
															"label",
															watchedDiscountType,
														)}
													</FormLabel>
													<FormControl>
														<div className="relative">
															<Input
																type="number"
																placeholder="e.g. 10"
																className="pr-9"
																{...field}
															/>
															{getDiscountAmntConstraint(
																"icon",
																watchedDiscountType,
															)}
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
									{/* Table according to the selected discount type */}
									{isFixedProdctsEnabled ? (
										<section className="flex flex-col gap-3">
											<Label className="text-md font-semibold">Target Products</Label>
											<div className="flex flex-col gap-3">
												<div className="flex justify-end">
													<TableColumnsToggle table={fixedProductsTable} />
												</div>
												<DataTable
													table={fixedProductsTable}
													customEmptyMessage="No target products added"
													cellClassName="**:data-[slot=table-cell]:last:bg-card"
													headerClassName="bg-primary-foreground"
												/>
												<div className="flex justify-end gap-2">
													{fixed_prodcts_fields.length > 0 &&
														fixedProductsTable.getSelectedRowModel().rows.length >
															0 && (
															<Button
																type="button"
																variant="destructive"
																onClick={() =>
																	remOrderSelectedRows({
																		tableName: "fixedProductsTable",
																		table: fixedProductsTable,
																		remove_fields: remove_fix_prd_fields,
																	})
																}
															>
																<Trash2 className="h-4 w-4 mr-2" />
																<span>Delete</span>
															</Button>
														)}
													<Button
														type="button"
														variant="outline"
														size={"sm"}
														onClick={() => {
															const func =
																appendFixProdCondition(append_fix_prd_fields);
															setAppendFixedProductCondTransition(func);
														}}
													>
														{!isAppendingFixedProductCondition ? (
															<PlusCircle className="h-4 w-4 mr-2" />
														) : (
															<Loader2 className="h-4 w-4 mr-2 animate-spin" />
														)}
														<span>Add Condition</span>
													</Button>
												</div>
											</div>
										</section>
									) : isBuyXGetYEnabled ? (
										<BuyXGetYCard
											control={control}
											disabled={watchedDiscountType !== "buy_x_get_y" || isSubmitting}
										/>
									) : null}
									{watchedDiscountType === "buy_x_get_y" && errors?.buy_x_get_y && (
										<p className="text-sm text-destructive">
											{errors.buy_x_get_y.message}
										</p>
									)}
									{(watchedDiscountType === "fixed_product" ||
										watchedDiscountType === "percentage_product") &&
										errors?.fixed_products && (
											<p className="text-sm text-destructive">
												{errors.fixed_products.message}
											</p>
										)}
								</CardContent>
							</Card>

							{/* Order conditions Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Order Conditions</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Min. purchase ammount */}
									<FormField
										control={control}
										name="min_purchase_amount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Minimum Purchase Ammount</FormLabel>
												<FormControl>
													<div className="relative">
														<Input
															type="number"
															placeholder="e.g. $250"
															className="pr-9"
															{...field}
														/>
														<DollarSign
															className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground  "
															width={18}
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Min. purchase quantity */}
									<FormField
										control={control}
										name="min_purchase_qty"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Minimum Purchase Quantity</FormLabel>
												<FormControl>
													<Input type="number" placeholder="e.g. 2" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<section className="flex gap-4 flex-col">
										<span>
											<p className="text-sm text-muted-foreground">
												Order must match all the defined conditions.
											</p>
										</span>
										<div className="flex flex-col gap-3">
											<div className="flex justify-end">
												<TableColumnsToggle table={conditionsTable as any} />
											</div>
											<DataTable
												table={conditionsTable}
												customEmptyMessage="No order conditions added"
												cellClassName="**:data-[slot=table-cell]:last:bg-card"
												headerClassName="bg-primary-foreground"
											/>
											<div className="flex justify-end gap-2">
												{order_fields.length > 0 &&
													conditionsTable.getSelectedRowModel().rows.length > 0 && (
														<Button
															type="button"
															variant="destructive"
															onClick={() =>
																remOrderSelectedRows({
																	tableName: "conditionsTable",
																	table: conditionsTable,
																	remove_fields: remove_order_fields,
																})
															}
														>
															<Trash2 className="h-4 w-4 mr-2" />
															<span>Delete</span>
														</Button>
													)}
												<Button
													type="button"
													variant="outline"
													onClick={() => {
														const func = appendOrderCondition(append_order_field);
														setAppendOrderCondTransition(func);
													}}
												>
													{!isAppendingOrderCondition ? (
														<PlusCircle className="h-4 w-4 mr-2" />
													) : (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													)}
													<span>Add Condition</span>
												</Button>
											</div>
											{errors?.conditions?.root && (
												<p className="text-sm text-destructive">
													{errors.conditions.root.message}
												</p>
											)}
										</div>
									</section>
									{/* Max. uses per order */}
									<div className="space-y-4 mt-6">
										<FormField
											control={control}
											name="want_max_uses_per_order"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<Label className="flex items-center cursor-pointer">
															<Checkbox
																checked={field.value === "yes"}
																onCheckedChange={() =>
																	field.onChange(
																		field.value === "no" ? "yes" : "no",
																	)
																}
																className="mr-2"
															/>
															Set a maxmimum number of coupon uses per order
														</Label>
													</FormControl>
												</FormItem>
											)}
										/>
										{watchedWantMaxUsesPerOrder &&
											watchedWantMaxUsesPerOrder === "yes" && (
												<FormField
													control={control}
													name="max_uses_per_order"
													render={({ field }) => (
														<FormItem className="max-w-[350px]">
															<FormLabel>Max. uses (per order)</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	min={watchedWantMaxUsesPerOrder ? 1 : 0}
																	minLength={
																		watchedWantMaxUsesPerOrder ? 1 : 0
																	}
																	placeholder="e.g. 100"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}
									</div>
								</CardContent>
							</Card>

							<div className="grid grid-cols-8 gap-4 *:md:col-span-4 *:col-span-8">
								{/* Customer conditions Card */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Customer conditions</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* Customer Groups */}
										<FormField
											control={control}
											name={"customer_groups"}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Customer Groups</FormLabel>
													<FormControl>
														<Select
															value={field.value == null ? "" : field.value}
															onValueChange={field.onChange}
														>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select customer group" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem
																	className="text-muted-foreground"
																	value={null as any}
																	defaultChecked
																>
																	Select customer group
																</SelectItem>
																{DISCOUNT_CUSTOMER_TYPE_ENUM.map((group) => (
																	<SelectItem
																		key={group}
																		value={group}
																		className="flex gap-2"
																	>
																		<span>
																			{CustomerGroupsLabels[group].icon}
																		</span>
																		<span>
																			{
																				CustomerGroupsLabels[group]
																					.label
																			}
																		</span>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										{/* Customer Emails */}
										<FormField
											control={control}
											name="customer_emails"
											render={({ field, fieldState }) => (
												<FormItem>
													<FormLabel className="flex gap-2">
														<span>Customer Emails</span>
														<span className="text-muted-foreground">
															(Empty for all)
														</span>
													</FormLabel>
													<FormControl>
														<TagsInput
															value={field.value}
															onValueChange={field.onChange}
															editable
															addOnPaste
															className="w-full"
															aria-invalid={!!fieldState.error}
															inputMode="email"
															disabled={
																watchedCustomerGroups === "" ||
																watchedCustomerGroups === null
															}
														>
															<div className="flex sm:flex-row flex-col gap-2">
																<TagsInputList>
																	{field.value && Array.isArray(field.value)
																		? field.value.map((item) => (
																				<TagsInputItem
																					key={item}
																					value={item}
																				>
																					{item}
																				</TagsInputItem>
																		  ))
																		: null}
																	<TagsInputInput placeholder="Add customer emails..." />
																</TagsInputList>
																<TagsInputClear className="sm:w-fit w-full">
																	<div className="tags-input-clear-container">
																		<RefreshCcw className="h-4 w-4" />
																		<span className="sm:hidden inline">
																			Clear
																		</span>
																	</div>
																</TagsInputClear>
															</div>
														</TagsInput>
													</FormControl>
													{errors.customer_emails &&
														Array.isArray(errors.customer_emails) &&
														errors.customer_emails.length > 0 && (
															<div>
																<p className="text-sm text-destructive">
																	{errors.customer_emails.some(
																		(error) => error?.message,
																	) &&
																		errors.customer_emails.find(
																			(error) => error?.message,
																		)?.message}
																</p>
															</div>
														)}
												</FormItem>
											)}
										/>
									</CardContent>
								</Card>
								{/* Coupon Validity Dates */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Coupon Validity</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* start_timestamp */}
										<Controller
											control={control}
											name="start_timestamp"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Start Date & Time</FormLabel>
													<FormControl>
														<DateTimePicker
															value={field.value ?? null}
															onDateTimeChange={field.onChange}
															disabled={isSubmitting}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										{/* end_timestamp */}
										<Controller
											control={control}
											name="end_timestamp"
											render={({ field }) => (
												<FormItem>
													<FormLabel>End Date & Time</FormLabel>
													<FormControl>
														<DateTimePicker
															value={field.value ?? null}
															onDateTimeChange={field.onChange}
															disabled={isSubmitting}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										{/* Status */}
										<FormField
											control={control}
											name="status"
											render={({ field }) => (
												<FormItem className="space-y-1 mt-6">
													<FormLabel>Visibility Status</FormLabel>
													<FormControl>
														<RadioGroup
															onValueChange={field.onChange}
															value={field.value}
														>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem
																	value="true"
																	id="status-active"
																/>
																<Label htmlFor="status-active">Active</Label>
															</div>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem
																	value="false"
																	id="status-inactive"
																/>
																<Label htmlFor="status-inactive">
																	Inactive
																</Label>
															</div>
														</RadioGroup>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</CardContent>
								</Card>
							</div>

							{/* Max. total uses and only one use for customer fields */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Usage Limits</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="space-y-4">
										<FormField
											control={control}
											name="want_max_total_uses"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<Label className="flex items-center cursor-pointer">
															<Checkbox
																checked={field.value === "yes"}
																onCheckedChange={() =>
																	field.onChange(
																		field.value === "no" ? "yes" : "no",
																	)
																}
																className="mr-2"
															/>
															Limit number of times this discount can be used in
															total
														</Label>
													</FormControl>
												</FormItem>
											)}
										/>
										{watchedWantMaxTotalUses && watchedWantMaxTotalUses === "yes" && (
											<FormField
												control={control}
												name="max_total_uses"
												render={({ field }) => (
													<FormItem className="max-w-[350px]">
														<FormLabel>Max. total uses</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={watchedWantMaxTotalUses ? 1 : 0}
																minLength={watchedWantMaxTotalUses ? 1 : 0}
																placeholder="e.g. 100"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										)}
									</div>
									<FormField
										control={control}
										name="one_use_per_customer"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Label className="flex items-center cursor-pointer">
														<Checkbox
															checked={field.value === "true"}
															onCheckedChange={() =>
																field.onChange(
																	field.value === "false"
																		? "true"
																		: "false",
																)
															}
															className="mr-2"
														/>
														Limit to one use per customer
													</Label>
												</FormControl>
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</Form>
					</div>

					{/* Submit Button */}
					<div className="flex justify-end">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Loader2 className="animate-spin mr-2" />}
							<span>Create</span>
						</Button>
					</div>
				</form>
			</section>
		</>
	);
}
