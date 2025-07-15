import { Form, Link, LoaderFunctionArgs, useFetcher, useLoaderData, useLocation, useMatches, useNavigate, useSearchParams } from "react-router";
import { Route } from "./+types/products";
import { Button } from "~/components/ui/button";
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpNarrowWide, ListFilter, Loader2, MoreHorizontal, PlusCircle, RotateCcw, Search, Settings2, TriangleAlert } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/Table/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { useEffect, useMemo, useState } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { productsQuery } from "~/queries/products.q";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { defaults, SUPABASE_IMAGE_BUCKET_PATH, productSortTypeEnums } from "~/constants";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import type { HighLevelProduct } from "~/types/products";
import { bolleanToStringConverter, GetFormattedDate } from "~/lib/utils";
import StatusBadge from "~/components/status-badge";
import { Skeleton } from "~/components/ui/skeleton";
import ImageViewer from "~/components/ImageViewer/image-viewer";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { categoriesQuery } from "~/queries/categories.q";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form as ShadcnForm } from "~/components/ui/form";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { CategoryListRow } from "~/types/category";
import DateRangePicker from "~/components/Custom-Inputs/date-range-picker";
import { Checkbox } from "~/components/ui/checkbox";
import { ProductsFilterFormData, ProductFilterFormSchema, ProductFilters } from "~/schemas/products-filter.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { getProductsFiltersPayload } from "~/utils/getProductsFiltersPayload";
import { getActiveProductsFiltersCount } from "~/utils/getActiveProductsFiltersCount";
import { getProductsResetFiltersUrl } from "~/utils/getProductsResetFiltersUrl";
import { useIsMobile } from "~/hooks/use-mobile";
import { ProductStatusUpdateFormValues, ProductStatusUpdateInputSchema } from "~/schemas/product.schema";

const defaultPage = (defaults.DEFAULT_PRODUCTS_PAGE - 1).toString();
const defaultSize = defaults.DEFAULT_PRODUCTS_PAGE_SIZE.toString();

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_PRODUCTS_PAGE,
		defaultPageSize: defaults.DEFAULT_PRODUCTS_PAGE_SIZE,
	});

	const productFilters: ProductFilters = getProductsFiltersPayload({ request });

	const data = await queryClient.fetchQuery(
		productsQuery({
			request,
			q,
			pageIndex,
			pageSize,
			filters: productFilters,
		})
	);

	const categories = await queryClient.fetchQuery(categoriesQuery({ request }));

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
		categories
	};
};

export default function ProductsMainPage({
	loaderData: { data, query, pageIndex, pageSize }
}: Route.ComponentProps) {
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);
	
	const isFetchingThisRoute = useMemo(
		() => navigation.state === "loading" && navigation.location?.pathname === location.pathname,
		[navigation.state, navigation.location?.pathname, location.pathname]
	);
	// console.log(data);

	useEffect(() => {
		if (data.error != null && data.error.message) {
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);
	console.log("Re rendered");
	
	const columns: ColumnDef<HighLevelProduct, unknown>[] = [
		{
			id: "Sr. No.",
			enableHiding: false,
			accessorKey: "id",
			cell: (info: any) => `(${info.row.index + 1})`,
			header: () => "Sr. No.",
		},
		{
			id: "Cover",
			accessorKey: "cover_image",
			cell: (info: any) => {
				const rowImg = info.row.original.cover_image;
				const image = `${SUPABASE_IMAGE_BUCKET_PATH}/${rowImg}`;

				if (rowImg) {
					return (
						<div>
							<ImageViewer
								thumbnailUrl={image}
								imageUrl={image}
								classNameThumbnailViewer="h-20 w-18 rounded-sm object-cover shadow-md"
							/>
						</div>
					)
				} else {
					return (
						<Skeleton className="h-16 w-16 rounded-sm" />
					)
				}
			},
			header: () => "Cover",
		},
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info: any) => {
				return (
					<p className="md:max-w-[35ch] max-w-[20ch] truncate">{info.row.original.name}</p>
				)
			},
			header: () => "Name",
		},
		{
			id: "Category",
			accessorKey: "categoryName",
			cell: (info: any) => info.row.original.categoryName,
			header: () => "Category",
		},
		{
			id: "Sub Category",
			accessorKey: "subCategoryName",
			cell: (info: any) => info.row.original.subCategoryName,
			header: () => "Sub Category",
		},
		{
			id: "No. of Variants",
			accessorKey: "variants_count",
			cell: (info: any) => {
				const len = info.row.original.variants_count;
				const isZeroLen = len === 0;
				return (
					<div className={`${isZeroLen ? "flex gap-2 items-center" : ""}`}>
						<p className={`${isZeroLen ? "text-destructive" : ""}`}>
							{len}
						</p>
						{isZeroLen && <TriangleAlert className="w-4 h-4 text-destructive" />}
					</div>
				);
			},
			header: () => "No. of Variants",
		},
		{
			id: "Featured",
			accessorKey: "is_featured",
			cell: (info: any) => {
				const featured = info.row.original.is_featured;
				return (
					<StatusBadge variant={featured ? "success" : "default"} icon={featured ? "tick" : "cross"}>
						{featured ? "Yes" : "No"}
					</StatusBadge>
				);
			},
			header: () => "Featured",
		},
		{
			id: "Status",
			accessorKey: "status",
			cell: (info: any) => {
				return (
					<StatusBadge variant={info.row.original.status ? "success" : "destructive"} icon="dot">
						{info.row.original.status ? "Active" : "Inactive"}
					</StatusBadge>
				);
			},
			header: () => "Status",
		},
		{
			id: "Shipping",
			accessorKey: "free_shipping",
			cell: (info: any) => {
				return (
					<StatusBadge variant={info.row.original.free_shipping ? "warning" : "default"} icon="dot">
						{info.row.original.free_shipping ? "Free" : "Paid"}
					</StatusBadge>
				);
			},
			header: () => "Shipping",
		},
		{
			id: "Created At",
			accessorKey: "createdAt",
			cell: (info: any) => GetFormattedDate(info.row.original.createdAt),
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: HighLevelProduct = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									navigator.clipboard.writeText(rowData.id);
									toast.success("Product ID copied", {
										description: rowData.id,
									});
								}}
							>
								Copy ID
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<Link to={`${rowData.id}/variants`} viewTransition prefetch="intent">
								<DropdownMenuItem>View Variants</DropdownMenuItem>
							</Link>
							<Link to={`${rowData.id}/variants/create`} viewTransition prefetch="intent">
								<DropdownMenuItem>Create Variant</DropdownMenuItem>
							</Link>
							<DropdownMenuSeparator />
							<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
								<DropdownMenuItem>Update</DropdownMenuItem>
							</Link>
							<UpdateStatusForm product={rowData as HighLevelProduct} />
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const tableColumns = useMemo(() => columns, []);

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: defaults.DEFAULT_PRODUCTS_PAGE
	});

	const table = useReactTable({
		data: (data.products as HighLevelProduct[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount,
		state: {
			pagination: {
				pageIndex,
				pageSize,
			}
		}
	});

	return (
		<>
			<MetaDetails
				metaTitle={`Products ${query.trim() ? `| "${query.trim()}"` : ""} | Admin Panel`}
				metaDescription="Manage your products here."
				metaKeywords="Products"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Products</h1>
						<Link to="create" viewTransition className="ml-auto">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Create Product</span>
							</Button>
						</Link>
					</div>
					{query && (
						<div className="mt-3">
							<p>Showing records for "{query?.trim()}"</p>
						</div>
					)}
				</div>
				<div className="rounded-md flex flex-col gap-4">
					<DataTableViewOptions table={table} disabled={isFetchingThisRoute} />
					{isFetchingThisRoute ? (
						<DataTableSkeleton noOfSkeletons={4} columns={tableColumns} />
					) : (
						<DataTable
							table={table}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
							pageSize={pageSize}
							total={data.total ?? 0}
						/>
					)}
				</div>
			</section>
		</>
	);
}

function UpdateStatusForm({ product }: { product: HighLevelProduct }) {
	const defaultValues = {
		status: bolleanToStringConverter(product?.status) as "true" | "false",
		is_featured: bolleanToStringConverter(product?.is_featured) as "true" | "false",
	};

	const { control, reset } = useForm<ProductStatusUpdateFormValues>({
		resolver: zodResolver(ProductStatusUpdateInputSchema),
		defaultValues,
	});

	
	// Watch form values to trigger submission on change
	const status = useWatch({ control, name: "status" });
	const isFeatured = useWatch({ control, name: "is_featured" });

	const [submittingField, setSubmittingField] = useState<string | null>(null);

	const isStatusSubmitting = submittingField === "status";
	const isFeaturedSubmitting = submittingField === "is_featured";
	
	const fetcher = useFetcher();
	
	// Handle fetcher state for toasts and state updates
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Status updated successfully");
				const newStatus =
					fetcher.data.status !== undefined
						? bolleanToStringConverter(fetcher.data.status)
						: (status as "true" | "false");
				const newFeatured =
					fetcher.data.is_featured !== undefined
						? bolleanToStringConverter(fetcher.data.is_featured)
						: isFeatured;
				reset({
					status: newStatus as "true" | "false",
					is_featured: newFeatured as "true" | "false",
				});
				setSubmittingField(null);
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
				setSubmittingField(null);
			} else {
				toast.error("Something went wrong");
				setSubmittingField(null);
			}
		}
	}, [fetcher.data, reset, status, isFeatured]);

	// Trigger submission when status or is_featured changes
	useEffect(() => {
		const initialStatus = bolleanToStringConverter(product?.status) as "true" | "false";
		const initialFeatured = bolleanToStringConverter(product?.is_featured) as "true" | "false";
		const currentStatus = status !== initialStatus;
		const currentFeatured = isFeatured !== initialFeatured;

		if (currentStatus || currentFeatured) {
			const formData = new FormData();
			let changedField: string | null = null;

			if (currentStatus && status !== undefined) {
				formData.append("status", status);
				changedField = "status";
			}
			if (currentFeatured && isFeatured !== undefined) {
				formData.append("is_featured", isFeatured);
				changedField = "is_featured";
			}

			if (changedField) {
				setSubmittingField(changedField); // Set the submitting field
				fetcher.submit(formData, { method: "post", action: `${product.id}/update` });
			}
		}
	}, [status, isFeatured, product]);

	const fields = useMemo(
		() => [
			{ label: "Active", value: "true", id: Math.floor(Math.random() * 99999).toString() },
			{ label: "Inactive", value: "false", id: Math.floor(Math.random() * 99999).toString() },
		],
		[]
	);
	
	return (
		<>
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
				<DropdownMenuPortal>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup value={status}>
							<Controller
								name="status"
								control={control}
								render={({ field }) => (
									<>
										{fields.map((item) => (
											<DropdownMenuRadioItem
												key={item.id}
												value={item.value} // Radio items use value for selection
												onSelect={(e) => {
													e.preventDefault(); // Prevent default close
													field.onChange(item.value); // Update form state with string value
												}}
												className={`cursor-pointer ${
													isStatusSubmitting && "text-muted-foreground"
												}`}
												disabled={isStatusSubmitting}
											>
												{item.label}
												{isStatusSubmitting && item.value === status && (
													<Loader2 className="animate-spin ml-auto" />
												)}
											</DropdownMenuRadioItem>
										))}
									</>
								)}
							/>
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>

			{/* Featured Status Menu */}
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>Set Featured Status</DropdownMenuSubTrigger>
				<DropdownMenuPortal>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup value={isFeatured}>
							<Controller
								name="is_featured"
								control={control}
								render={({ field }) => (
									<>
										{fields.map((item) => (
											<DropdownMenuRadioItem
												key={item.id}
												value={item.value} // Radio items use value for selection
												onSelect={(e) => {
													e.preventDefault(); // Prevent default close
													field.onChange(item.value); // Update form state with string value
												}}
												className={`cursor-pointer ${
													isFeaturedSubmitting && "text-muted-foreground"
												}`}
												disabled={isFeaturedSubmitting}
											>
												{item.label}
												{isFeaturedSubmitting && item.value === isFeatured && (
													<Loader2 className="animate-spin ml-auto" />
												)}
											</DropdownMenuRadioItem>
										))}
									</>
								)}
							/>
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		</>
	);
}

function SortSelector() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type sortFormData = Pick<ProductsFilterFormData, "sortBy" | "sortType">;

	const form = useForm<sortFormData>({
		resolver: zodResolver(ProductFilterFormSchema),
		defaultValues: {
			sortBy:
				(searchParams.get("sortBy") as sortFormData["sortBy"]) ||
				defaults.defaultProductSortByFilter,
			sortType:
				(searchParams.get("sortType") as sortFormData["sortType"]) ||
				defaults.defaultProductSortTypeFilter,
		},
	});

	const { handleSubmit, control } = form;

	const onSortSubmit = (values: sortFormData) => {
		const currentParams = new URLSearchParams(location.search);

		// Remove old sort params if they exist
		currentParams.delete("sortBy");
		currentParams.delete("sortType");

		// Add new sort params
		if (values.sortBy) currentParams.set("sortBy", values.sortBy);
		if (values.sortType) currentParams.set("sortType", values.sortType);

		navigate(`?${currentParams.toString()}`);
	};

	return (
		<form onSubmit={handleSubmit(onSortSubmit)} className="space-y-4 flex flex-col p-4 h-full">
			<ShadcnForm {...form}>
				{/* Sort by Filter */}
				<FormField
					control={control}
					name="sortBy"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Sort By</FormLabel>
							<FormControl>
								<div className="*:w-full">
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="Select field" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="createdAt">Date Created</SelectItem>
											<SelectItem value="name">Name</SelectItem>
											<SelectItem value="status">Status</SelectItem>
											<SelectItem value="is_featured">Featured</SelectItem>
											<SelectItem value="free_shipping">Free Shipping</SelectItem>
											<SelectItem value="id">ID</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Sort Type Filter */}
				<FormField
					control={control}
					name="sortType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Sort Direction</FormLabel>
							<FormControl>
								<div className="*:w-full">
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="asc / desc" />
										</SelectTrigger>
										<SelectContent>
											{productSortTypeEnums.map((sortType) => (
												<SelectItem key={sortType} value={sortType}>
													{sortType === "asc" ? (
														<>
															<span>Ascending</span>
															<ArrowUpNarrowWide />
														</>
													) : (
														<>
															<span>Descending</span>
															<ArrowDownWideNarrow />
														</>
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={isSubmitting} size={"sm"}>
					{isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
					Apply
				</Button>
			</ShadcnForm>
		</form>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelProduct>) {
	const navigate = useNavigate();
	const location = useLocation();
	const isMobile = useIsMobile({ customBreakpoint: 400 });

	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("q") ?? "";

	const activeFiltersCount = getActiveProductsFiltersCount(searchParams);
	const [filtersMenuOpen, setFiltersMenuOpen] = useState<boolean>(false);

	function handleFiltersClick() {
		return setFiltersMenuOpen(!filtersMenuOpen);
	}

	function handleResetFilters() {
		navigate(getProductsResetFiltersUrl({
			defaultPage,
			defaultSize,
			pathname: location.pathname,
			search: location.search
		}), { replace: true });
	}

    return (
		<>
			<div className="w-full flex justify-between gap-4">
				<div className="flex gap-2 items-center">
					<Form method="get" action="/products">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search products"
								name="q"
								className="w-full pl-8"
								id="search"
								defaultValue={currentQuery.trim()}
								disabled={disabled}
							/>
						</div>
						{/* Invisible submit button: Enter in input triggers submit */}
						<Button type="submit" className="hidden">
							Search
						</Button>
					</Form>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
								disabled={disabled}
							>
								<ArrowUpDown />
								<span className="hidden md:inline">Sort</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align={isMobile ? "center" : "start"} className="w-fit">
							<DropdownMenuLabel>Sort Products</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{/* Sorting Select! */}
							<SortSelector />
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex gap-2 items-center">
					<div className="sm:inline hidden">
						<Button
							variant="outline"
							className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
							disabled={disabled}
							onClick={handleResetFilters}
						>
							<RotateCcw />
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Button
								variant="outline"
								size="sm"
								className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
								disabled={disabled}
								onClick={handleFiltersClick}
							>
								<ListFilter />
								<span className="hidden md:inline">Filters</span>
							</Button>
							<span className="filters-count">
								{activeFiltersCount > 0 ? activeFiltersCount : ""}
							</span>
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
								disabled={disabled}
							>
								<Settings2 />
								<span className="hidden md:inline">Columns</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[150px]">
							<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{table
								.getAllColumns()
								.filter(
									(column: any) =>
										typeof column.accessorFn !== "undefined" && column.getCanHide()
								)
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
				</div>
			</div>
			<FiltersSheet open={filtersMenuOpen} setOpen={handleFiltersClick} />
		</>
	);
}

function FiltersSheet({ open, setOpen }: { open?: boolean; setOpen: (open: boolean) => void }) {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const currentQuery = searchParams.get("q") || undefined;

	const currentPageIndex = searchParams.get("page") || defaultPage;
	const currentPageSize = searchParams.get("size") || defaultSize;
	
	const loaderData = useLoaderData<typeof loader>();
	
	const categories: CategoryListRow[] = loaderData.categories.categories as CategoryListRow[];
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type BoolVals = "true" | "false" | "null";
	const createdFromParam = searchParams.get("createdFrom");
	const createdToParam = searchParams.get("createdTo");

	const form = useForm<ProductsFilterFormData>({
		resolver: zodResolver(ProductFilterFormSchema),
		defaultValues: {
			q: currentQuery,
			page: currentPageIndex,
			size: currentPageSize,
			status: (searchParams.get("status") as BoolVals) || "null",
			is_featured: (searchParams.get("is_featured") as BoolVals) || "null",
			category: searchParams.get("category")?.split(",") ?? [],
			sub_category: searchParams.get("sub_category")?.split(",") ?? [],
			free_shipping: (searchParams.get("free_shipping") as BoolVals) || "null",
			createdAt:
				createdFromParam && createdToParam
					? {
							from: new Date(createdFromParam),
							to: new Date(createdToParam),
					}
					: null
		},
	});

	const { handleSubmit, control, setValue, reset } = form;

	const selectedCategories = useWatch({ control, name: "category" }) || [];
	const selectedSubCategories = useWatch({ control, name: "sub_category" }) || [];

	const validSubCategoryIds = useMemo(() => {
		return categories
			.filter((cat) => selectedCategories.includes(cat.id))
			.flatMap((cat) => cat.sub_category.map((sc) => sc.id));
	}, [categories, selectedCategories]);

	useEffect(() => {
		const filtered = selectedSubCategories.filter((id) => validSubCategoryIds.includes(id));
		if (
			filtered.length !== selectedSubCategories.length ||
			filtered.some((id, i) => id !== selectedSubCategories[i])
		) {
			setValue("sub_category", filtered);
		}
	}, [selectedSubCategories, validSubCategoryIds, setValue]);

	// Handle form submission
	const onFormSubmit = (values: ProductsFilterFormData) => {
		console.log(values);
		// return;
		const params = new URLSearchParams();

		// Append only explicitly set or changed values

		if (values.q) params.set("q", values.q);
		if (values.status && values.status !== "null") params.set("status", values.status);
		if (values.is_featured && values.is_featured !== "null"){
			params.set("is_featured", values.is_featured);
		}
		if (values.category && Array.isArray(values.category) && values.category.length > 0){
			params.set("category", values.category!.join(","));
		}
		if (values.sub_category && Array.isArray(values.sub_category) && values.sub_category!.length > 0) {
			params.set("sub_category", values.sub_category!.join(","));
		}
		if (values.free_shipping && values.free_shipping !== "null")
			params.set("free_shipping", values.free_shipping);

		if (values.createdAt) {
			params.set("createdFrom", values.createdAt.from.toISOString());
			params.set("createdTo", values.createdAt.to.toISOString());
		} else {
			params.delete("createdFrom");
			params.delete("createdTo");
		}

		if (values.sortBy) params.set("sortBy", values.sortBy);
		if (values.sortType) params.set("sortType", values.sortType);

		// Only append pageIndex and pageSize if they differ from current values or are explicitly set
		if (currentPageIndex !== defaultPage) {
			params.set("page", String(currentPageIndex));
		}
		if (currentPageSize !== defaultSize) {
			params.set("size", String(currentPageSize));
		}
		
		// preserve kro unko agr pehly se apply keye hoe hain
		const sortBy = searchParams.get("sortBy");
		const sortType = searchParams.get("sortType");
		if (sortBy) params.set("sortBy", sortBy);
		if (sortType) params.set("sortType", sortType);

		navigate(`?${params.toString()}`);
	};

	function handleReset() {
		reset(); // Resets the form state
		navigate(getProductsResetFiltersUrl({
			defaultPage,
			defaultSize,
			pathname: location.pathname,
			search: location.search
		}), { replace: true });
		setOpen(false);
	}

	return (
		<Sheet open={!!open} onOpenChange={setOpen}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Product Filters & Sort</SheetTitle>
					<SheetDescription>Sort and filter products by their fields and values</SheetDescription>
				</SheetHeader>
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 flex flex-col p-4 h-full">
					<ShadcnForm {...form}>
						<div className="flex justify-between gap-2 items-center">
							<h2 className="text-xl mt-0 font-bold">Filter</h2>
							<Button variant="link" onClick={handleReset}>
								Reset All
							</Button>
						</div>
						{/* Status Filter */}
						<FormField
							control={control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<FormControl>
										<div className="*:w-full">
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="null">Select status</SelectItem>
													<SelectItem value="true">Active</SelectItem>
													<SelectItem value="false">Inactive</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Featured Filter */}
						<FormField
							control={control}
							name="is_featured"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Featured</FormLabel>
									<FormControl>
										<div className="*:w-full">
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Select featured status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="null">
														Select featured status
													</SelectItem>
													<SelectItem value="true">Active</SelectItem>
													<SelectItem value="false">Inactive</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Category Tree */}
						<FormItem>
							<FormLabel>Categories</FormLabel>
							<FormControl className="mt-1">
								<div className="max-h-64 overflow-y-auto space-y-2">
									{categories.map((cat) => {
										const subIds = cat.sub_category.map((sc) => sc.id);
										const childChecked = subIds.map((id) =>
											selectedSubCategories.includes(id)
										);
										const allChecked = childChecked.every(Boolean);
										const noneChecked = childChecked.every((c) => !c);
										const indeterminate = !allChecked && !noneChecked;

										return (
											<details
												key={cat.id}
												className="rounded"
												open={allChecked || indeterminate}
											>
												<summary className="flex items-center gap-2 cursor-pointer list-none">
													<Checkbox
														id={`cat-${cat.id}`}
														checked={
															allChecked
																? true
																: indeterminate
																? "indeterminate"
																: false
														}
														onCheckedChange={(checked) => {
															const newSubs = new Set(selectedSubCategories);
															subIds.forEach((id) =>
																checked ? newSubs.add(id) : newSubs.delete(id)
															);

															const newCats = new Set(selectedCategories);
															checked
																? newCats.add(cat.id)
																: newCats.delete(cat.id);

															setValue("sub_category", Array.from(newSubs));
															setValue("category", Array.from(newCats));
														}}
													/>
													<Label htmlFor={`cat-${cat.id}`} className="font-medium text-sm cursor-pointer">
														{cat.category_name}
													</Label>
												</summary>

												<div className="pl-6 mt-2 space-y-1">
													{cat.sub_category.map((sub) => (
														<div key={sub.id} className="flex items-center gap-2">
															<Checkbox
																id={`subcat-${sub.id}`}
																checked={selectedSubCategories.includes(
																	sub.id
																)}
																onCheckedChange={(checked) => {
																	const newSubs = new Set(
																		selectedSubCategories
																	);
																	checked
																		? newSubs.add(sub.id)
																		: newSubs.delete(sub.id);

																	// if any child remains, keep parent checked
																	const newCats = new Set(
																		selectedCategories
																	);
																	const stillAny = subIds.some((id) =>
																		newSubs.has(id)
																	);
																	stillAny
																		? newCats.add(cat.id)
																		: newCats.delete(cat.id);

																	setValue(
																		"sub_category",
																		Array.from(newSubs)
																	);
																	setValue("category", Array.from(newCats));
																}}
															/>
															<Label htmlFor={`subcat-${sub.id}`} className="font-medium text-sm cursor-pointer">
																{sub.sub_category_name}
															</Label>
														</div>
													))}
												</div>
											</details>
										);
									})}
								</div>
							</FormControl>
						</FormItem>

						{/* Free Shipping Filter */}
						<FormField
							control={control}
							name="free_shipping"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Free Shipping</FormLabel>
									<FormControl>
										<div className="*:w-full">
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Select free shipping" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="null">Select free shipping</SelectItem>
													<SelectItem value="true">Available</SelectItem>
													<SelectItem value="false">Not Available</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Date Created Filter */}
						<Controller
							control={control}
							name="createdAt"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date Created</FormLabel>
									<FormControl>
										<DateRangePicker
											className="w-full"
											value={field.value ?? null}
											onDateRangeChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Form Actions */}
						<SheetFooter className="!self-end px-0 w-full">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
								Apply
							</Button>
							<SheetClose asChild>
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</ShadcnForm>
				</form>
			</SheetContent>
		</Sheet>
	);
}