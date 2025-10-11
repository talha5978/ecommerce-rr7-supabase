import { zodResolver } from "@hookform/resolvers/zod";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { DollarSign, Info, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
	LoaderFunctionArgs,
	useActionData,
	useNavigate,
	useNavigation,
	useSearchParams,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import { BuyXGetYCard } from "~/components/Coupons/BuyXGetYCard";
import {
	appendFixProdCondition,
	appendOrderCondition,
	FixedProductsCols,
	OrderConditionsCols,
	remOrderSelectedRows,
} from "~/components/Coupons/coupons-mutation-page-tables";
import DateTimePicker from "~/components/Custom-Inputs/date-time-picker";
import { ImportEmailsButton } from "~/components/Custom-Inputs/import-emails-button";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { DataTable, TableColumnsToggle } from "~/components/Table/data-table";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	CustomTagsInputClear,
	TagsInput,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { Textarea } from "~/components/ui/textarea";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import {
	buy_x_get_y_detault_values,
	CustomerGroupsLabels,
	discount_type_fields,
	getDiscountAmntConstraint,
	resetFieldValsOnTypeChange,
	typesToSelect,
	typeToParamMap,
} from "@ecom/shared/constants/couponsConstants";
import { getMappedData } from "~/utils/getCouponsMutationsLoaderData";
import type { Route } from "./+types/create-coupon";
import {
	COUPON_TYPE_ENUM,
	DEFAULT_DICOUNT_TYPE,
	DISCOUNT_CUSTOMER_TYPE_ENUM,
} from "@ecom/shared/constants/constants";
import type { CouponType, DiscountCondType, DiscountType } from "@ecom/shared/types/coupons";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { ApiError } from "@ecom/shared/utils/ApiError";
import {
	type CouponActionData,
	CouponActionDataSchema,
	type CouponFormValues,
	CouponInputSchema,
} from "@ecom/shared/schemas/coupons.schema";
import { CouponsService } from "@ecom/shared/services/coupons.service";
import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";

// This function is used to reset the search params of products selections component dialogs in coupons when type changes
export function resetParamsOnTypeChange({
	searchParams,
	suppressNavigation,
}: {
	searchParams: URLSearchParams;
	suppressNavigation: ReturnType<typeof useSuppressTopLoadingBar>;
}) {
	// Clear related search parameters
	const newParams = new URLSearchParams(searchParams);
	suppressNavigation(() => {
		const groups = ["fix", "buy", "get"]; // groups to remove when the type changes

		for (const group of groups) {
			for (const type of typesToSelect) {
				newParams.delete(`${group}_${typeToParamMap[type]}`);
				newParams.delete(`${group}_${type}_search`);
				newParams.delete(`${group}_${type}_page`);
			}
		}
	}).setSearchParams(newParams, true);
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const couponType = params.couponType;

	if (!couponType || couponType == null || !COUPON_TYPE_ENUM.includes(couponType as CouponType)) {
		throw new Response("Invalid Coupon Type", { status: 404 });
	}

	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const raw_buy_x_get_y_fields = formData.get("buy_x_get_y_fields");
	const buy_x_get_y_fields =
		raw_buy_x_get_y_fields === "" || raw_buy_x_get_y_fields === null
			? null
			: JSON.parse(raw_buy_x_get_y_fields as string);

	const raw_order_conditions = formData.get("order_conditions");
	const order_conditions =
		raw_order_conditions !== "" && raw_order_conditions !== null
			? JSON.parse(raw_order_conditions as string)
			: null;

	const raw_customer_conditions = formData.get("customer_conditions");
	const customer_conditions =
		raw_customer_conditions !== "" && raw_customer_conditions !== null
			? JSON.parse(raw_customer_conditions as string)
			: null;

	const raw_specific_target_products = formData.get("specific_target_products");
	const specific_target_products =
		raw_specific_target_products === "" || raw_specific_target_products === null
			? null
			: JSON.parse(raw_specific_target_products as string);

	if (
		specific_target_products !== null &&
		Array.isArray(specific_target_products) &&
		specific_target_products.length > 0
	) {
		specific_target_products.forEach((product: any) => {
			if (
				(product.value_text === "" || product.value_text === null) &&
				(product.value_decimal === null || product.value_decimal === "")
			) {
				throw new ApiError("Invalid targets products data", 400, []);
			}
		});
	}

	// return;
	const data: CouponActionData = {
		code: formData.get("code") as string,
		description: formData.get("description") as string,
		status: formData.get("status") as "true" | "false",
		discount_type: formData.get("discount_type") as DiscountType,
		discount_value: formData.get("discount_value") as string | null,
		start_timestamp: formData.get("start_timestamp") as string,
		end_timestamp: formData.get("end_timestamp") as string,
		specific_target_products,
		buy_x_get_y_fields,
		order_conditions,
		customer_conditions,
		usage_conditions: {
			max_total_uses: formData.get("usage_conditions.max_total_uses") as string | null,
			one_use_per_customer: formData.get("usage_conditions.one_use_per_customer") as
				| "true"
				| "false"
				| null,
		},
	};

	const parseResult = CouponActionDataSchema.safeParse(data);
	// console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// console.log("Data in the action: ", parseResult.data);

	const couponsSvc = new CouponsService(request);
	// return;
	try {
		await couponsSvc.createCoupon({ input: parseResult.data, coupon_type: couponType as CouponType });

		await queryClient.invalidateQueries({ queryKey: ["high_lvl_coupons"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create coupon";
		return {
			success: false,
			error: errorMessage,
		};
	}
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

	// Set the time to 12 pm (noon)
	today.setHours(12, 0, 0, 0); // hours, minutes, seconds, milliseconds

	// Get the date after 5 days from now
	const delayedDate = new Date(today);
	delayedDate.setDate(delayedDate.getDate() + 5);
	delayedDate.setHours(12, 0, 0, 0); // set the time to 12 pm (noon) as well

	return {
		start_timestamp: today,
		end_timestamp: delayedDate,
	};
}

function getFinalData(values: CouponFormValues) {
	if (values.discount_type == undefined) {
		toast.error("Please select a discount type.");
		return;
	}
	// toast.info("Creating coupon...");
	const checkEmptySpecificProducts = () => {
		if (values.discount_type === "fixed_product" || values.discount_type === "percentage_product") {
			return !Array.isArray(values.fixed_products) ||
				values.fixed_products?.length === 0 ||
				values.fixed_products == null
				? false
				: true;
		} else {
			return true;
		}
	};

	const isEmptySpecificProducts = checkEmptySpecificProducts();
	if (!isEmptySpecificProducts) {
		toast.error("Please select at least one product in the fixed products field.");
		return;
	}

	const checkInvalidSpecificValue = () => {
		return (
			values.fixed_products?.every((condition) => {
				if (
					(condition.type === "price" && condition.value_decimal === "") ||
					(condition.type !== "price" && condition.value_text?.length === 0)
				) {
					return false;
				} else {
					return true;
				}
			}) ?? true
		);
	};

	const invalidSpecificValue = checkInvalidSpecificValue();
	if (!invalidSpecificValue) {
		toast.error("Invalid form data. Please check your inputs.");
		return;
	}

	const getSpecificProductsConditions = () => {
		if (
			values.discount_type === "fixed_order" ||
			values.discount_type === "percentage_order" ||
			values.discount_type === "buy_x_get_y"
		) {
			return null;
		} else {
			return values.fixed_products?.flatMap((condition) => {
				return {
					type: condition.type,
					operator: condition.operator,
					value_text: condition.type === "price" ? null : (condition.value_text ?? null),
					value_decimal: condition.type !== "price" ? null : (condition.value_decimal ?? null),
					min_quantity: null,
				};
			});
		}
	};

	const checkEmptyBuyXGetYFields = () => {
		if (values.discount_type !== "buy_x_get_y") {
			return true;
		} else {
			const fl = values.buy_x_get_y;
			if (
				fl.buy_min_value == null ||
				fl.buy_min_value === "" ||
				fl.get_discount_percent == null ||
				fl.get_discount_percent === "" ||
				fl.get_quantity == null ||
				fl.get_quantity === ""
			) {
				return false;
			} else {
				return true;
			}
		}
	};

	const isEmptyBuyXGetYFields = checkEmptyBuyXGetYFields();
	if (!isEmptyBuyXGetYFields) {
		toast.error("Please fill in all the fields in the buy x get y section.");
		return;
	}

	const getBuyXGetYConditions = () => {
		if (values.discount_type !== "buy_x_get_y") {
			return null;
		} else {
			const fl = values.buy_x_get_y;
			return {
				buy_group: {
					buy_min_type: fl.buy_min_type,
					buy_min_value: fl.buy_min_value,
					condition_type: fl.buy_group.type,
					selected_ids: fl.buy_group.selected_ids,
				},
				get_group: {
					quantity: fl.get_quantity,
					discount_percent: fl.get_discount_percent,
					condition_type: fl.get_group.type,
					selected_ids: fl.get_group.selected_ids,
				},
			};
		}
	};

	const getOrderFields = () => {
		if (values.conditions && Array.isArray(values.conditions) && values.conditions?.length > 0) {
			const fields = values.conditions?.flatMap((condition) => {
				return {
					type: condition.type,
					operator: condition.operator,
					value_text: condition.type === "price" ? null : (condition.value_text ?? null),
					value_decimal: condition.type !== "price" ? null : (condition.value_decimal ?? null),
					min_quantity: condition.min_quantity,
				};
			});

			return fields;
		} else {
			return null;
		}
	};

	let finalData = {
		code: values.code.trim(),
		description: values.description?.trim(),
		discount_type: values.discount_type,
		discount_value: values.discount_type !== "buy_x_get_y" ? values.discount_value : null,
		specific_target_products: getSpecificProductsConditions(),
		buy_x_get_y_fields: getBuyXGetYConditions(),
		order_conditions: {
			min_purchase_qty: values.min_purchase_qty ?? null,
			min_purchase_amount: values.min_purchase_amount ?? null,
			conditions: getOrderFields(),
			max_uses_per_order: values.want_max_uses_per_order === "yes" ? values.max_uses_per_order : null,
		},
		customer_conditions: {
			customer_groups: values.customer_groups ?? null,
			customer_emails: values.customer_emails?.map((i) => i.trim()) ?? [],
			min_purchased_amount: values.customer_min_purchased_amount ?? null,
		},
		usage_conditions: {
			max_total_uses: values.want_max_total_uses === "yes" ? values.max_total_uses : null,
			one_use_per_customer: values.one_use_per_customer,
		},
		start_timestamp: values.start_timestamp,
		end_timestamp: values.end_timestamp,
		status: values.status,
	};

	// Convert to FormData
	const formData = new FormData();

	Object.entries(finalData).forEach(([key, value]) => {
		if (value === undefined || value === null) {
			formData.append(key, "");
		} else if (typeof value === "object") {
			// stringify objects & arrays
			formData.append(key, JSON.stringify(value));
		} else {
			formData.append(key, String(value));
		}
	});

	return formData;
}

export default function CreateCouponPage({ params }: Route.ComponentProps) {
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
			one_use_per_customer: "true",
			want_max_total_uses: "no",
			want_max_uses_per_order: "no",
			discount_type: DEFAULT_DICOUNT_TYPE,
			discount_value: "",
			min_purchase_amount: "",
			min_purchase_qty: "",
			start_timestamp: getDefaultDates().start_timestamp,
			end_timestamp: getDefaultDates().end_timestamp,
			fixed_products: [],
			conditions: [],
			customer_groups: null,
			customer_emails: [],
			customer_min_purchased_amount: "",
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

	const isFixedProdctsEnabled =
		watchedDiscountType === "fixed_product" || watchedDiscountType === "percentage_product";
	const isBuyXGetYEnabled = watchedDiscountType === "buy_x_get_y";

	const [isAppendingOrderCondition, setAppendOrderCondTransition] = useTransition();
	const [isAppendingFixedProductCondition, setAppendFixedProductCondTransition] = useTransition();

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
				console.log(actionData.error);
			} else if (actionData.validationErrors) {
				console.log(actionData.validationErrors);
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof CouponFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: CouponFormValues) {
		const formData = getFinalData(values);
		if (!formData) return;
		submit(formData, { method: "POST" });
	}

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
			<Breadcrumbs params={{ couponType: couponType }} />
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
									<div className="flex gap-2 items-center sm:flex-row flex-col max-sm:mt-4">
										<Info className="sm:h-4 h-5 sm:w-4 w-5 text-muted-foreground" />
										<p className="text-muted-foreground text-sm">
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
										(errors?.fixed_products as any)?.fixed_products?.root && (
											<p className="text-sm text-destructive">
												{
													(errors?.fixed_products as any)?.fixed_products?.root
														.message
												}
											</p>
										)}
									{(watchedDiscountType === "fixed_product" ||
										watchedDiscountType === "percentage_product") &&
										errors?.fixed_products?.root && (
											<p className="text-sm text-destructive">
												{errors.fixed_products?.root.message}
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
											render={({ field, fieldState }) => {
												// callback when user imports
												const handleImport = (emails: string[]) => {
													// Merge with existing, remove dupes:
													const merged = Array.from(
														new Set([...(field.value || []), ...emails]),
													);
													field.onChange(merged);
												};

												const fieldDisabledCondition =
													watchedCustomerGroups === "" ||
													watchedCustomerGroups === null;

												return (
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
																className="w-full flex flex-col gap-3"
																aria-invalid={!!fieldState.error}
																inputMode="email"
																disabled={fieldDisabledCondition}
															>
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
																<div className="self-end flex gap-2">
																	<ImportEmailsButton
																		onImport={handleImport}
																		disabled={fieldDisabledCondition}
																		buttonSize="default"
																	/>
																	<CustomTagsInputClear />
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
												);
											}}
										/>
										{/* Min. purchase quantity for customers */}
										<FormField
											control={control}
											name="customer_min_purchased_amount"
											render={({ field }) => {
												const fieldDisabledCondition =
													watchedCustomerGroups === "" ||
													watchedCustomerGroups === null;
												return (
													<FormItem>
														<FormLabel>Minimum Purchase Ammount</FormLabel>
														<FormControl>
															<div className="relative">
																<Input
																	type="number"
																	placeholder="e.g. $1500"
																	className="pr-9"
																	{...field}
																	disabled={fieldDisabledCondition}
																	value={field.value ?? ""}
																/>
																<DollarSign
																	className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
																	width={18}
																/>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
										<div>
											<p className="text-sm text-muted-foreground">
												This ammount condition will apply on the total amount spend by
												customer.
											</p>
										</div>
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
													{errors?.start_timestamp && (
														<FormMessage>
															{errors.start_timestamp.message}
														</FormMessage>
													)}
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
													{errors?.end_timestamp && (
														<FormMessage>
															{errors.end_timestamp.message}
														</FormMessage>
													)}
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
