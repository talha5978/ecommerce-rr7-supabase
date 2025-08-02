import { memo, Suspense, useEffect } from "react";
import {
	Control,
	Controller,
	ControllerRenderProps,
	useForm,
	useFormContext,
	useWatch,
} from "react-hook-form";
import { Await, useLoaderData, useSearchParams } from "react-router";
import { type CreateCouponsLoader } from "~/routes/Coupons/create-coupon";
import { CouponFormValues } from "~/schemas/coupons.schema";
import type { CategoryListRow, GetAllCategoriesResponse, SubCategoryListRow } from "~/types/category";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { ChevronUp, DollarSign, Percent, Search, X } from "lucide-react";
import { defaults, DISCOUNT_COND_TYPE_ENUM } from "~/constants";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ApiError } from "~/utils/ApiError";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { CondTypeLabels } from "~/utils/couponsConstants";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { SKUsNameListRow, SKUsNamesListResponse } from "~/types/products";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import type { CollectionNameListRow, CollectionsNamesListResponse } from "~/types/collections";
import type { BuyMinType } from "~/types/coupons";
import { toast } from "sonner";

const typesToSelect = DISCOUNT_COND_TYPE_ENUM.filter((type) => type !== "price");
type TypesToSelect = (typeof typesToSelect)[number];

export const SKUS_PAGE_SIZE = 3;
export const COLLECTIONS_PAGE_SIZE = 5;
export const CATEGORIES_PAGE_SIZE = 5;

export type GroupOptions = "buy" | "get";

// TODO: Take a deep look at the pagintion in each type of fields in this card
// TODO: THen --- > move to work on specific products discount

type BuyXGetYCardProps = {
	control: Control<CouponFormValues>;
	disabled?: boolean;
};

type SearchBarProps = {
	selectedType: TypesToSelect;
	group: GroupOptions;
};

type SelectionAreaProps<ResponseType> = {
	field: ControllerRenderProps<CouponFormValues>;
	resolvedData: ResponseType | null;
};

type StateCheckResp = { checked: boolean; indeterminate: boolean };

type PaginationOptionsProps = {
	totalElements: number;
	originalPageSize: number;
	selectedType: TypesToSelect;
	group: GroupOptions;
};

function getNameSearchTag(selectedType: TypesToSelect, group: GroupOptions) {
	switch (selectedType) {
		case "category":
			return `${group}_category_search`;
		case "collection":
			return `${group}_collection_search`;
		case "sku":
			return `${group}_sku_search`;
		default:
			return null;
	}
}

function getPageSearchTag(selectedType: TypesToSelect, group: GroupOptions) {
	switch (selectedType) {
		case "category":
			return `${group}_category_page`;
		case "collection":
			return `${group}_collection_page`;
		case "sku":
			return `${group}_sku_page`;
		default:
			return null;
	}
}

const ConditionTypeValues: { value: BuyMinType; id: string; label: string }[] = [
	{
		value: "quantity",
		id: "buy-quantity",
		label: "Minimum quantity of items",
	},
	{
		value: "amount",
		id: "buy-amount",
		label: "Minimum amount of items",
	},
];

const PaginationOptions = memo(
	({ totalElements, originalPageSize, selectedType, group }: PaginationOptionsProps) => {
		const pageSearchTag = getPageSearchTag(selectedType as TypesToSelect, group);
		if (!pageSearchTag) return null;

		const suppressNavigation = useSuppressTopLoadingBar();
		const [searchParams] = useSearchParams();

		const currentPage = searchParams.get(pageSearchTag) ? Number(searchParams.get(pageSearchTag)) : 1;
		const pageCount = Math.ceil(totalElements / originalPageSize);

		console.log("Page count: ", pageCount);
		console.log("Current Page: ", currentPage);

		const handlePrevPage = () => {
			if (currentPage > 1) {
				suppressNavigation(() => {
					searchParams.set(pageSearchTag, (currentPage - 1).toString());
				}).setSearchParams(searchParams);
			}
		};

		const handleNextPage = () => {
			if (currentPage < pageCount) {
				suppressNavigation(() => {
					searchParams.set(pageSearchTag, (currentPage + 1).toString());
				}).setSearchParams(searchParams);
			}
		};

		return (
			<div className="flex gap-2 justify-between my-4 items-center">
				<Button
					variant="outline"
					size="sm"
					type="button"
					onClick={handlePrevPage}
					disabled={currentPage === 1}
				>
					<IconChevronLeft />
					<span className="sm:inline hidden mr-2">Previous</span>
				</Button>
				<div>
					<p className="text-sm text-muted-foreground">
						Page {currentPage} of {pageCount}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					type="button"
					onClick={handleNextPage}
					disabled={currentPage === pageCount}
				>
					<span className="sm:inline hidden ml-2">Next</span>
					<IconChevronRight />
				</Button>
			</div>
		);
	},
);

const SearchBar = memo(({ selectedType, group }: SearchBarProps) => {
	const nameSearchTag = getNameSearchTag(selectedType, group);
	if (!nameSearchTag) return null;

	const [searchParams] = useSearchParams();
	const suppressNavigation = useSuppressTopLoadingBar();

	let currentQuery = searchParams.get(nameSearchTag) || "";

	const form = useForm({
		mode: "onSubmit",
		defaultValues: {
			query: currentQuery?.trim() || "",
		},
	});

	const { setValue, handleSubmit, control, getValues } = form;

	function handleClearQuery() {
		suppressNavigation(() => {
			searchParams.delete(nameSearchTag as string);
		}).setSearchParams(searchParams);
		setValue("query", "");
	}

	const submitQuery = (values: { query: string }) => {
		const searchValue = values.query?.trim() || "";
		suppressNavigation(() => {
			if (searchValue) {
				searchParams.set(nameSearchTag, searchValue);
			} else {
				searchParams.delete(nameSearchTag);
			}
		}).setSearchParams(searchParams);
	};

	useEffect(() => {
		if (selectedType && getValues("query") !== "") {
			setValue("query", "");
		}
	}, [selectedType]);

	return (
		<form onSubmitCapture={handleSubmit(submitQuery)} noValidate>
			<Controller
				name="query"
				control={control}
				render={({ field }) => (
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder={`Search ${CondTypeLabels[selectedType].plural.toLowerCase()}...`}
							name={nameSearchTag}
							className="w-full px-8"
							id="search"
							defaultValue={field.value}
							value={field.value}
							onChange={field.onChange}
						/>
						{field.value?.length > 0 && (
							<span
								className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
								onClick={handleClearQuery}
							>
								<X className="text-muted-foreground" width={18} />
							</span>
						)}
					</div>
				)}
			/>
			{/* Invisible submit button: Enter in input triggers submit */}
			<button type="submit" className="hidden">
				<span className="sr-only">Search</span>
			</button>
		</form>
	);
});

const PaginationSkeleton = () => {
	return (
		<div className="flex gap-2 justify-between my-4 items-center">
			<Skeleton className="mr-2 sm:w-[6rem] w-[2rem] h-[1.8rem]" />
			<Skeleton className="h-4 w-[66px] rounded-sm" />
			<Skeleton className="ml-2 sm:w-[6rem] w-[2rem] h-[1.8rem]" />
		</div>
	);
};

const AccordianSkeleton = memo(function AccordianSkeletonsFunc({
	main_skeletons = 3,
	sub_skeletons = 2,
}: {
	main_skeletons?: number;
	sub_skeletons?: number;
}) {
	return (
		<div>
			{Array.from({ length: main_skeletons }, (_, idx) => (
				<Accordion
					key={idx}
					transition={{ duration: 0.2, ease: "easeInOut" }}
					className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50 mb-2"
				>
					<AccordionItem value={idx}>
						<AccordionTrigger className="w-full text-left hover:underline underline-offset-4">
							<div className="flex items-center justify-between">
								<Label className="flex items-center px-2 py-2 cursor-pointer">
									<Skeleton className="h-4 w-4 rounded-sm" />
									<Skeleton className="h-4 min-w-[250px] rounded-sm" />
								</Label>
								<ChevronUp className="h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180" />
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4">
							<div className="border-sidebar-border flex min-w-0 flex-col gap-0 border-l px-2.5 py-0.5">
								{Array.from({ length: sub_skeletons }, (_, sub_idx) => sub_idx).map((sub) => (
									<Label className="flex items-center px-2 py-2 cursor-pointer" key={sub}>
										<Skeleton className="h-4 w-4 rounded-sm" />
										<Skeleton className="h-4 min-w-[250px] rounded-sm" />
									</Label>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			))}
		</div>
	);
});

const LineSkeleton = memo(function LineSkeletonsFunc({ lines = 4 }: { lines?: number }) {
	return (
		<div className="w-full">
			{Array.from({ length: lines }, (_, idx) => (
				<div key={idx}>
					<Label className="flex items-center px-2 py-2 cursor-pointer">
						<Skeleton className="h-4 w-4 rounded-sm" />
						<Skeleton className="h-4 min-w-[250px] rounded-sm" />
					</Label>
				</div>
			))}
		</div>
	);
});

const CategoriesSelectionArea = memo(
	({ field, resolvedData }: SelectionAreaProps<GetAllCategoriesResponse>) => {
		if (resolvedData == null) return <AccordianSkeleton />;

		const { categories, error: fetchError } = resolvedData;

		useEffect(() => {
			if (fetchError) toast.error(fetchError.message);
		}, [fetchError]);

		if (
			!categories ||
			!Array.isArray(categories) ||
			categories.length === 0 ||
			fetchError?.ok === false
		) {
			return (
				<div className="my-9 p-4 pt-6">
					<p className="text-muted-foreground w-fit text-sm mx-auto">No categories found</p>
				</div>
			);
		}

		const selectedIds = Array.isArray(field.value) ? field.value : [];

		const getSubcategoryCheckboxState = (subCategory: SubCategoryListRow): StateCheckResp => {
			const isSelected = (selectedIds as string[]).includes(subCategory.id);
			return {
				checked: isSelected,
				indeterminate: false, // Subcategories have no children, so no indeterminate state
			};
		};

		const getCategoryCheckboxState = (category: CategoryListRow): StateCheckResp => {
			const subCategoryIds = category.sub_category.map((sub) => sub.id);
			const selectedSubCategoryCount = subCategoryIds.filter((id) =>
				(selectedIds as string[]).includes(id),
			).length;
			const totalSubCategories = subCategoryIds.length;
			return {
				checked: selectedSubCategoryCount === totalSubCategories && totalSubCategories > 0,
				indeterminate: selectedSubCategoryCount > 0 && selectedSubCategoryCount < totalSubCategories,
			};
		};

		const handleSubcategoryToggle = (subCategoryId: string, checked: boolean) => {
			if (checked) {
				field.onChange([...selectedIds, subCategoryId]);
			} else {
				field.onChange((selectedIds as string[]).filter((id: string) => id !== subCategoryId));
			}
		};

		const handleCategoryToggle = (category: CategoryListRow, checked: boolean) => {
			const subCategoryIds = category.sub_category.map((sub) => sub.id);
			if (checked) {
				// Add all subcategory IDs that aren't already selected
				const newIds = subCategoryIds.filter((id) => !(selectedIds as string[]).includes(id));
				field.onChange([...selectedIds, ...newIds]);
			} else {
				// Remove all subcategory IDs of this category
				field.onChange(
					(selectedIds as string[]).filter((id: string) => !subCategoryIds.includes(id)),
				);
			}
		};

		return categories.map((cat: CategoryListRow) => {
			const categoryState = getCategoryCheckboxState(cat);
			return (
				<Accordion
					key={cat.id}
					transition={{ duration: 0.2, ease: "easeInOut" }}
					className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50 mb-2"
				>
					<AccordionItem value={cat.id}>
						<AccordionTrigger className="w-full text-left hover:underline underline-offset-4 focus:underline focus:decoration-accent-foreground">
							<div className="flex items-center justify-between">
								<Label className="flex items-center px-2 py-2 cursor-pointer">
									<Checkbox
										checked={
											categoryState.checked ||
											(categoryState.indeterminate && "indeterminate")
										}
										onCheckedChange={(checked) =>
											handleCategoryToggle(cat, checked as boolean)
										}
										className="mr-2"
									/>
									{cat.category_name}
								</Label>
								<ChevronUp className="h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180" />
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4">
							{cat.sub_category.length > 0 ? (
								<div className="border-sidebar-border flex min-w-0 flex-col gap-1 border-l px-2.5 py-0.5">
									{cat.sub_category.map((sub) => {
										const subCategoryState = getSubcategoryCheckboxState(sub);
										return (
											<div
												key={sub.id}
												className="w-full text-left hover:underline underline-offset-4"
											>
												<Label className="flex items-center px-2 py-1 cursor-pointer">
													<Checkbox
														checked={subCategoryState.checked}
														onCheckedChange={(checked) =>
															handleSubcategoryToggle(
																sub.id,
																checked as boolean,
															)
														}
														className="mr-2"
													/>
													{sub.sub_category_name}
												</Label>
											</div>
										);
									})}
								</div>
							) : (
								<div className="border-sidebar-border mx-3 flex min-w-0 translate-x-px flex-col gap-1 border-l pl-6 mt-1">
									<p className="text-muted-foreground text-sm">
										No sub-categories found for {cat.category_name.toLowerCase()}
									</p>
								</div>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			);
		});
	},
);

const SKUsSelectionArea = memo(({ field, resolvedData }: SelectionAreaProps<SKUsNamesListResponse>) => {
	if (resolvedData == null) return <LineSkeleton lines={SKUS_PAGE_SIZE} />;

	const { skus, error: fetchError } = resolvedData;
	console.log("SKUS", skus);

	useEffect(() => {
		if (fetchError) toast.error(fetchError.message);
	}, [fetchError]);

	if (skus == null || !skus || !Array.isArray(skus) || skus.length === 0 || fetchError?.ok === false) {
		return (
			<div className="my-9 p-4 pt-6">
				<p className="text-muted-foreground w-fit text-sm mx-auto">No SKUs found</p>
			</div>
		);
	}

	const handleToggle = (id: string, checked: boolean) => {
		const currentIds = Array.isArray(field.value) ? field.value : [];
		if (checked) {
			field.onChange([...currentIds, id]);
		} else {
			field.onChange((currentIds as string[]).filter((selectedId: string) => selectedId !== id));
		}
	};

	return (
		<div className="grid gap-2">
			{skus.map((sku: SKUsNameListRow) => (
				<div className="w-full text-left hover:underline underline-offset-4" key={sku.id}>
					<Label className="flex items-center px-2 py-2 cursor-pointer">
						<Checkbox
							checked={(field.value as string[]).includes(sku.id)}
							onCheckedChange={(checked) => handleToggle(sku.id, checked as boolean)}
							className="mr-2"
						/>
						{sku.sku}
					</Label>
				</div>
			))}
		</div>
	);
});

const CollectionsSelectionArea = memo(
	({ field, resolvedData }: SelectionAreaProps<CollectionsNamesListResponse>) => {
		if (resolvedData == null) return <LineSkeleton lines={COLLECTIONS_PAGE_SIZE} />;

		const { collections, error: fetchError } = resolvedData;
		// console.log("SKUS", collections);

		useEffect(() => {
			if (fetchError) toast.error(fetchError.message);
		}, [fetchError]);

		if (
			!collections ||
			!Array.isArray(collections) ||
			collections.length === 0 ||
			fetchError?.ok === false
		) {
			return (
				<div className="my-9 p-4 pt-6">
					<p className="text-muted-foreground w-fit text-sm mx-auto">No collections found</p>
				</div>
			);
		}

		const handleToggle = (id: string, checked: boolean) => {
			const currentIds = Array.isArray(field.value) ? field.value : [];
			if (checked) {
				field.onChange([...currentIds, id]);
			} else {
				field.onChange((currentIds as string[]).filter((selectedId: string) => selectedId !== id));
			}
		};

		return (
			<div className="grid gap-2">
				{collections.map((collection: CollectionNameListRow) => (
					<div className="w-full text-left hover:underline underline-offset-4" key={collection.id}>
						<Label className="flex items-center px-2 py-2 cursor-pointer">
							<Checkbox
								checked={(field.value as string[]).includes(collection.id)}
								onCheckedChange={(checked) => handleToggle(collection.id, checked as boolean)}
								className="mr-2"
							/>
							{collection.name}
						</Label>
					</div>
				))}
			</div>
		);
	},
);

export const BuyXGetYCard = ({ control, disabled }: BuyXGetYCardProps) => {
	const { setValue } = useFormContext();

	const discountType = useWatch({ control, name: "discount_type" });
	if (discountType !== "buy_x_get_y") return null;

	const selectedBuyMinValueType = useWatch({ control, name: "buy_x_get_y.buy_min_type" });
	const selectedBuyType = useWatch({ control, name: "buy_x_get_y.buy_group.type" }) as TypesToSelect;
	const selectedGetType = useWatch({ control, name: "buy_x_get_y.get_group.type" }) as TypesToSelect;

	const {
		buyCategoriesData,
		buySkusData,
		buyCollectionsData,
		getCategoriesData,
		getSkusData,
		getCollectionsData,
	} = useLoaderData<CreateCouponsLoader>();

	const [searchParams] = useSearchParams();
	const suppressNavigation = useSuppressTopLoadingBar();

	type ConditionChangeFuncProps = {
		value: string;
		field: ControllerRenderProps<CouponFormValues>;
	};

	type SelectionFuncProps = {
		field: ControllerRenderProps<CouponFormValues>;
		group: GroupOptions;
	};

	type GetSelectedTypesFuncProps = {
		selectedType: TypesToSelect;
		field: ControllerRenderProps<CouponFormValues>;
		data:
			| Promise<SKUsNamesListResponse>
			| Promise<CollectionsNamesListResponse>
			| Promise<GetAllCategoriesResponse>
			| null;
	};

	// Set URL parameters when condition type changes
	useEffect(() => {
		// Create a new URLSearchParams object to avoid mutating the existing one
		const newParams = new URLSearchParams(searchParams);
		suppressNavigation(() => {
			// Remove all condition-related parameters first
			// Clear all condition-related parameters
			[
				"buy_categories",
				"buy_collections",
				"buy_skus",
				"get_categories",
				"get_collections",
				"get_skus",
				"buy_category_search",
				"buy_collection_search",
				"buy_sku_search",
				"get_category_search",
				"get_collection_search",
				"get_sku_search",
				"buy_category_page",
				"buy_collection_page",
				"buy_sku_page",
				"get_category_page",
				"get_collection_page",
				"get_sku_page",
			].forEach((param) => newParams.delete(param));

			// Set flags for "buy" group
			if (selectedBuyType === "category") {
				newParams.set("buy_categories", "true");
			} else if (selectedBuyType === "collection") {
				newParams.set("buy_collections", "true");
			} else if (selectedBuyType === "sku") {
				newParams.set("buy_skus", "true");
			}

			// Set flags for "get" group
			if (selectedGetType === "category") {
				newParams.set("get_categories", "true");
			} else if (selectedGetType === "collection") {
				newParams.set("get_collections", "true");
			} else if (selectedGetType === "sku") {
				newParams.set("get_skus", "true");
			}
		}).setSearchParams(newParams);
	}, [selectedBuyType, selectedGetType]);

	const handleConditionChange = ({ value, field }: ConditionChangeFuncProps) => {
		setValue("buy_x_get_y.buy_min_value", "");
		field.onChange(value);
	};

	const getSelectTypes = ({ selectedType, field, data }: GetSelectedTypesFuncProps) => {
		// if (!data) {
		// 	return (
		// 		<div className="my-9 p-4 pt-6">
		// 			<p className="text-muted-foreground w-fit text-sm mx-auto">
		// 				No {CondTypeLabels[selectedType].plural.toLowerCase()} found
		// 			</p>
		// 		</div>
		// 	);
		// }

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
										group={field.name.includes("buy") ? "buy" : "get"}
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
										group={field.name.includes("buy") ? "buy" : "get"}
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
										group={field.name.includes("buy") ? "buy" : "get"}
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
				category: buyCategoriesData,
				sku: buySkusData,
				collection: buyCollectionsData,
			};
			return getSelectTypes({ selectedType: selectedBuyType, field, data: responses[selectedBuyType] });
		} else if (group === "get") {
			const responses = {
				category: getCategoriesData,
				sku: getSkusData,
				collection: getCollectionsData,
			};
			return getSelectTypes({ selectedType: selectedGetType, field, data: responses[selectedGetType] });
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

				<CardContent className="space-y-4">
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
