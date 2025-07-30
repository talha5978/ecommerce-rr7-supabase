import { zodResolver } from "@hookform/resolvers/zod";
import { Form as RouterForm } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import {
	ActionFunctionArgs,
	Await,
	LoaderFunctionArgs,
	useActionData,
	useLocation,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { queryClient } from "~/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { ChevronUp, Loader2, PlusCircle, RefreshCcw, Search, Trash2, X } from "lucide-react";
import { memo, Suspense, useEffect, useMemo, useState } from "react";
import {
	TagsInput,
	TagsInputClear,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { COLLECTION_IMG_DIMENSIONS, defaults } from "~/constants";
import { toast } from "sonner";
import { ApiError } from "~/utils/ApiError";
import type { ActionResponse } from "~/types/action-data";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/create-collection";
import ImageInput from "~/components/Custom-Inputs/image-input";
import {
	CollectionActionDataSchema,
	CollectionFormValues,
	CollectionInputSchema,
} from "~/schemas/collections.schema";
import { DataTable } from "~/components/Table/data-table";
import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
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
import { Checkbox } from "~/components/ui/checkbox";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { useSearchParams } from "react-router";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "~/components/ui/accordion";
import { collectionDataItemsQuery } from "~/queries/collections.q";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { CollectionsService } from "~/services/collections.service";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const data = {
		name: formData.get("name") as string,
		description: formData.get("description") as string,
		image: formData.get("image") as File,
		sort_order: formData.get("sort_order") as string,
		status: formData.get("status") as string,
		meta_details: {
			meta_title: formData.get("meta_details.meta_title") as string,
			meta_description: formData.get("meta_details.meta_description") as string,
			url_key: formData.get("meta_details.url_key") as string,
			meta_keywords: formData.get("meta_details.meta_keywords"),
		},
		product_ids: formData.getAll("product_ids") as string[],
	};

	const parseResult = CollectionActionDataSchema.safeParse(data);
	// console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// console.log("Data in the action: ", parseResult.data);

	const collectionSvc = new CollectionsService(request);
	// return;
	try {
		await collectionSvc.createCollection(parseResult.data);
		await queryClient.invalidateQueries({ queryKey: ["highLvlCollections"] });
		return { success: true };
	} catch (error: any) {
		// console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create collection";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { searchParams } = new URL(request.url);
	const categoryPageParam = Number(searchParams.get("catPage"));
	const productPageParam = Number(searchParams.get("prodPage"));
	const productSearchQuery = searchParams.get("prodSearch") || "";
	// console.log(Math.max(0, categoryPageParam - 1), Math.max(0, productPageParam - 1));

	const collectionsDataItems = queryClient.fetchQuery(
		collectionDataItemsQuery({
			request,
			...(productSearchQuery && { q: productSearchQuery }),
			categoryPageIndex: categoryPageParam ? Math.max(0, categoryPageParam - 1) : 0,
			productPageIndex: productPageParam ? Math.max(0, productPageParam - 1) : 0,
		}),
	);

	return { collectionsDataItems };
};

export default function CreateCollectionPage({ loaderData: { collectionsDataItems } }: Route.ComponentProps) {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<CollectionFormValues>({
		resolver: zodResolver(CollectionInputSchema),
		mode: "onSubmit",
		defaultValues: {
			name: "",
			description: "",
			image: undefined,
			status: "true",
			meta_details: {
				meta_title: "",
				meta_description: "",
				url_key: "",
				meta_keywords: [],
			},
			sort_order: "1",
			selections: [],
		},
	});

	const {
		handleSubmit,
		setError,
		control,
		setValue,
		formState: { errors },
	} = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Collection created successfully");
				navigate(`/collections`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof CollectionFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	const selections = useWatch({ control, name: "selections" }) || [];

	const handleSelect = (selectedProducts: SelectedProduct[]) => {
		setValue("selections", selectedProducts);
		setDialogOpen(false);
	};

	const actualCols: ColumnDef<SelectedProduct, unknown>[] = [
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
			id: "selected_products",
			header: "Selected Products",
			cell: ({ row }) => {
				const rowData = row.original;

				return (
					<div
						key={rowData.id}
						className="flex items-center justify-between max-[500px]:max-w-[200px] max-[800px]:max-w-[450px] max-w-[650px]"
					>
						<p className="truncate">{rowData.name}</p>
					</div>
				);
			},
		},
		{
			id: "actions",
			header: () => <span className="flex justify-center">Actions</span>,
			cell: ({ row }) => {
				const removeProduct = (e: React.MouseEvent) => {
					e.preventDefault();
					const updatedSelections = selections.filter((p) => p.id !== row.original.id);
					setValue("selections", updatedSelections);
				};

				return (
					<span className="flex justify-center">
						<Tooltip>
							<TooltipTrigger>
								<button
									aria-label="Remove product"
									onClick={removeProduct}
									className="cursor-pointer"
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</button>
							</TooltipTrigger>
							<TooltipContent side="left">
								<p>Remove</p>
							</TooltipContent>
						</Tooltip>
					</span>
				);
			},
		},
	];

	const tableColumns = useMemo(() => actualCols, [selections]);

	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: defaults.DEFAULT_COLLECTIONS_PAGE_SIZE,
	});

	const removeSelectedRows = () => {
		const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id); // Map row indices to product IDs
		const updatedSelections = selections.filter((p) => !selectedIds.includes(p.id));
		setValue("selections", updatedSelections);
		table.resetRowSelection();
	};

	const table = useReactTable({
		data: selections,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: setPagination,
		state: {
			pagination,
		},
	});

	async function onFormSubmit(values: CollectionFormValues) {
		// toast.info("Creating collection...");
		console.log("Form values: ", values);

		if (values.selections.length === 0) {
			toast.error("Please select at least one product.");
			return;
		}

		if (!values.image) {
			toast.error("Please upload an image.");
			return;
		}

		const formData = new FormData();
		formData.set("name", values.name.trim());
		formData.set("description", values.description.trim());
		formData.set("image", values.image);
		formData.set("status", values.status ?? "true");
		formData.set("sort_order", values.sort_order ?? "1");
		formData.set("meta_details.meta_title", values.meta_details.meta_title.trim());
		formData.set("meta_details.meta_description", values.meta_details.meta_description.trim());
		formData.set("meta_details.url_key", values.meta_details.url_key.trim().toLowerCase());
		if (values.meta_details.meta_keywords) {
			const stringifiedKeywords = values.meta_details.meta_keywords
				.map((keyword) => keyword.trim())
				.join(",");
			formData.set("meta_details.meta_keywords", stringifiedKeywords);
		}

		values.selections.forEach((product) => {
			formData.append("product_ids", product.id.toString());
		});

		submit(formData, {
			method: "POST",
			action: "/collections/create",
			encType: "multipart/form-data",
		});
	}

	return (
		<>
			<MetaDetails
				metaTitle="Create Collection | Admin Panel"
				metaDescription="Create new collection"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/collections" />
					<h1 className="text-2xl font-semibold">Create Collection</h1>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* Left Side: General and Meta Details */}
						<div className="grid grid-cols-3 gap-4">
							{/* General Card */}
							<Card className="md:col-span-2 col-span-3">
								<CardHeader>
									<CardTitle className="text-lg">General</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Product Name */}
									<FormField
										control={control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Product Name</FormLabel>
												<FormControl>
													<Input placeholder="e.g. New Arrivals" {...field} />
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
														placeholder="Describe the collection in a few words"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Image Upload */}
									<FormField
										control={control}
										name="image"
										render={() => (
											<FormItem>
												<FormLabel>Image</FormLabel>
												<FormControl>
													<ImageInput
														name="image"
														dimensions={COLLECTION_IMG_DIMENSIONS}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Right Side: Visibility SORT ORDER */}
							<div className="md:col-span-1 col-span-3 h-full">
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Visibility</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* Status */}
										<FormField
											control={control}
											name="status"
											render={({ field }) => (
												<FormItem className="space-y-1">
													<FormLabel>Status</FormLabel>
													<FormControl>
														<div className="space-y-2">
															<RadioGroup
																onValueChange={field.onChange}
																value={field.value}
															>
																<div className="flex items-center gap-3 *:cursor-pointer">
																	<RadioGroupItem
																		value="true"
																		id="status-active"
																	/>
																	<Label htmlFor="status-active">
																		Active
																	</Label>
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
															<span className="text-muted-foreground text-sm">
																If inactive, the collection will not be
																visible in the store
															</span>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Separator />
										{/* sort_order */}
										<FormField
											control={control}
											name="sort_order"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Sort Order</FormLabel>
													<FormControl>
														<Input type="number" placeholder="0" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</CardContent>
								</Card>
							</div>
						</div>

						{/* PRODUCTS SELECTION */}
						<Card>
							<CardHeader className="flex items-center justify-between align-middle">
								<CardTitle className="text-lg mb-1">Products Selection</CardTitle>
								{(table.getIsSomePageRowsSelected() || table.getIsAllPageRowsSelected()) && (
									<div>
										<Button
											type="button"
											variant="link"
											size="sm"
											onClick={removeSelectedRows}
											className="space-x-1 text-destructive"
										>
											<Trash2 className="h-3 w-3" />
											<span>Remove</span>
										</Button>
									</div>
								)}
							</CardHeader>
							<CardContent className="space-y-6">
								<DataTable
									table={table}
									customEmptyMessage="No products selected :)"
									cellClassName="**:data-[slot=table-cell]:last:bg-transparent"
								/>
								<div className="flex items-center justify-between">
									<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
										{table.getFilteredSelectedRowModel().rows.length} of{" "}
										{table.getFilteredRowModel().rows.length} product
										{table.getFilteredRowModel().rows.length === 1 ? "" : "s"} selected.
									</div>
									<div className="flex w-full items-center gap-8 lg:w-fit">
										<div className="flex w-fit items-center justify-center text-sm font-medium">
											Page {table.getState().pagination.pageIndex + 1} of{" "}
											{table.getPageCount() || 1}
										</div>
										<div className="ml-auto flex items-center gap-2 lg:ml-0">
											<Button
												variant="outline"
												className="hidden h-8 w-8 p-0 lg:flex"
												onClick={() => table.setPageIndex(0)}
												disabled={!table.getCanPreviousPage()}
											>
												<span className="sr-only">Go to first page</span>
												<IconChevronsLeft />
											</Button>
											<Button
												variant="outline"
												className="size-8"
												size="icon"
												onClick={() => table.previousPage()}
												disabled={!table.getCanPreviousPage()}
											>
												<span className="sr-only">Go to previous page</span>
												<IconChevronLeft />
											</Button>
											<Button
												variant="outline"
												className="size-8"
												size="icon"
												onClick={() => table.nextPage()}
												disabled={!table.getCanNextPage()}
											>
												<span className="sr-only">Go to next page</span>
												<IconChevronRight />
											</Button>
											<Button
												variant="outline"
												className="hidden size-8 lg:flex"
												size="icon"
												onClick={() => table.setPageIndex(table.getPageCount() - 1)}
												disabled={!table.getCanNextPage()}
											>
												<span className="sr-only">Go to last page</span>
												<IconChevronsRight />
											</Button>
										</div>
									</div>
								</div>
								{/* TABLE FOR PRODUCTS */}
								<div>
									{errors.selections && (
										<p className="text-destructive text-sm">
											{errors.selections.message}
										</p>
									)}
								</div>
								<div className="flex justify-end">
									<Button
										type="button"
										variant="outline"
										onClick={() => setDialogOpen(true)}
									>
										<PlusCircle className="h-4 w-4" />
										<span>Select Products</span>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Meta Details Card */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">SEO & Meta Attributes</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Meta Title */}
								<FormField
									control={control}
									name="meta_details.meta_title"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Meta Title</FormLabel>
											<FormControl>
												<Input placeholder="e.g. New Arrivals" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Meta Description */}
								<FormField
									control={control}
									name="meta_details.meta_description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Meta Description</FormLabel>
											<FormControl>
												<Textarea placeholder="A short summary for SEO" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Meta Keywords */}
								<FormField
									control={control}
									name="meta_details.meta_keywords"
									render={({ field, fieldState }) => (
										<FormItem>
											<FormLabel>Meta Keywords</FormLabel>
											<FormControl>
												<TagsInput
													value={field.value}
													onValueChange={field.onChange}
													max={defaults.META_KEYWORDS_VALUE} // Adjust as per your defaults
													editable
													addOnPaste
													className="w-full"
													aria-invalid={!!fieldState.error}
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
															<TagsInputInput
																placeholder="Add meta keywords..."
																className=""
															/>
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
													<div className="text-muted-foreground text-sm">
														You can add up to {defaults.META_KEYWORDS_VALUE}{" "}
														keywords
													</div>
												</TagsInput>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* URL Key */}
								<FormField
									control={control}
									name="meta_details.url_key"
									render={({ field }) => (
										<FormItem>
											<div className="flex gap-2">
												<FormLabel>URL Key</FormLabel>
												<span className="text-muted-foreground text-sm">
													(Without spaces)
												</span>
											</div>
											<FormControl>
												<Input placeholder="e.g. new-arrivals" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Submit Button */}
						<div className="flex justify-end md:col-span-3">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin mr-2" />}
								<span>Create</span>
							</Button>
						</div>
					</Form>
				</form>
				<Suspense fallback={<div>Loading collection items...</div>}>
					<Await resolve={collectionsDataItems as Promise<CollectionDataItemsResponse>}>
						{(resolvedData: CollectionDataItemsResponse) => (
							<ProductSelectionDialog
								open={dialogOpen}
								setOpen={setDialogOpen}
								data={resolvedData}
								onSelect={handleSelect}
								selectedProducts={selections}
							/>
						)}
					</Await>
				</Suspense>
			</section>
		</>
	);
}

type ProductSelectionDialogProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
	data: CollectionDataItemsResponse;
	onSelect: (selectedProducts: SelectedProduct[]) => void;
	selectedProducts: SelectedProduct[];
};

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

function ProductSelectionDialog({
	open,
	setOpen,
	data,
	onSelect,
	selectedProducts,
}: ProductSelectionDialogProps) {
	const [tempSelected, setTempSelected] = useState<SelectedProduct[]>(selectedProducts);

	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const navigation = useNavigation();
	const location = useLocation();
	const categoryPageSize = defaults.DEFAULT_COLLECTIONS_CATEGORY_PAGE_SIZE;
	const currentCategoryPage = searchParams.get("catPage") ? Number(searchParams.get("catPage")) : 1;
	const categories = data?.categories || [];
	const categoryPageCount = Math.ceil(data.totalCategories / categoryPageSize);
	const productsPageSize = defaults.DEFAULT_COLLECTIONS_PRODUCTS_PAGE_SIZE;
	const [productsToShow, setProductsToShow] = useState<Record<string, number>>({});

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

	let currentQuery = searchParams.get("prodSearch") || "";

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

	const goToPrevPage = () => {
		if (currentCategoryPage > 1) {
			setSearchParams(
				(prev) => {
					prev.set("catPage", (currentCategoryPage - 1).toString());
					return prev;
				},
				{ state: { suppressLoadingBar: true } },
			);
			navigate(`?${searchParams.toString()}`);
		}
	};

	const goToNextPage = () => {
		if (currentCategoryPage < categoryPageCount) {
			setSearchParams(
				(prev) => {
					prev.set("catPage", (currentCategoryPage + 1).toString());
					return prev;
				},
				{ state: { suppressLoadingBar: true } },
			);
			navigate(`?${searchParams.toString()}`);
		}
	};

	function handleClearQuery() {
		setSearchParams(
			(prev) => {
				prev.delete("prodSearch");
				return prev;
			},
			{ state: { suppressLoadingBar: true } },
		);
	}

	const customQuerySubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const searchValue = formData.get("prodSearch")?.toString().trim() || "";
		if (searchValue) {
			setSearchParams(
				(prev) => {
					prev.set("prodSearch", searchValue);
					prev.set("prodPage", "1");
					prev.set("catPage", "1");
					return prev;
				},
				{ state: { suppressLoadingBar: true } },
			);
		} else {
			setSearchParams(
				(prev) => {
					prev.delete("prodSearch");
					prev.set("prodPage", "1");
					prev.set("catPage", "1");
					return prev;
				},
				{ state: { suppressLoadingBar: true } },
			);
		}
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
				<div className="my-2 p-4 pt-6">
					<p className="text-muted-foreground w-fit text-sm mx-auto">No categories found</p>
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
					<RouterForm method="get" action="?" onSubmit={customQuerySubmit}>
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search products"
								name="prodSearch"
								className="w-full px-8"
								id="search"
								defaultValue={currentQuery?.trim()}
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
						{/* Invisible submit button: Enter in input triggers submit */}
						<button type="submit" className="hidden">
							Search
						</button>
					</RouterForm>
					<div>
						<ProductsArea />
					</div>
				</div>
				<div className="flex gap-2 justify-between my-4 items-center">
					<Button
						variant="outline"
						size="sm"
						onClick={goToPrevPage}
						disabled={currentCategoryPage === 1}
					>
						<IconChevronLeft />
						<span className="sm:inline hidden mr-2">Previous</span>
					</Button>
					<div>
						<p className="text-sm text-muted-foreground">
							Page {currentCategoryPage} of {categoryPageCount}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={goToNextPage}
						disabled={currentCategoryPage === categoryPageCount}
					>
						<span className="sm:inline hidden ml-2">Next</span>
						<IconChevronRight />
					</Button>
				</div>
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

// function CategoryDialog({
// 	open,
// 	setOpen,
// 	data,
// 	onSelect,
// 	selectedIds,
// }: CategoryDialogProps) {
// 	const navigate = useNavigate();
// 	const [searchParams, setSearchParams] = useSearchParams();
// 	const pageSize = 5; // small cPage size!
// 	const currentPage = searchParams.get("cPage") ? Number(searchParams.get("cPage")) : defaults.DEFAULT_CATEGORY_PAGE;
// 	const categories = data?.categories as CategoryListRow[] ?? [];
// 	const pageCount = Math.ceil(data.total / pageSize);

// 	const [tempSelected, setTempSelected] = useState<string[]>(selectedIds);

// 	useEffect(() => {
// 		setTempSelected(selectedIds); // Sync with form state when dialog opens
// 	}, [selectedIds, open]);

//     const getSubCategoryIds = (cat: CategoryListRow) => cat.sub_category.map((sc) => sc.id);
//     const getParentCategoryId = (subId: string) => {
//         for (const cat of categories) {
//             if (cat.sub_category.some((sc) => sc.id === subId)) return cat.id;
//         }
//         return null;
//     };

//     // Enhanced handleToggle for parent-child logic
//     const handleToggle = (id: string) => {
//         const isParent = categories.some((cat) => cat.id === id);
//         setTempSelected((prev) => {
//             let next = [...prev];
//             if (isParent) {
//                 const cat = categories.find((c) => c.id === id);
//                 const subIds = getSubCategoryIds(cat as CategoryListRow);
//                 const allSelected = [id, ...subIds].every((x) => next.includes(x));
//                 if (allSelected) {
//                     next = next.filter((x) => x !== id && !subIds.includes(x));
//                 } else {
//                     next = Array.from(new Set([...next, id, ...subIds]));
//                 }
//             } else {
//                 const parentId = getParentCategoryId(id);
//                 const cat = categories.find((c) => c.id === parentId);
//                 const subIds = getSubCategoryIds(cat as CategoryListRow);
//                 const isSelected = next.includes(id);
//                 if (isSelected) {
//                     next = next.filter((x) => x !== id);
//                     const anyOther = subIds.some((sid) => sid !== id && next.includes(sid));
//                     if (!anyOther) next = next.filter((x) => x !== parentId);
//                 } else {
//                     next = Array.from(new Set([...next, id, parentId ?? ""]));
//                 }
//             }
//             return next;
//         });
//     };

//     // Restore handleConfirm for dialog
//     const handleConfirm = () => {
//         onSelect(tempSelected);
//         setOpen(false);
//     };

// 	const goToPrevPage = () => {
// 		if (currentPage > 1) {
// 			setSearchParams((prev) => {
// 				prev.set("cPage", (currentPage - 1).toString());
// 				return prev;
// 			});
// 			navigate(`?${searchParams.toString()}`);
// 		}
// 	};

// 	const goToNextPage = () => {
// 		if (currentPage < pageCount) {
// 			setSearchParams((prev) => {
// 				prev.set("cPage", (currentPage + 1).toString());
// 				return prev;
// 			});
// 			navigate(`?${searchParams.toString()}`);
// 		}
// 	};
// 	console.log("RE RENDERED CATEGORY DIALOG");

// 	return (
// 		<Dialog open={open} onOpenChange={setOpen}>
// 			<DialogContent
// 				className="sm:max-w-[550px]"
// 				showCloseButton={false}
// 				onInteractOutside={(e) => e.preventDefault()}
// 			>
// 				<DialogHeader>
// 					<DialogTitle>Select Categories</DialogTitle>
// 					<DialogDescription>
// 						Choose multiple categories and subcategories for the collection. All the related
// 						products will be automatically added to the collection.
// 					</DialogDescription>
// 				</DialogHeader>
// 				<div className="max-h-96 overflow-y-auto">
// 					{categories.length > 0 ? (
// 						categories.slice(0, pageSize).map((cat, index) => (
// 							<Accordion
// 								className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50"
// 								transition={{ duration: 0.2, ease: "easeInOut" }}
// 								key={cat.id + index}
// 							>
// 								<AccordionItem value="getting-started" className="py-1">
// 									<AccordionTrigger className="w-full text-left">
// 										<div className="flex items-center justify-between">
// 											<div className="hover:underline underline-offset-4">
// 												<Label className="flex items-center px-2 py-2 cursor-pointer">
// 													<Checkbox
// 														checked={tempSelected.includes(cat.id)}
// 														onCheckedChange={() => handleToggle(cat.id)}
// 														className="mr-2"
// 													/>
// 													{cat.category_name}
// 												</Label>
// 											</div>
// 											<ChevronUp className="h-4 w-4transition-transform duration-200 group-data-expanded:-rotate-180" />
// 										</div>
// 									</AccordionTrigger>
// 									<AccordionContent className="px-4">
// 										{cat.sub_category.length > 0 ? (
// 											<div className="border-sidebar-border mx-3 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5">
// 												{cat.sub_category.map((sub) => (
// 													<Label
// 														key={sub.id}
// 														className="flex items-center px-2 py-1 cursor-pointer"
// 													>
// 														<Checkbox
// 															checked={tempSelected.includes(sub.id)}
// 															onCheckedChange={() => handleToggle(sub.id)}
// 															className="mr-2"
// 														/>
// 														<div>
// 															<p className="text-zinc-500 dark:text-zinc-400">
// 																{sub.sub_category_name}
// 															</p>
// 														</div>
// 													</Label>
// 												))}
// 											</div>
// 										) : (
// 											<div>
// 												<p>No subcategories found :)</p>
// 											</div>
// 										)}
// 									</AccordionContent>
// 								</AccordionItem>
// 							</Accordion>
// 						))
// 					) : (
// 						<div className="my-2 p-4 pt-6">
// 							<p className="text-muted-foreground w-fit text-sm mx-auto">No categories found</p>
// 						</div>
// 					)}
// 				</div>

// 				<div className="flex gap-2 justify-between my-4 items-center">
// 					<Button variant="outline" size={"sm"} onClick={goToPrevPage} disabled={currentPage === 1}>
// 						<IconChevronLeft />
// 						<span className="sm:inline hidden mr-2">Previous</span>
// 					</Button>
// 					<div>
// 						<p className="text-sm text-muted-foreground">
// 							Page {currentPage} of {pageCount}
// 						</p>
// 					</div>
// 					<Button
// 						variant="outline"
// 						size={"sm"}
// 						onClick={goToNextPage}
// 						disabled={currentPage === pageCount}
// 					>
// 						<span className="sm:inline hidden ml-2">Next</span>
// 						<IconChevronRight />
// 					</Button>
// 				</div>
// 				<DialogFooter className="space-x-1">
// 					<Button variant="outline" onClick={() => setOpen(false)}>
// 						Cancel
// 					</Button>
// 					<Button onClick={handleConfirm}>Confirm</Button>
// 				</DialogFooter>
// 			</DialogContent>
// 		</Dialog>
// 	);
// }

// interface ProductDialogProps {
// 	open: boolean;
// 	setOpen: (open: boolean) => void;
// 	data: ProductNamesListResponse;
// 	onSelect: (ids: string[]) => void;
// 	selectedIds: string[];
// }

// function ProductDialog({ open, setOpen, data, onSelect, selectedIds }: ProductDialogProps) {
// 	const [tempSelected, setTempSelected] = useState<string[]>(selectedIds);
// 	const [searchParams, setSearchParams] = useSearchParams();
// 	const navigate = useNavigate();
// 	const navigation = useNavigation();
// 	const location = useLocation();

// 	useEffect(() => {
// 		setTempSelected(selectedIds);
// 	}, [selectedIds, open]);

// 	let currentQuery = searchParams.get("prodSearch") || "";
// 	const currentPage = Number(searchParams.get("pPage")) || 1;
// 	const pageSize = 7;
// 	const pageCount = data.total ? Math.ceil(data.total / pageSize) : 1;

// 	const isFetching = useMemo(
// 		() => navigation.state === "loading" && navigation.location?.pathname === location.pathname,
// 		[navigation.state, navigation.location?.pathname, location.pathname]
// 	);

// 	const handleToggle = (id: string) => {
// 		setTempSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
// 	};

// 	const handleConfirm = () => {
// 		onSelect(tempSelected);
// 		setOpen(false);
// 	};

// 	const goToPrevPage = () => {
// 		if (currentPage > 1) {
// 			setSearchParams((prev) => {
// 				prev.set("pPage", (currentPage - 1).toString());
// 				return prev;
// 			});
// 			navigate(`?${searchParams.toString()}`);
// 		}
// 	};

// 	const goToNextPage = () => {
// 		if (currentPage < pageCount) {
// 			setSearchParams((prev) => {
// 				prev.set("pPage", (currentPage + 1).toString());
// 				return prev;
// 			});
// 			navigate(`?${searchParams.toString()}`);
// 		}
// 	};

// 	function handleClearQuery() {
// 		setSearchParams((prev) => {
// 			prev.delete("prodSearch");
// 			return prev;
// 		}, { state: { suppressLoadingBar: true } });
// 	}

// 	const customQuerySubmit = (e: React.FormEvent<HTMLFormElement>) => {
// 		e.preventDefault();
// 		const formData = new FormData(e.currentTarget);
// 		const searchValue = formData.get("prodSearch")?.toString().trim() || "";
// 		if (searchValue) {
// 			setSearchParams((prev) => {
// 				prev.set("prodSearch", searchValue);
// 				prev.set("pPage", "1"); // Reset to first page on new search
// 				return prev;
// 			}, { state: { suppressLoadingBar: true } });
// 		} else {
// 			setSearchParams((prev) => {
// 				prev.delete("prodSearch");
// 				prev.set("pPage", "1"); // Reset to first page on new search
// 				return prev;
// 			}, { state: { suppressLoadingBar: true } });
// 		}
// 	};

// 	const ProductsArea = () => {
// 		if (isFetching) {
// 			return (
// 				<div className="flex gap-3 flex-col">
// 					{Array.from({ length: 1 }, (_, i) => (
// 						<span key={i} className="w-full flex gap-4 px-2 py-2">
// 							<Skeleton className="h-4 w-4 rounded-sm" />
// 							<Skeleton className="h-4 min-w-[250px] rounded-sm" />

// 						</span>
// 					))}
// 				</div>
// 			);
// 		}

// 		return (
// 			<div className="max-h-96 overflow-y-auto">
// 				{data.products && data.products.length > 0 ? (
// 					data.products.map((product) => (
// 						<div className="hover:underline underline-offset-4" key={product.id}>
// 							<Label className="flex items-center px-2 py-2 cursor-pointer">
// 								<Checkbox
// 									checked={tempSelected.includes(product.id)}
// 									onCheckedChange={() => handleToggle(product.id)}
// 									className="mr-2"
// 								/>
// 								{product.name}
// 							</Label>
// 						</div>
// 					))
// 				) : (
// 					<div className="p-4 py-8 flex items-center justify-center">
// 						<p className="text-muted-foreground text-sm">No products found.</p>
// 					</div>
// 				)}
// 			</div>
// 		);
// 	};

// 	return (
// 		<Dialog open={open} onOpenChange={setOpen}>
// 			<DialogContent
// 				className="sm:max-w-[550px]"
// 				showCloseButton={false}
// 				onInteractOutside={(e) => e.preventDefault()}
// 			>
// 				<DialogHeader>
// 					<DialogTitle>Select Products</DialogTitle>
// 					<DialogDescription>Choose products for the collection.</DialogDescription>
// 				</DialogHeader>
// 				<div className="space-y-4">
// 					<RouterForm method="get" action="?" onSubmit={customQuerySubmit}>
// 						<div className="relative">
// 							<Search
// 								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
// 								width={18}
// 							/>
// 							<Input
// 								placeholder="Search products"
// 								name="prodSearch"
// 								className="w-full px-8"
// 								id="search"
// 								defaultValue={currentQuery.trim()}
// 							/>
// 							{currentQuery.trim().length > 0 && (
// 								<span
// 									className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
// 									onClick={handleClearQuery}
// 								>
// 									<X className="text-muted-foreground" width={18} />
// 								</span>
// 							)}
// 						</div>
// 						{/* Invisible submit button: Enter in input triggers submit */}
// 						<button type="submit" className="hidden">
// 							Search
// 						</button>
// 					</RouterForm>
// 					<div className="my-2">
// 						<p className="text-muted-foreground text-sm w-fit ml-auto">
// 							{tempSelected.length} product{tempSelected.length !== 1 ? "s" : ""} selected
// 						</p>
// 					</div>
// 					<ProductsArea />
// 					<div className="flex justify-between items-center mt-6">
// 						<Button
// 							variant="outline"
// 							size="sm"
// 							onClick={goToPrevPage}
// 							disabled={currentPage === 1}
// 						>
// 							<IconChevronLeft />
// 							<span className="sm:inline hidden mr-2">Previous</span>
// 						</Button>
// 						<div>
// 							<p className="text-sm text-muted-foreground">
// 								Page {currentPage} of {pageCount}
// 							</p>
// 						</div>
// 						<Button
// 							variant="outline"
// 							size="sm"
// 							onClick={goToNextPage}
// 							disabled={currentPage === pageCount}
// 						>
// 							<span className="sm:inline hidden ml-2">Next</span>
// 							<IconChevronRight />
// 						</Button>
// 					</div>
// 				</div>
// 				<DialogFooter>
// 					<Button variant="outline" onClick={() => setOpen(false)}>
// 						Cancel
// 					</Button>
// 					<Button onClick={handleConfirm}>Confirm</Button>
// 				</DialogFooter>
// 			</DialogContent>
// 		</Dialog>
// 	);
// }
