import { ChevronUp, Search, X } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import type {
	CollectionDataCategory,
	CollectionDataItemsResponse,
	CollectionDataProduct,
	CollectionDataSubCategory,
	SelectedProduct,
} from "~/types/collections";
import { useLocation, useNavigation, useSearchParams, Form as RouterForm } from "react-router";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "~/components/ui/accordion";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { defaults } from "~/constants";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import { Controller, useForm } from "react-hook-form";

type ProductSelectionDialogProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
	data: CollectionDataItemsResponse;
	onSelect: (selectedProducts: SelectedProduct[]) => void;
	selectedProducts: SelectedProduct[];
};

export const PRODUCT_SEARCH_TAG = "prodSearch";
export const PRODUCT_PAGE_TAG = "prodPage";
export const CATEGORY_PAGE_TAG = "catPage";

const ProductSelectionDialogSkeleton = memo(function SkeletonsFunc({
	main_skeletons = 3,
	sub_skeletons = 2,
	products = 3,
}: {
	main_skeletons?: number;
	sub_skeletons?: number;
	products?: number;
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
									<Accordion
										key={sub}
										transition={{ duration: 0.2, ease: "easeInOut" }}
										className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50"
									>
										<AccordionItem value={sub}>
											<AccordionTrigger className="w-full text-left hover:underline underline-offset-4">
												<div className="flex items-center justify-between">
													<Label className="flex items-center px-2 py-2 cursor-pointer">
														<Skeleton className="h-4 w-4 rounded-sm" />
														<Skeleton className="h-4 min-w-[250px] rounded-sm" />
													</Label>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<div className="border-sidebar-border mx-3 flex min-w-0 translate-x-px flex-col gap-2 border-l px-2.5 py-0.5">
													{Array.from(
														{ length: products },
														(_, product_idx) => product_idx,
													).map((product) => (
														<Skeleton
															className="h-4 w-[min(250px,100%)] rounded-sm ml-2 last:mb-1"
															key={product}
														/>
													))}
												</div>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			))}
		</div>
	);
});

const PaginationOptions = memo(({ totalCategories }: { totalCategories: number }) => {
	if (totalCategories === null) return null;
	const suppressNavigation = useSuppressTopLoadingBar();
	const [searchParams] = useSearchParams();

	const categoryPageSize = defaults.DEFAULT_COLLECTIONS_CATEGORY_PAGE_SIZE;
	const pageCount = Math.ceil(totalCategories / categoryPageSize);
	console.log(pageCount);

	const currentPage =
		pageCount === 0
			? 0
			: searchParams.get(PRODUCT_PAGE_TAG)
			? Number(searchParams.get(PRODUCT_PAGE_TAG))
			: 1;

	const isFirstPage = pageCount === 0 ? true : currentPage === 1;
	const isLastPage = currentPage === pageCount;

	console.log("Current Page", currentPage, "Page Count", pageCount);

	const handlePrevPage = () => {
		if (currentPage > 1) {
			suppressNavigation(() => {
				searchParams.set(PRODUCT_PAGE_TAG, (currentPage - 1).toString());
			}).setSearchParams(searchParams);
		}
	};

	const handleNextPage = () => {
		if (currentPage < pageCount) {
			suppressNavigation(() => {
				searchParams.set(PRODUCT_PAGE_TAG, (currentPage + 1).toString());
			}).setSearchParams(searchParams);
		}
	};

	return (
		<div className="flex gap-2 justify-between my-4 items-center">
			<Button variant="outline" size="sm" onClick={handlePrevPage} disabled={isFirstPage}>
				<IconChevronLeft />
				<span className="sm:inline hidden mr-2">Previous</span>
			</Button>
			<div>
				<p className="text-sm text-muted-foreground">
					Page {currentPage} of {pageCount}
				</p>
			</div>
			<Button variant="outline" size="sm" onClick={handleNextPage} disabled={isLastPage}>
				<span className="sm:inline hidden ml-2">Next</span>
				<IconChevronRight />
			</Button>
		</div>
	);
});

const SearchBar = () => {
	const suppressNavigation = useSuppressTopLoadingBar();
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get(PRODUCT_SEARCH_TAG) || "";

	const form = useForm({
		mode: "onSubmit",
		defaultValues: {
			query: currentQuery?.trim() || "",
		},
	});

	const { setValue, handleSubmit, control } = form;

	function handleClearQuery() {
		suppressNavigation(() => {
			searchParams.delete(PRODUCT_SEARCH_TAG);
			searchParams.delete(PRODUCT_PAGE_TAG);
			searchParams.delete(PRODUCT_PAGE_TAG);
		}).setSearchParams(searchParams);
		setValue("query", "");
	}

	const customQuerySubmit = (values: { query: string }) => {
		const searchValue = values.query?.trim() || "";
		suppressNavigation(() => {
			if (searchValue) {
				searchParams.set(PRODUCT_SEARCH_TAG, searchValue);
			} else {
				searchParams.delete(PRODUCT_SEARCH_TAG);
			}
			searchParams.set(PRODUCT_PAGE_TAG, "1");
			searchParams.set(PRODUCT_PAGE_TAG, "1");
		}).setSearchParams(searchParams);
	};

	return (
		<RouterForm method="get" action="?" onSubmit={handleSubmit(customQuerySubmit)}>
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
							placeholder="Search products"
							name={PRODUCT_SEARCH_TAG}
							className="w-full px-8"
							id="search"
							value={field.value}
							onChange={field.onChange}
						/>
						{currentQuery?.trim()?.length > 0 && (
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
				Search
			</button>
		</RouterForm>
	);
};

export function ProductSelectionDialog({
	open,
	setOpen,
	data,
	onSelect,
	selectedProducts,
}: ProductSelectionDialogProps) {
	const [tempSelected, setTempSelected] = useState<SelectedProduct[]>(selectedProducts);
	const [productsToShow, setProductsToShow] = useState<Record<string, number>>({});
	const categories = data?.categories || [];
	// console.log(selectedProducts);

	const navigation = useNavigation();
	const location = useLocation();

	const productsPageSize = defaults.DEFAULT_COLLECTIONS_PRODUCTS_PAGE_SIZE;

	useEffect(() => {
		setTempSelected(selectedProducts);
	}, [selectedProducts, open]);

	useEffect(() => {
		const initial = categories.reduce(
			(acc, cat) => {
				cat.sub_categories.forEach((sub) => {
					acc[sub.id] = Math.min(productsPageSize, sub.product_count);
				});
				return acc;
			},
			{} as Record<string, number>,
		);
		setProductsToShow(initial);
	}, [categories]);

	const isSearching = useMemo(
		() => navigation.state === "loading" && navigation.location?.pathname === location.pathname,
		[navigation.state, navigation.location?.pathname, location.pathname],
	);

	const handleProductToggle = (product: CollectionDataProduct) => {
		setTempSelected((prev) => {
			if (prev.some((p) => p.id === product.id)) {
				return prev.filter((p) => p.id !== product.id);
			} else {
				return [...prev, { id: product.id, name: product.name }];
			}
		});
	};

	const handleSubcategoryToggle = (subCategory: CollectionDataSubCategory) => {
		const productIds = subCategory.products.map((p) => p.id);
		const allSelected = productIds.every((id) => tempSelected.some((p) => p.id === id));
		if (allSelected) {
			setTempSelected((prev) => prev.filter((p) => !productIds.includes(p.id)));
		} else {
			const newProducts = subCategory.products.map((p) => ({ id: p.id, name: p.name }));
			setTempSelected((prev) => [
				...prev,
				...newProducts.filter((np) => !prev.some((p) => p.id === np.id)),
			]);
		}
	};

	const handleCategoryToggle = (category: CollectionDataCategory) => {
		const productIds = category.sub_categories.flatMap((sub) => sub.products.map((p) => p.id));
		const allSelected = productIds.every((id) => tempSelected.some((p) => p.id === id));
		if (allSelected) {
			setTempSelected((prev) => prev.filter((p) => !productIds.includes(p.id)));
		} else {
			const allProducts = category.sub_categories.flatMap((sub) =>
				sub.products.map((p) => ({ id: p.id, name: p.name })),
			);
			setTempSelected((prev) => [
				...prev,
				...allProducts.filter((np) => !prev.some((p) => p.id === np.id)),
			]);
		}
	};

	type StateCheckResp = { checked: boolean; indeterminate: boolean };

	const getCategoryCheckboxState = (category: CollectionDataCategory): StateCheckResp => {
		const productIds = category.sub_categories.flatMap((sub) => sub.products.map((p) => p.id));
		const selectedCount = productIds.filter((id) => tempSelected.some((p) => p.id === id)).length;
		return {
			checked: selectedCount === productIds.length && productIds.length > 0,
			indeterminate: selectedCount > 0 && selectedCount < productIds.length && productIds.length > 0,
		};
	};

	const getSubcategoryCheckboxState = (subCategory: CollectionDataSubCategory): StateCheckResp => {
		const productIds = subCategory.products.map((p) => p.id);
		const selectedCount = productIds.filter((id) => tempSelected.some((p) => p.id === id)).length;
		return {
			checked: selectedCount === productIds.length && productIds.length > 0,
			indeterminate: selectedCount > 0 && selectedCount < productIds.length && productIds.length > 0,
		};
	};

	const handleConfirm = () => {
		if (tempSelected.length === 0) {
			toast.error("Please select at least one product.");
			return;
		}
		onSelect(tempSelected);
		setOpen(false);
	};

	//TODO: Show a sheet where we display the information of product when we click on the name of product in the table list

	const showMoreProducts = (subId: string) => {
		setProductsToShow((prev) => {
			const current = prev[subId] || productsPageSize;
			const subCategory = categories
				.flatMap((cat) => cat.sub_categories)
				.find((sub) => sub.id === subId);
			const total = subCategory ? subCategory.product_count : 0;
			const next = Math.min(current + productsPageSize, total);
			return { ...prev, [subId]: next };
		});
	};
	// console.log("Categories: ", categories);

	const ProductsArea = () => {
		if (isSearching) {
			return <ProductSelectionDialogSkeleton />;
		} else {
			return categories.length > 0 ? (
				categories.map((cat) => (
					<Accordion
						key={cat.id}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50 mb-2"
					>
						<AccordionItem value={cat.id}>
							<AccordionTrigger className="w-full text-left hover:underline underline-offset-4">
								<div className="flex items-center justify-between">
									<Label className="flex items-center px-2 py-2 cursor-pointer">
										<Checkbox
											checked={
												getCategoryCheckboxState(cat).checked ||
												(getCategoryCheckboxState(cat).indeterminate &&
													"indeterminate")
											}
											onCheckedChange={() => handleCategoryToggle(cat)}
											className="mr-2"
											disabled={
												cat.sub_categories.length === 0 ||
												cat.sub_categories.every((sub) => sub.products.length === 0)
											}
										/>
										{cat.category_name}
									</Label>
									<ChevronUp className="h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180" />
								</div>
							</AccordionTrigger>
							<AccordionContent className="px-4">
								{cat.sub_categories.length > 0 ? (
									<div className="border-sidebar-border flex min-w-0 flex-col gap-1 border-l px-2.5 py-0.5">
										{cat.sub_categories.map((sub) => (
											<Accordion
												key={sub.id}
												transition={{ duration: 0.2, ease: "easeInOut" }}
												className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50"
											>
												<AccordionItem value={sub.id}>
													<AccordionTrigger className="w-full text-left hover:underline underline-offset-4">
														<div className="flex items-center justify-between">
															<Label className="flex items-center px-2 py-1 cursor-pointer">
																<Checkbox
																	checked={
																		getSubcategoryCheckboxState(sub)
																			.checked ||
																		(getSubcategoryCheckboxState(sub)
																			.indeterminate &&
																			"indeterminate")
																	}
																	onCheckedChange={() =>
																		handleSubcategoryToggle(sub)
																	}
																	className="mr-2"
																	disabled={sub.products.length === 0}
																/>
																{sub.sub_category_name}
															</Label>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														{sub.products.length > 0 ? (
															<div className="border-sidebar-border mx-3 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5">
																{sub.products
																	.slice(0, productsToShow[sub.id] || 7)
																	.map((product) => (
																		<div
																			key={product.id}
																			className="hover:underline underline-offset-4"
																		>
																			<Label className="flex items-center px-2 py-1 cursor-pointer">
																				<Checkbox
																					checked={tempSelected.some(
																						(p) =>
																							p.id ===
																							product.id,
																					)}
																					onCheckedChange={() =>
																						handleProductToggle(
																							product,
																						)
																					}
																					className="mr-2"
																				/>
																				{product.name}
																			</Label>
																		</div>
																	))}
																{productsToShow[sub.id] <
																	sub.product_count && (
																	<Button
																		variant="link"
																		size="sm"
																		onClick={() =>
																			showMoreProducts(sub.id)
																		}
																		className={cn("m-0 p-0")}
																	>
																		<p className="text-muted-foreground text-sm">
																			Show More
																		</p>
																	</Button>
																)}
															</div>
														) : (
															<div className="border-sidebar-border mx-3 flex min-w-0 translate-x-px flex-col gap-1 border-l pl-6 mt-1">
																<p className="text-muted-foreground text-sm">
																	No products found for{" "}
																	{sub.sub_category_name.toLowerCase()}
																</p>
															</div>
														)}
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										))}
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
				))
			) : (
				<div className="my-9 p-4 pt-6">
					<p className="text-muted-foreground w-fit text-sm mx-auto">No products found</p>
				</div>
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				className="sm:max-w-[550px]"
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Select Products for Collection</DialogTitle>
					<DialogDescription>Choose products from categories and sub-categories.</DialogDescription>
				</DialogHeader>
				<div className="max-h-96 overflow-y-auto space-y-4">
					<SearchBar />
					<div>
						<ProductsArea />
					</div>
				</div>
				<PaginationOptions totalCategories={data.totalCategories ?? 0} />
				<DialogFooter className="space-x-1">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleConfirm}>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
