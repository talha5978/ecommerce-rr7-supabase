import { zodResolver } from "@hookform/resolvers/zod";
import { Control, Controller, useFieldArray, useForm, UseFormSetValue, useWatch } from "react-hook-form";
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	useActionData,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import {
	DollarSign,
	Info,
	Loader2,
	Percent,
	PlusCircle,
	RefreshCcw,
	Settings2,
	Trash2,
	UserCog,
	UserLock,
	UserRoundCheck,
	Users,
} from "lucide-react";
import { JSX, useEffect, useMemo } from "react";
import {
	TagsInput,
	TagsInputClear,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { DEFAULT_DICOUNT_TYPE, DISCOUNT_COND_TYPE_ENUM, DISCOUNT_CUSTOMER_TYPE_ENUM } from "~/constants";
import { toast } from "sonner";
import type { ActionResponse } from "~/types/action-data";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/create-coupon";
import { DataTable } from "~/components/Table/data-table";
import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	Table,
	useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { CouponFormValues, CouponInputSchema } from "~/schemas/coupons.schema";
import type {
	DiscountCondOperator,
	DiscountCondType,
	DiscountCustomerGrps,
	DiscountType,
} from "~/types/coupons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import DateTimePicker from "~/components/Custom-Inputs/date-time-picker";

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

	if (!couponType || couponType == null) {
		throw new Response("Invalid Coupon Type", { status: 404 });
	}
	// const { searchParams } = new URL(request.url);
	// const categoryPageParam = Number(searchParams.get("catPage"));
	// const productPageParam = Number(searchParams.get("prodPage"));
	// const productSearchQuery = searchParams.get("prodSearch") || "";
	// // console.log(Math.max(0, categoryPageParam - 1), Math.max(0, productPageParam - 1));

	// const collectionsDataItems = queryClient.fetchQuery(
	// 	collectionDataItemsQuery({
	// 		request,
	// 		...(productSearchQuery && { q: productSearchQuery }),
	// 		categoryPageIndex: categoryPageParam ? Math.max(0, categoryPageParam - 1) : 0,
	// 		productPageIndex: productPageParam ? Math.max(0, productPageParam - 1) : 0
	// 	})
	// );

	// return { collectionsDataItems };
};

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

const discount_type_fields: { label: string; value: DiscountType; example: string }[] = [
	{
		label: "Fixed discount to entire order",
		value: "fixed_order",
		example: "e.g., $25 off the entire order",
	},
	{
		label: "Percentage discount to entire order",
		value: "percentage_order",
		example: "e.g., 20% off the entire order",
	},
	{
		label: "Fixed discount to specific products",
		value: "fixed_product",
		example: "e.g., $6 off each selected product",
	},
	{
		label: "Percentage discount to specific products",
		value: "percentage_product",
		example: "e.g., 15% off each selected product",
	},
	{
		label: "Buy X get Y",
		value: "buy_x_get_y",
		example: "e.g., Buy 2 get 1 free on selected products",
	},
];

const CondTypeLabels: Record<DiscountCondType, Record<string, string>> = {
	category: {
		singular: "Category",
		plural: "Categories",
	},
	sub_category: {
		singular: "Sub Category",
		plural: "Sub Categories",
	},
	collection: {
		singular: "Collection",
		plural: "Collections",
	},
	price: {
		singular: "Price",
		plural: "Prices",
	},
	sku: {
		singular: "SKU",
		plural: "SKUs",
	},
};

const CondOperatorLabels: Record<DiscountCondOperator, string> = {
	equal: "Equal To",
	not_equal: "Not Equal To",
	greater: "Greater Than",
	greater_or_equal: "Greater Than Or Equal To",
	smaller: "Smaller Than",
	smaller_or_equal: "Smaller Than Or Equal To",
	in: "In",
	not_in: "Not In",
};

const CustomerGroupsLabels: Record<DiscountCustomerGrps, { label: string; icon: JSX.Element }> = {
	all: { label: "All", icon: <UserRoundCheck /> },
	admins: { label: "Admins", icon: <UserLock /> },
	employee: { label: "Employees", icon: <UserCog /> },
	consumer: { label: "General Customers", icon: <Users /> },
};

type Condition = CouponFormValues["conditions"];

type TypeCellProps = {
	index: number;
	control: Control<CouponFormValues>;
	setValue: UseFormSetValue<CouponFormValues>;
	name: "conditions" | "fixed_products";
};

const TypeCell = ({ index, control, setValue, name }: TypeCellProps): JSX.Element => {
	// Reset other order_fields in the row based on the new type
	const ResetOtherFields = ({ newType, index }: { newType: DiscountCondType; index: number }) => {
		setValue(`${name}.${index}.operator`, newType === "price" ? "equal" : "in");
		setValue(`${name}.${index}.value_text`, "");
		setValue(`${name}.${index}.value_decimal`, "");
		if (name === "conditions") {
			setValue(`${name}.${index}.min_quantity`, "1");
		}
	};

	return (
		<FormField
			control={control}
			name={`${name}.${index}.type`}
			render={({ field }) => (
				<Select
					value={field.value}
					onValueChange={(newType: DiscountCondType) => {
						field.onChange(newType);
						ResetOtherFields({ newType, index });
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select type" />
					</SelectTrigger>
					<SelectContent>
						{DISCOUNT_COND_TYPE_ENUM.map((type) => (
							<SelectItem key={type} value={type}>
								{CondTypeLabels[type].singular}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		/>
	);
};

// TODO: IMPLEMENT THE TABLE FOR BUY X GET Y PRODUCTS AND THEN WORK ON VALIDATIONS

export default function CreateCouponPage({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();

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
			conditions: [], // by default no conditions
			customer_groups: null,
			customer_emails: [],
		},
	});

	const {
		handleSubmit,
		setError,
		control,
		setValue,
		formState: { errors },
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
	const watchedCustomerGroups = useWatch({ control, name: "customer_groups" }) || "";
	const watchedWantMaxTotalUses = useWatch({ control, name: "want_max_total_uses" });
	const watchedWantMaxUsesPerOrder = useWatch({ control, name: "want_max_uses_per_order" });

	const orderConditionCols: ColumnDef<Condition, unknown>[] = [
		{
			id: "select",
			header: ({ table }) => {
				const rows = table.getRowCount();
				return rows > 0 ? (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={
								table.getIsAllPageRowsSelected() ||
								(table.getIsSomePageRowsSelected() && "indeterminate")
							}
							onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
							aria-label="Select all"
						/>
					</div>
				) : null;
			},
			cell: ({ row }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				</div>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "Type",
			accessorKey: "type",
			header: "Type",
			enableHiding: false,
			cell: ({ row }) => (
				<TypeCell index={row.index} control={control} setValue={setValue} name="conditions" />
			),
		},
		{
			id: "Operator",
			accessorKey: "operator",
			header: "Operator",
			cell: ({ row }) => {
				const index = row.index;
				const type = useWatch({ control, name: `conditions.${index}.type` });
				const operators: DiscountCondOperator[] =
					type === "price"
						? ["equal", "not_equal", "greater", "greater_or_equal", "smaller", "smaller_or_equal"]
						: ["in", "not_in"];

				return (
					<FormField
						control={control}
						name={`conditions.${index}.operator`}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select operator" />
								</SelectTrigger>
								<SelectContent>
									{operators.map((op) => (
										<SelectItem key={op} value={op}>
											{CondOperatorLabels[op]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				);
			},
		},
		{
			id: "Value",
			header: "Value",
			accessorKey: "value",
			cell: ({ row }) => {
				const index = row.index;
				const type: DiscountCondType = useWatch({ control, name: `conditions.${index}.type` });

				if (type === "price") {
					return (
						<FormField
							control={control}
							name={`conditions.${index}.value_decimal`}
							render={({ field }) => (
								<Input type="number" placeholder="e.g. 50.00" {...field} />
							)}
						/>
					);
				} else {
					return (
						<FormField
							control={control}
							name={`conditions.${index}.value_text`}
							render={({ field }) => (
								<p className="text-sm text-primary hover:underline cursor-pointer underline-offset-4 text-ellipsis truncate max-w-[10rem]">
									{field.value
										? field.value
										: `Select ${CondTypeLabels[type].plural.toLowerCase() || "values"}`}
								</p>
							)}
						/>
					);
				}
			},
		},
		{
			id: "Min. Quantity",
			accessorKey: "min_quantity",
			header: "Min. Quantity",
			cell: ({ row }) => {
				const index = row.index;
				return (
					<FormField
						control={control}
						name={`conditions.${index}.min_quantity`}
						render={({ field }) => (
							<Input
								type="number"
								placeholder="e.g. 1"
								min={1}
								minLength={1}
								className="max-w-[5rem]"
								{...field}
							/>
						)}
					/>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				return (
					<Button
						type="button"
						variant="destructive"
						className={"size-8"}
						onClick={() => remove_order_fields(row.index)}
					>
						<Trash2 className="!h-4 !w-4" />
					</Button>
				);
			},
		},
	];

	const orderCols = useMemo(() => orderConditionCols, []);

	// console.log(order_fields);

	const conditionsTable = useReactTable({
		data: order_fields,
		columns: orderCols as any,
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

	const fixedProductsCols: ColumnDef<Condition, unknown>[] = [
		{
			id: "select",
			header: ({ table }) => {
				const rows = table.getRowCount();
				return rows > 0 ? (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={
								table.getIsAllPageRowsSelected() ||
								(table.getIsSomePageRowsSelected() && "indeterminate")
							}
							onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
							aria-label="Select all"
						/>
					</div>
				) : null;
			},
			cell: ({ row }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				</div>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "Type",
			accessorKey: "type",
			header: "Type",
			enableHiding: false,
			cell: ({ row }) => (
				<TypeCell index={row.index} control={control} setValue={setValue} name="fixed_products" />
			),
		},
		{
			id: "Operator",
			accessorKey: "operator",
			header: "Operator",
			cell: ({ row }) => {
				const index = row.index;
				const type = useWatch({ control, name: `fixed_products.${index}.type` });
				const operators: DiscountCondOperator[] =
					type === "price"
						? ["equal", "not_equal", "greater", "greater_or_equal", "smaller", "smaller_or_equal"]
						: ["in", "not_in"];

				return (
					<FormField
						control={control}
						name={`fixed_products.${index}.operator`}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select operator" />
								</SelectTrigger>
								<SelectContent>
									{operators.map((op) => (
										<SelectItem key={op} value={op}>
											{CondOperatorLabels[op]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				);
			},
		},
		{
			id: "Value",
			header: "Value",
			accessorKey: "value",
			cell: ({ row }) => {
				const index = row.index;
				const type: DiscountCondType = useWatch({ control, name: `fixed_products.${index}.type` });
				console.log(type);

				if (type === "price") {
					return (
						<FormField
							control={control}
							name={`fixed_products.${index}.value_decimal`}
							render={({ field }) => (
								<Input type="number" placeholder="e.g. 50.00" {...field} />
							)}
						/>
					);
				} else {
					return (
						<FormField
							control={control}
							name={`fixed_products.${index}.value_text`}
							render={({ field }) => (
								<p className="text-sm text-primary hover:underline cursor-pointer underline-offset-4 text-ellipsis truncate max-w-[10rem]">
									{field.value
										? field.value
										: `Select ${CondTypeLabels[type]?.plural?.toLowerCase() || "values"}`}
								</p>
							)}
						/>
					);
				}
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				return (
					<div className="flex items-center justify-center">
						<Button
							type="button"
							variant="destructive"
							className={"size-8"}
							onClick={() => remove_fix_prd_fields(row.index)}
						>
							<Trash2 className="!h-4 !w-4" />
						</Button>
					</div>
				);
			},
		},
	];

	const fixProdCols = useMemo(() => fixedProductsCols, []);

	const fixedProductsTable = useReactTable({
		data: fixed_prodcts_fields as any,
		columns: fixProdCols,
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

	const getDiscountAmntConstraint = (comp: "label" | "icon") => {
		if (watchedDiscountType === "fixed_order" || watchedDiscountType === "fixed_product") {
			return comp === "label" ? "Amount" : <DollarSign className="h-4 w-4" />;
		} else if (
			watchedDiscountType === "percentage_order" ||
			watchedDiscountType === "percentage_product"
		) {
			return comp === "label" ? "Percentage" : <Percent className="h-4 w-4" />;
		} else {
			return comp === "label" ? "Value" : <PlusCircle className="h-4 w-4 rotate-45" />;
		}
	};

	const isFixedProdctsTable =
		watchedDiscountType === "fixed_product" || watchedDiscountType === "percentage_product";
	const isBuyXGetYTable = watchedDiscountType === "buy_x_get_y";

	const appendOrderCondition = () => {
		append_order_field({
			type: "price",
			operator: "equal",
			value_text: "",
			value_decimal: "",
			min_quantity: "",
		});
	};

	const appendFixProdCondition = () => {
		append_fix_prd_fields({
			type: "price",
			operator: "equal",
			value_text: "",
			value_decimal: "",
			min_quantity: "",
		});
	};

	const remOrderSelectedRows = (tableName: "conditionsTable" | "fixedProductsTable") => {
		if (tableName === "conditionsTable") {
			const selectedIndices = conditionsTable
				.getSelectedRowModel()
				.rows.map((row) => row.index)
				.sort((a, b) => b - a);

			remove_order_fields(selectedIndices);
			conditionsTable.resetRowSelection();
		} else if (tableName === "fixedProductsTable") {
			const selectedIndices = fixedProductsTable
				.getSelectedRowModel()
				.rows.map((row) => row.index)
				.sort((a, b) => b - a);

			remove_fix_prd_fields(selectedIndices);
			fixedProductsTable.resetRowSelection();
		}
	};

	// useEffect(() => {
	// 	console.log(errors);
	// }, [errors]);

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

				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<section className="grid grid-cols-8 gap-4">
							{/* LEFT SIDE: General Card */}
							<Card className="md:col-span-5 col-span-8">
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
													<Input placeholder="e.g. AZADI76" {...field} />
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
								</CardContent>
							</Card>

							{/* Right Side: Coupon Validity Dates */}
							<Card className="md:col-span-3 col-span-8">
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
															<RadioGroupItem value="true" id="status-active" />
															<Label htmlFor="status-active">Active</Label>
														</div>
														<div className="flex items-center gap-3 *:cursor-pointer">
															<RadioGroupItem
																value="false"
																id="status-inactive"
															/>
															<Label htmlFor="status-inactive">Inactive</Label>
														</div>
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</section>

						{/* Discount Selection Card */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Discount Selection</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-8">
								{/* Discount Type Selection */}
								<div className="grid gap-3">
									<Label className="text-md font-semibold">Type</Label>
									<section className="grid md:grid-cols-3 grid-cols-1 gap-6">
										<div className="md:col-span-2">
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
																{discount_type_fields.map((discount_type) => (
																	<div
																		key={discount_type.value}
																		className="flex items-center gap-3 *:cursor-pointer"
																	>
																		<RadioGroupItem
																			value={discount_type.value}
																			id={discount_type.value}
																		/>
																		<Label htmlFor={discount_type.value}>
																			{discount_type.label}
																		</Label>
																	</div>
																))}
															</RadioGroup>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<Card className="md:col-span-1 p-4 gap-1 h-fit max-md:hidden">
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
													Discount {getDiscountAmntConstraint("label")}
												</FormLabel>
												<FormControl>
													<div className="flex gap-2">
														<Input
															type="number"
															placeholder="e.g. 10"
															{...field}
														/>
														<Button
															variant="outline"
															size="icon"
															className="pointer-events-none"
															tabIndex={-1}
														>
															{getDiscountAmntConstraint("icon")}
														</Button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								{/* Table according to the selected discount type */}
								{isFixedProdctsTable ? (
									<section className="grid gap-3">
										<Label className="text-md font-semibold">Target Products</Label>
										<div className="flex flex-col gap-3">
											<div className="flex justify-end">
												<TableColumnsToggle table={fixedProductsTable as any} />
											</div>
											<DataTable
												table={fixedProductsTable}
												customEmptyMessage="No product order conditions added"
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
																remOrderSelectedRows("fixedProductsTable")
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
													onClick={appendFixProdCondition}
												>
													<PlusCircle className="h-4 w-4 mr-2" />
													<span>Add Condition</span>
												</Button>
											</div>
										</div>
									</section>
								) : (
									<></>
								)}
							</CardContent>
						</Card>

						<section className="grid grid-cols-8 gap-4">
							{/* LEFT SIDE: Order conditions Card */}
							<Card className="md:col-span-5 col-span-8">
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
													<Input type="number" placeholder="e.g. $250" {...field} />
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
																remOrderSelectedRows("fixedProductsTable")
															}
														>
															<Trash2 className="h-4 w-4 mr-2" />
															<span>Delete</span>
														</Button>
													)}
												<Button
													type="button"
													variant="outline"
													onClick={appendOrderCondition}
												>
													<PlusCircle className="h-4 w-4 mr-2" />
													<span>Add Condition</span>
												</Button>
											</div>
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

							{/* Right Side: Customer conditions Card */}
							<Card className="md:col-span-3 col-span-8 h-fit">
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
																		{CustomerGroupsLabels[group].label}
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
						</section>

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
																field.value === "false" ? "true" : "false",
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

						{/* Submit Button */}
						<section className="flex justify-end md:col-span-3">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin mr-2" />}
								<span>Create</span>
							</Button>
						</section>
					</Form>
				</form>
			</section>
		</>
	);
}

const TableColumnsToggle = ({ table }: { table: Table<Condition> }) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
				>
					<Settings2 />
					<span className="hidden md:inline">Columns</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[150px]">
				<DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter((column: any) => typeof column.accessorFn !== "undefined" && column.getCanHide())
					.map((column: any) => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="cursor-pointer"
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.id}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const BuyGetYCard = () => {};
