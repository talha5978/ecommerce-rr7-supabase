import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
	ActionFunctionArgs,
	Await,
	LoaderFunctionArgs,
	useActionData,
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
import { Loader2, PlusCircle, RefreshCcw, Trash2 } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
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
import type { Route } from "./+types/update-collection";
import ImageInput from "~/components/Custom-Inputs/image-input";
import {
	CollectionUpdateActionData,
	CollectionUpdateActionDataSchema,
	CollectionUpdateFormValues,
	CollectionUpdateInputSchema,
} from "~/schemas/collections.schema";
import { DataTable } from "~/components/Table/data-table";
import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { CollectionDataItemsResponse, SelectedProduct } from "~/types/collections";
import { Checkbox } from "~/components/ui/checkbox";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { collectionDataItemsQuery, FullCollectionQuery } from "~/queries/collections.q";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { bolleanToStringConverter } from "~/lib/utils";
import { CollectionsService } from "~/services/collections.service";
import {
	getSanitizedMetaDetailsForAction,
	getSanitizedMetaDetailsForForm,
} from "~/utils/getSanitizedMetaDetails";
import {
	CATEGORY_PAGE_TAG,
	PRODUCT_PAGE_TAG,
	PRODUCT_SEARCH_TAG,
	ProductSelectionDialog,
} from "~/components/Collections/ProductSelectionDialog";

function getSimpleFields() {
	return ["name", "description", "status", "sort_order"] as const;
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const collectionId = (params.collectionId as string) || "";
	if (!collectionId || collectionId == "") {
		throw new Response("Collection ID is required", { status: 400 });
	}

	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const data: Partial<CollectionUpdateActionData> = {};

	const simpleFields = getSimpleFields();

	for (const field of simpleFields) {
		if (formData.has(field)) {
			data[field] = formData.get(field) as string;
		}
	}

	if (formData.has("image") && formData.has("removed_image")) {
		data.image = formData.get("image") as File;
		data.removed_image = formData.get("removed_image") as string;
	}

	// Parse meta_details fields
	getSanitizedMetaDetailsForAction({ formData, data });

	if (formData.has("added_product_ids")) {
		data.added_product_ids = formData.getAll("added_product_ids").map((value) => String(value));
	}

	// Extract attributes that are removed (array of strings)
	if (formData.has("removed_product_ids")) {
		data.removed_product_ids = formData.getAll("removed_product_ids").map((value) => String(value));
	}

	const parseResult = CollectionUpdateActionDataSchema.safeParse(data);
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
		await collectionSvc.updateCollection(collectionId, parseResult.data);
		await queryClient.invalidateQueries({ queryKey: ["highLvlCollections"] });
		await queryClient.invalidateQueries({ queryKey: ["fullCollection", collectionId] });
		await queryClient.invalidateQueries({ queryKey: ["collectionNames"] });

		return { success: true };
	} catch (error: any) {
		// console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to Update collection";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const collection_id = params.collectionId;

	if (!collection_id) {
		throw new ApiError("Collection id not found", 400, []);
	}

	const { searchParams } = new URL(request.url);
	const categoryPageParam = Number(searchParams.get(CATEGORY_PAGE_TAG));
	const productPageParam = Number(searchParams.get(PRODUCT_PAGE_TAG));
	const productSearchQuery = searchParams.get(PRODUCT_SEARCH_TAG) || "";

	// console.log(Math.max(0, categoryPageParam - 1), Math.max(0, productPageParam - 1));
	const collectionResp = await queryClient.fetchQuery(FullCollectionQuery({ request, collection_id }));

	const collectionsDataItems = queryClient.fetchQuery(
		collectionDataItemsQuery({
			request,
			...(productSearchQuery && { q: productSearchQuery }),
			categoryPageIndex: categoryPageParam ? Math.max(0, categoryPageParam - 1) : 0,
			productPageIndex: productPageParam ? Math.max(0, productPageParam - 1) : 0,
		}),
	);

	return { collectionResp, collectionsDataItems };
};

export default function UpdateCollectionPage({
	loaderData: {
		collectionResp: { collection, error: collectionError },
		collectionsDataItems,
	},
	params,
}: Route.ComponentProps) {
	const navigate = useNavigate();
	const submit = useSubmit();
	const navigation = useNavigation();
	const paramsCollectionId = params.collectionId;

	useEffect(() => {
		if (collectionError) {
			toast.error(collectionError?.message || "Unknown error");
			navigate(`/collections`);
		}
	}, [collection, collectionError]);

	const actionData: ActionResponse = useActionData();

	const form = useForm<CollectionUpdateFormValues>({
		resolver: zodResolver(CollectionUpdateInputSchema),
		mode: "onSubmit",
		defaultValues: {
			name: collection?.name || "",
			description: collection?.description || "",
			image: collection?.image_url || undefined,
			status:
				collection?.status != null
					? (bolleanToStringConverter(collection?.status) as "true" | "false")
					: "true",
			meta_details: {
				meta_title: collection?.meta_details?.meta_title || "",
				meta_description: collection?.meta_details?.meta_description || "",
				url_key: collection?.meta_details?.url_key || "",
				meta_keywords:
					collection?.meta_details?.meta_keywords == ""
						? []
						: collection?.meta_details?.meta_keywords?.split(",") || [],
			},
			sort_order: collection?.sort_order?.toString() || "1",
			selections: collection?.products || [],
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
				toast.success("Collection updated successfully");
				navigate(`/collections`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof CollectionUpdateFormValues, { message: errors[0] });
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

	async function onFormSubmit(values: CollectionUpdateFormValues) {
		// toast.info("Creating collection...");
		console.log("Form values: ", values);

		if (!collection || collection == null) {
			toast.error("Error updating collection. Please try again after some time.");
			return;
		}

		if (values.selections.length === 0) {
			toast.error("Please select at least one product.");
			return;
		}

		if (!values.image) {
			toast.error("Please upload an image.");
			return;
		}

		const simpleFields = getSimpleFields();
		let hasChanges = false;

		const normalizedValues = {
			name: values.name.trim(),
			description: values.description.trim(),
			image: values.image,
			status: values.status ?? "true",
			sort_order: values.sort_order?.toString() || "1",
			meta_details: {
				meta_title: values.meta_details.meta_title.trim(),
				meta_description: values.meta_details.meta_description.trim(),
				url_key: values.meta_details.url_key.trim().toLowerCase(),
				meta_keywords: Array.isArray(values.meta_details.meta_keywords)
					? values.meta_details.meta_keywords.map((kw) => kw.trim()).filter(Boolean)
					: [],
			},
			selected_products: values.selections.map((product) => product.id),
		};

		const formData = new FormData();

		for (const field of simpleFields) {
			if (normalizedValues[field] !== String(collection[field])) {
				formData.set(field, normalizedValues[field]);
				hasChanges = true;
			}
		}

		// Separate image check..
		if (normalizedValues.image && typeof normalizedValues.image !== "string") {
			formData.set("image", normalizedValues.image as File);
			formData.set("removed_image", collection.image_url as string);
			hasChanges = true;
		}

		const { hasChanges: hasMetaChanges } = getSanitizedMetaDetailsForForm({
			formData,
			normalizedValues,
			entity: collection,
			hasChanges,
		});

		hasChanges = hasChanges || hasMetaChanges;

		// Handle new product IDs
		const existingProductIds = new Set(collection.products.map((p: { id: string }) => p.id));
		const newProductIds = normalizedValues.selected_products.filter(
			(productId) => !existingProductIds.has(productId),
		);

		if (newProductIds.length > 0) {
			newProductIds.map((id) => formData.append("added_product_ids", id));
			hasChanges = true;
		}

		// Handle removed product IDs
		const removedProductIds: string[] = [];
		existingProductIds.forEach((productId) => {
			if (!normalizedValues.selected_products.includes(productId)) {
				removedProductIds.push(productId);
			}
		});

		if (removedProductIds.length > 0) {
			removedProductIds.map((id) => formData.append("removed_product_ids", id));
			hasChanges = true;
		}

		if (!hasChanges) {
			toast.info("No changes to save");
			return;
		}

		toast.info("Updating collection...");

		submit(formData, {
			method: "POST",
			action: `/collections/${collection.id ?? paramsCollectionId}/update`,
			encType: "multipart/form-data",
		});
	}

	return (
		<>
			<MetaDetails
				metaTitle="Update Collection | Admin Panel"
				metaDescription="Update new collection"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/collections" />
					<h1 className="text-2xl font-semibold">Update Collection</h1>
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
											className="space-x-1 text-destructive/70"
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
								<span>Update</span>
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
