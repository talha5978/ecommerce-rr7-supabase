import { Suspense, useCallback, useEffect } from "react";
import { Control, ControllerRenderProps, useFormContext, useWatch } from "react-hook-form";
import { Await, useLoaderData, useSearchParams } from "react-router";
import { type CreateCouponsLoader } from "~/routes/Coupons/create-coupon";
import { CouponFormValues } from "~/schemas/coupons.schema";
import type { GetAllCategoriesResponse } from "~/types/category";
import { Label } from "~/components/ui/label";
import { DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ApiError } from "~/utils/ApiError";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	ConditionTypeValues,
	CondTypeLabels,
	getAllSearchParams,
	typesToSelect,
	typeToParamMap,
} from "~/utils/couponsConstants";
import type { SKUsNamesListResponse } from "~/types/products";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import type { CollectionsNamesListResponse } from "~/types/collections";
import type { BuyXGetYGroupOpts, TypesToSelect } from "~/components/Coupons/coupons-comp.d";
import { SearchBar } from "~/components/Coupons/SearchBar";
import { LineSkeleton } from "./Skeletons/LineSkeleton";
import { PaginationSkeleton } from "./Skeletons/PaginationSkeleton";
import { AccordianSkeleton } from "./Skeletons/AccordianSkeleton";
import PaginationOptions from "~/components/Coupons/PaginationOptions";
import { SKUsSelectionArea } from "~/components/Coupons/SelectionAreas/SKUSelectionArea";
import { CategoriesSelectionArea } from "~/components/Coupons/SelectionAreas/CategoriesSelectionArea";
import { CollectionsSelectionArea } from "~/components/Coupons/SelectionAreas/CollectionsSelectionArea";

export const SKUS_PAGE_SIZE = 3;
export const COLLECTIONS_PAGE_SIZE = 5;
export const CATEGORIES_PAGE_SIZE = 5;

type BuyXGetYCardProps = {
	control: Control<CouponFormValues>;
	disabled?: boolean;
};

type ConditionChangeFuncProps = {
	value: string;
	field: ControllerRenderProps<CouponFormValues>;
};

type SelectionFuncProps = {
	field: ControllerRenderProps<CouponFormValues>;
	group: BuyXGetYGroupOpts;
};

type GetSelectedTypesFuncProps = {
	selectedType: TypesToSelect;
	field: ControllerRenderProps<CouponFormValues>;
	data:
		| Promise<SKUsNamesListResponse>
		| Promise<CollectionsNamesListResponse>
		| Promise<GetAllCategoriesResponse>
		| null;
	group: BuyXGetYGroupOpts;
};

export const BuyXGetYCard = ({ control, disabled }: BuyXGetYCardProps) => {
	const { setValue } = useFormContext();

	const discountType = useWatch({ control, name: "discount_type" });
	if (discountType !== "buy_x_get_y") return null;

	const selectedBuyMinValueType = useWatch({ control, name: "buy_x_get_y.buy_min_type" });
	const selectedBuyType = useWatch({ control, name: "buy_x_get_y.buy_group.type" }) as TypesToSelect;
	const selectedGetType = useWatch({ control, name: "buy_x_get_y.get_group.type" }) as TypesToSelect;

	const { buy, get } = useLoaderData<CreateCouponsLoader>();

	const [searchParams] = useSearchParams();
	const suppressNavigation = useSuppressTopLoadingBar();

	const setParams = useCallback(() => {
		const newParams = new URLSearchParams(searchParams);
		suppressNavigation(() => {
			getAllSearchParams(["buy", "get"]).forEach((param) => newParams.delete(param));

			// Set flags for "buy" group
			if (selectedBuyType) {
				newParams.set(`buy_${typeToParamMap[selectedBuyType]}`, "true");
			}

			// Set flags for "get" group
			if (selectedGetType) {
				newParams.set(`get_${typeToParamMap[selectedGetType]}`, "true");
			}
		}).setSearchParams(newParams);
	}, [selectedBuyType, selectedGetType, searchParams, suppressNavigation]);

	// Set URL parameters when condition type changes
	useEffect(() => {
		setParams();
	}, [selectedBuyType, selectedGetType]);

	const handleConditionChange = ({ value, field }: ConditionChangeFuncProps) => {
		setValue("buy_x_get_y.buy_min_value", "");
		field.onChange(value);
	};

	const getSelectTypes = ({ selectedType, field, data, group }: GetSelectedTypesFuncProps) => {
		switch (selectedType as TypesToSelect) {
			case "sku":
				return (
					<Suspense
						fallback={
							<>
								<LineSkeleton lines={SKUS_PAGE_SIZE} />
								<PaginationSkeleton />
							</>
						}
					>
						<Await resolve={data as Promise<SKUsNamesListResponse>}>
							{(resolvedData: SKUsNamesListResponse | null) => (
								<>
									<SKUsSelectionArea field={field} resolvedData={resolvedData} />
									<PaginationOptions
										originalPageSize={SKUS_PAGE_SIZE}
										selectedType={selectedType}
										totalElements={resolvedData?.total ?? 0}
										group={group}
									/>
								</>
							)}
						</Await>
					</Suspense>
				);
			case "category":
				return (
					<Suspense
						fallback={
							<>
								<AccordianSkeleton main_skeletons={4} sub_skeletons={2} />
								<PaginationSkeleton />
							</>
						}
					>
						<Await resolve={data as Promise<GetAllCategoriesResponse>}>
							{(resolvedData: GetAllCategoriesResponse | null) => (
								<>
									<CategoriesSelectionArea field={field} resolvedData={resolvedData} />
									<PaginationOptions
										originalPageSize={CATEGORIES_PAGE_SIZE}
										selectedType={selectedType}
										totalElements={resolvedData?.total ?? 0}
										group={group}
									/>
								</>
							)}
						</Await>
					</Suspense>
				);
			case "collection":
				return (
					<Suspense
						fallback={
							<>
								<LineSkeleton lines={COLLECTIONS_PAGE_SIZE} />
								<PaginationSkeleton />
							</>
						}
					>
						<Await resolve={data as Promise<CollectionsNamesListResponse>}>
							{(resolvedData: CollectionsNamesListResponse | null) => (
								<>
									<CollectionsSelectionArea field={field} resolvedData={resolvedData} />
									<PaginationOptions
										originalPageSize={COLLECTIONS_PAGE_SIZE}
										selectedType={selectedType}
										totalElements={resolvedData?.total ?? 0}
										group={group}
									/>
								</>
							)}
						</Await>
					</Suspense>
				);
			default:
				throw new ApiError("Invalid type provided from the selection area.", 400, []);
		}
	};

	const SelectionArea = ({ field, group }: SelectionFuncProps) => {
		if (group === "buy") {
			const responses = {
				category: buy?.categoriesData,
				sku: buy?.skusData,
				collection: buy?.collectionsData,
			};
			const data = responses[selectedBuyType];
			return data
				? getSelectTypes({
						selectedType: selectedBuyType,
						field,
						data,
						group,
				  })
				: null;
		} else if (group === "get") {
			const responses = {
				category: get?.categoriesData,
				sku: get?.skusData,
				collection: get?.collectionsData,
			};
			const data = responses[selectedGetType];
			return data
				? getSelectTypes({
						selectedType: selectedGetType,
						field,
						data,
						group,
				  })
				: null;
		} else {
			throw new ApiError("Invalid group", 400, []);
		}
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Customer Buys</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4 focus:outline-amber-500">
					<FormField
						control={control}
						name="buy_x_get_y.buy_min_type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Condition Type</FormLabel>
								<FormControl>
									<RadioGroup
										onValueChange={(value) => handleConditionChange({ value, field })}
										value={field.value}
										className="flex flex-col mt-1 *:flex *:items-center *:gap-3 **:cursor-pointer"
										disabled={disabled}
									>
										{ConditionTypeValues.map((item) => (
											<div key={item.id}>
												<RadioGroupItem value={item.value} id={item.id} />
												<Label htmlFor={item.id}>{item.label}</Label>
											</div>
										))}
									</RadioGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex sm:gap-4 gap-2">
						<FormField
							control={control}
							name="buy_x_get_y.buy_min_value"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{selectedBuyMinValueType === "quantity" ? "Quantity" : "Amount"}
									</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type="number"
												placeholder={`e.g. ${
													selectedBuyMinValueType === "quantity" ? "2" : "250"
												}`}
												{...field}
												value={field.value ?? ""}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
													field.onChange(e.target.value)
												}
												disabled={disabled}
												className="sm:max-w-[10rem] max-w-[4rem] pr-9"
												min={1}
												minLength={1}
											/>
											{selectedBuyMinValueType === "amount" && (
												<DollarSign
													className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
													width={18}
												/>
											)}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="buy_x_get_y.buy_group.type"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Any items from</FormLabel>
									<FormControl>
										<div className="*:w-full">
											<Select
												value={selectedBuyType}
												onValueChange={field.onChange}
												disabled={disabled}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
												<SelectContent>
													{typesToSelect.map((type) => (
														<SelectItem key={type} value={type}>
															{CondTypeLabels[type].plural}
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
					</div>
					<div>
						<SearchBar selectedType={selectedBuyType as TypesToSelect} group="buy" />
					</div>
					<FormField
						control={control}
						name="buy_x_get_y.buy_group.selected_ids"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormControl>
									<div>
										<SelectionArea field={field} group="buy" />
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Customer Gets</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex sm:gap-4 gap-2">
						<FormField
							control={control}
							name="buy_x_get_y.get_quantity"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Quantity</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="e.g. 2"
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.value)}
											disabled={disabled}
											className="sm:max-w-[10rem] max-w-[4rem] pr-9"
											min={1}
											minLength={1}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="buy_x_get_y.get_group.type"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Any items from</FormLabel>
									<FormControl>
										<div className="*:w-full">
											<Select
												value={selectedGetType}
												onValueChange={field.onChange}
												disabled={disabled}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
												<SelectContent>
													{typesToSelect.map((type) => (
														<SelectItem key={type} value={type}>
															{CondTypeLabels[type].plural}
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
					</div>

					<div>
						<SearchBar selectedType={selectedGetType as TypesToSelect} group="get" />
					</div>
					<FormField
						control={control}
						name="buy_x_get_y.get_group.selected_ids"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormControl>
									<div>
										<SelectionArea field={field} group="get" />
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="buy_x_get_y.get_discount_percent"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Discount Percentage</FormLabel>
								<FormControl>
									<div className="relative">
										<Input
											type="number"
											min={0}
											max={100}
											placeholder="e.g. 100"
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.value)}
											disabled={disabled}
											className="mr-9"
										/>
										<Percent
											className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground  "
											width={18}
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>
		</>
	);
};
