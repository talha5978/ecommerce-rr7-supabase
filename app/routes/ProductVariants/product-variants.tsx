import {
	Form,
	Link,
	LoaderFunctionArgs,
	useFetcher,
	useLocation,
	useNavigate,
	useSearchParams,
} from "react-router";
import { Route } from "./+types/product-variants";
import { Button } from "~/components/ui/button";
import {
	ArrowDownWideNarrow,
	ArrowUpDown,
	ArrowUpNarrowWide,
	DollarSign,
	ListFilter,
	Loader2,
	MoreHorizontal,
	PlusCircle,
	RotateCcw,
	Search,
	Settings2,
} from "lucide-react";
import {
	DataTable,
	DataTableSkeleton,
	DataTableViewOptionsProps,
	TableColumnsToggle,
} from "~/components/Table/data-table";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { defaults, filterOps, sortTypeEnums, SUPABASE_IMAGE_BUCKET_PATH } from "~/constants";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { productVariantsQuery } from "~/queries/product-variants.q";
import type { ProductVariantRow } from "~/types/product-variants";
import StatusBadge from "~/components/status-badge";
import { Skeleton } from "~/components/ui/skeleton";
import ImageViewer from "~/components/ImageViewer/image-viewer";
import { bolleanToStringConverter, GetFormattedDate } from "~/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import CopyField from "~/components/Table/TableId";
import handleDuplicateClick from "~/utils/handleDuplicateProrductVaraint";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import {
	Form as ShadcnForm,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import DateRangePicker from "~/components/Custom-Inputs/date-range-picker";
import {
	defaultOp,
	ProductVaraintsFilterFormData,
	ProductVariantsFilterFormSchema,
	ProductVariantsFilters,
} from "~/schemas/product-variants-filter.schema";
import { getProductVariantsFiltersPayload } from "~/utils/getProductVariantsFiltersPayload";
import { Slider } from "~/components/ui/slider";
import { FilterOp } from "~/constants";
import { getActiveVaraintsFiltersCount } from "~/utils/getActiveVaraintsFiltersCount";
import { getVariantsResetFiltersUrl } from "~/utils/getVariantsResetFiltersUrl";
import { useIsMobile } from "~/hooks/use-mobile";
import {
	VariantStatusUpdateFormValues,
	VariantStatusUpdateInputSchema,
} from "~/schemas/product-variants.schema";

const defaultPage = (defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE - 1).toString();
const defaultSize = defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE.toString();

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const productId = (params.productId as string) || "";
	if (!productId || productId == "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	const filters: ProductVariantsFilters = getProductVariantsFiltersPayload({ request });

	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE,
		defaultPageSize: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(
		productVariantsQuery({
			request,
			productId,
			q,
			pageIndex,
			pageSize,
			filters,
		}),
	);

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
	};
};

export default function ProductVariantsPage({
	loaderData: { data, query, pageIndex, pageSize },
}: Route.ComponentProps) {
	if (data.product_variants == null) {
		throw new Response("Error fetching variants", { status: 404 });
	}
	// console.log(data);

	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	console.log("Rer red");

	const columns: ColumnDef<ProductVariantRow, unknown>[] = [
		{
			id: "Sr. No.",
			enableHiding: false,
			accessorKey: "id",
			cell: (info: any) => `(${info.row.index + 1})`,
			header: () => "Sr. No.",
		},
		{
			id: "Image",
			accessorKey: "images",
			cell: (info: any) => {
				const rowImg = info.row.original.images[0];
				const image = `${SUPABASE_IMAGE_BUCKET_PATH}/${rowImg}`;

				if (rowImg) {
					return (
						<div>
							<ImageViewer
								imageUrl={image}
								classNameThumbnailViewer="h-20 w-18 rounded-sm object-cover shadow-md"
							/>
						</div>
					);
				} else {
					return <Skeleton className="h-20 w-18 rounded-sm" />;
				}
			},
			header: () => "Image",
		},
		{
			id: "SKU",
			enableHiding: false,
			accessorKey: "sku",
			cell: (info: any) => <CopyField id={info.row.original.sku} message="SKU copied" />,
			header: () => "SKU",
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
			id: "Original Price",
			accessorKey: "sale_price",
			cell: (info: any) => info.row.original.original_price,
			header: () => "Original Price",
		},
		{
			id: "Sale Price",
			accessorKey: "sale_price",
			cell: (info: any) => info.row.original.sale_price,
			header: () => "Sale Price",
		},
		{
			id: "Stock",
			accessorKey: "stock",
			cell: (info: any) => info.row.original.stock,
			header: () => "Stock",
		},
		{
			id: "Re-order Level",
			accessorKey: "reorder_level",
			cell: (info: any) => info.row.original.reorder_level,
			header: () => "Re-order Level",
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
				const rowData: ProductVariantRow = row.original;

				return (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DuplicateVariantItem variant={rowData as ProductVariantRow} />
								<Link to={`${rowData.id}/update`}>
									<DropdownMenuItem>Update</DropdownMenuItem>
								</Link>
								<UpdateStatusForm product_variant={rowData as ProductVariantRow} />
								<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
	];

	const tableColumns = useMemo(() => columns, []);

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE,
	});

	const table = useReactTable({
		data: (data.product_variants as ProductVariantRow[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount,
		state: {
			pagination: {
				pageIndex,
				pageSize,
			},
		},
	});

	return (
		<>
			<MetaDetails
				metaTitle="Product Variants | Admin Panel"
				metaDescription="Manage your product variants here."
			/>
			<div className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<div className="flex gap-4 items-center">
							<BackButton href={"/products"} />
							<h1 className="text-2xl font-semibold">Variants</h1>
						</div>
						<Link to="create" viewTransition className="ml-auto">
							<Button size={"sm"} className="ml-auto">
								<PlusCircle width={18} />
								<span>Add Variant</span>
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
			</div>
		</>
	);
}

function UpdateStatusForm({ product_variant }: { product_variant: ProductVariantRow }) {
	const { control, reset } = useForm<VariantStatusUpdateFormValues>({
		resolver: zodResolver(VariantStatusUpdateInputSchema),
		defaultValues: {
			status: bolleanToStringConverter(product_variant?.status) as "true" | "false",
		},
	});

	// Watch form values to trigger submission on change
	const status = useWatch({ control, name: "status" });

	const [isSubmitting, setSubmitting] = useState<boolean>(false);

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
				reset({
					status: newStatus as "true" | "false",
				});
				setSubmitting(false);
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
				setSubmitting(false);
			} else {
				toast.error("Something went wrong");
				setSubmitting(false);
			}
		}
	}, [fetcher.data, reset, status]);

	// Trigger submission when status or is_featured changes
	useEffect(() => {
		const initialStatus = bolleanToStringConverter(product_variant?.status) as "true" | "false";
		const currentStatus = status !== initialStatus;

		if (currentStatus && status != undefined) {
			const formData = new FormData();
			formData.append("status", status);
			setSubmitting(true); // Set the submitting field
			fetcher.submit(formData, { method: "post", action: `${product_variant.id}/update` });
		}
	}, [status, product_variant]);

	const fields = useMemo(
		() => [
			{ label: "Active", value: "true", id: Math.floor(Math.random() * 99999).toString() },
			{ label: "Inactive", value: "false", id: Math.floor(Math.random() * 99999).toString() },
		],
		[],
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
													isSubmitting && "text-muted-foreground"
												}`}
												disabled={isSubmitting}
											>
												{item.label}
												{isSubmitting && item.value === status && (
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

function DuplicateVariantItem({ variant }: { variant: ProductVariantRow }) {
	const fetcher = useFetcher();

	// Handle fetcher state for toasts and query invalidation
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Variant Duplicated successfully");
				toast.warning(
					"Variant is using the same images as the original variant, please change the images.",
				);
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			} else {
				toast.error("Something went wrong");
			}
		}
	}, [fetcher.data, queryClient]);

	return (
		<DropdownMenuItem
			disabled={fetcher.state === "submitting"}
			onClick={() => handleDuplicateClick({ fetcher, input: variant })}
		>
			{fetcher.state === "submitting" ? <Loader2 className="animate-spin" color="white" /> : null}
			Duplicate
		</DropdownMenuItem>
	);
}

function SortSelector() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type sortFormData = Pick<ProductVaraintsFilterFormData, "sortBy" | "sortType">;

	const form = useForm<sortFormData>({
		resolver: zodResolver(ProductVariantsFilterFormSchema),
		defaultValues: {
			sortBy:
				(searchParams.get("sortBy") as sortFormData["sortBy"]) ||
				defaults.defaultProductVaraintsSortByFilter,
			sortType:
				(searchParams.get("sortType") as sortFormData["sortType"]) ||
				defaults.defaultProductVaraintsSortTypeFilter,
		},
	});

	const { handleSubmit, control } = form;

	// Handle form submission
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
											<SelectItem value="sale_price">Sale Price</SelectItem>
											<SelectItem value="original_price">Original Price</SelectItem>
											<SelectItem value="weight">Weight</SelectItem>
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
											{sortTypeEnums.map((sortType) => (
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<ProductVariantRow>) {
	const navigate = useNavigate();
	const location = useLocation();
	const isMobile = useIsMobile({ customBreakpoint: 400 });

	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	const activeFiltersCount = getActiveVaraintsFiltersCount(searchParams);
	const [filtersMenuOpen, setFiltersMenuOpen] = useState<boolean>(false);

	function handleFiltersClick() {
		return setFiltersMenuOpen(!filtersMenuOpen);
	}

	function handleResetFilters() {
		navigate(
			getVariantsResetFiltersUrl({
				defaultPage,
				defaultSize,
				pathname: location.pathname,
				search: location.search,
			}),
			{ replace: true },
		);
	}

	return (
		<>
			<div className="w-full flex justify-between gap-4 items-center">
				<div className="flex gap-2 items-center">
					<Form method="get">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search SKU"
								name="q"
								className="w-full pl-8"
								id="search"
								defaultValue={currentQuery}
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
							<DropdownMenuLabel>Sort Variants</DropdownMenuLabel>
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
					<TableColumnsToggle table={table} />
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

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type BoolVals = "true" | "false" | "null";
	const createdFromParam = searchParams.get("createdFrom");
	const createdToParam = searchParams.get("createdTo");
	const maxStockFilterDefaultVal = defaults.MAX_STOCK_FILTER_DEFAULT_VAL;

	const maxStockParam = searchParams.get("max_stock");
	const minStockParam = searchParams.get("min_stock");

	const form = useForm<ProductVaraintsFilterFormData>({
		resolver: zodResolver(ProductVariantsFilterFormSchema),
		defaultValues: {
			q: currentQuery,
			page: currentPageIndex,
			size: currentPageSize,
			status:
				searchParams.get("status") == null
					? "null"
					: (searchParams.get("status") as BoolVals) || "null",
			original_price: searchParams.get("original_price") || "",
			original_price_op: (searchParams.get("original_price_op") as FilterOp) ?? defaultOp,
			sale_price: searchParams.get("sale_price") || "",
			sale_price_op: (searchParams.get("sale_price_op") as FilterOp) ?? defaultOp,
			stock:
				maxStockParam && minStockParam
					? [maxStockParam, minStockParam].map((val) => Number(val))
					: [0, maxStockFilterDefaultVal],
			reorder_level: searchParams.get("reorder_level") || "",
			reorder_level_op: (searchParams.get("reorder_level_op") as FilterOp) ?? defaultOp,
			createdAt:
				createdFromParam && createdToParam
					? {
							from: new Date(createdFromParam),
							to: new Date(createdToParam),
					  }
					: null,
		},
	});

	const { handleSubmit, control, reset } = form;

	// Handle form submission
	const onFormSubmit = (values: ProductVaraintsFilterFormData) => {
		// console.log(values);
		const params: URLSearchParams = new URLSearchParams();

		// Append only explicitly set or changed values
		if (values.q) params.set("q", values.q);
		if (values.status && values.status !== "null") params.set("status", values.status);

		// for each numeric field
		if (values.original_price) {
			params.set("original_price", values.original_price);
			params.set("original_price_op", values.original_price_op ?? defaultOp);
		}
		if (values.sale_price) {
			params.set("sale_price", values.sale_price);
			params.set("sale_price_op", values.sale_price_op ?? defaultOp);
		}
		if (values.reorder_level) {
			params.set("reorder_level", values.reorder_level);
			params.set("reorder_level_op", values.reorder_level_op ?? defaultOp);
		}

		if (values.stock && values.stock.length === 2) {
			if (values.stock[0] !== 0) {
				params.set("min_stock", String(values.stock[0]));
			}
			if (values.stock[1] !== maxStockFilterDefaultVal) {
				params.set("max_stock", String(values.stock[1]));
			}
		}

		if (values.createdAt) {
			params.set("createdFrom", values.createdAt.from.toISOString());
			params.set("createdTo", values.createdAt.to.toISOString());
		} else {
			params.delete("createdFrom");
			params.delete("createdTo");
		}

		// Only append pageIndex and pageSize if they differ from current values or are explicitly set
		if (currentPageIndex !== defaultPage) {
			params.set("page", String(currentPageIndex));
		}
		if (currentPageSize != defaultSize) {
			params.set("size", String(currentPageSize));
		}

		// preserve kro unko agr pehly se apply keye hoe hain
		const sortBy = searchParams.get("sortBy");
		const sortType = searchParams.get("sortType");
		if (sortBy) params.set("sortBy", sortBy);
		if (sortType) params.set("sortType", sortType);

		navigate(`?${params.toString()}`);
	};

	const operatorItems: { value: FilterOp; label: string }[] = filterOps.map((op: FilterOp) => ({
		value: op,
		label: op.toUpperCase(),
	}));

	function handleReset() {
		reset(); // Resets the form state
		navigate(
			getVariantsResetFiltersUrl({
				defaultPage,
				defaultSize,
				pathname: location.pathname,
				search: location.search,
			}),
			{ replace: true },
		);
		setOpen(false);
	}

	return (
		<Sheet open={!!open} onOpenChange={setOpen}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Variants Filters</SheetTitle>
					<SheetDescription>Filter variants by their fields and values</SheetDescription>
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

						{/* Original Price */}
						<div className="space-y-2">
							<Label htmlFor="original_price_container">Original Price</Label>
							<div id="original_price_container" className="flex gap-2">
								{/* Operator select */}
								<FormField
									control={control}
									name="original_price_op"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Select value={field.value} onValueChange={field.onChange}>
													<SelectTrigger className="w-[6rem] font-semibold">
														<SelectValue />
													</SelectTrigger>
													<SelectContent className="!min-w-[6rem] *:font-semibold">
														{operatorItems.map((item) => (
															<SelectItem value={item.value} key={item.value}>
																{item.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Original Price */}
								<FormField
									control={control}
									name="original_price"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<div className="flex gap-2">
													{/* Numeric input */}
													<Input
														type="number"
														min={1}
														placeholder="e.g. 1000"
														{...field}
													/>
													<Button variant="outline" size="icon" tabIndex={-1}>
														<DollarSign className="h-4 w-4" />
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Sale Price */}
						<div className="space-y-2">
							<Label htmlFor="sale_price_container">Sale Price</Label>
							<div id="sale_price_container" className="flex gap-2">
								{/* Operator select */}
								<FormField
									control={control}
									name="sale_price_op"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Select value={field.value} onValueChange={field.onChange}>
													<SelectTrigger className="w-[6rem] font-semibold">
														<SelectValue />
													</SelectTrigger>
													<SelectContent className="!min-w-[6rem] *:font-semibold">
														{operatorItems.map((item) => (
															<SelectItem value={item.value} key={item.value}>
																{item.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Original Price */}
								<FormField
									control={control}
									name="sale_price"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<div className="flex gap-2">
													{/* Numeric input */}
													<Input
														type="number"
														min={1}
														placeholder="e.g. 1000"
														{...field}
													/>
													<Button variant="outline" size="icon" tabIndex={-1}>
														<DollarSign className="h-4 w-4" />
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Stock */}
						<FormField
							control={control}
							name="stock"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Stock</FormLabel>
									<FormControl>
										<div className="w-full mx-auto space-y-4 mt-1">
											<div className="w-full flex items-center justify-between gap-2">
												<span className="text-sm text-muted-foreground">0</span>
												<Slider
													value={field.value ?? [0, maxStockFilterDefaultVal]}
													onValueChange={field.onChange}
													max={maxStockFilterDefaultVal}
													step={10}
												/>
												<span className="text-sm text-muted-foreground">
													{maxStockFilterDefaultVal}
												</span>
											</div>
											<div className="flex items-center gap-2 *:w-full">
												<Input
													value={field.value?.[0]}
													onChange={(e) =>
														field.onChange([
															Number(e.target.value), // new min
															field.value?.[1] ?? maxStockFilterDefaultVal, // preserve old max
														])
													}
													className="text-center text-sm text-muted-foreground w-fit"
													type="number"
													min={0}
													max={maxStockFilterDefaultVal}
												/>
												<span className="flex-0">-</span>
												<Input
													value={field.value?.[1]}
													onChange={(e) =>
														field.onChange([
															field.value?.[0] ?? 0, // preserve old min
															Number(e.target.value), // new max
														])
													}
													className="text-center text-sm text-muted-foreground w-fit"
													type="number"
													min={0}
													max={maxStockFilterDefaultVal}
												/>
											</div>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Reorder Level */}
						<div className="space-y-2">
							<Label htmlFor="reorder_level_container">Reorder Level</Label>
							<div id="reorder_level_container" className="flex gap-2">
								{/* Operator select */}
								<FormField
									control={control}
									name="reorder_level_op"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Select value={field.value} onValueChange={field.onChange}>
													<SelectTrigger className="w-[6rem] font-semibold">
														<SelectValue />
													</SelectTrigger>
													<SelectContent className="!min-w-[6rem] *:font-semibold">
														{operatorItems.map((item) => (
															<SelectItem value={item.value}>
																{item.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Original Price */}
								<FormField
									control={control}
									name="reorder_level"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Input
													type="number"
													min={1}
													placeholder="e.g. 10"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

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

// 	const productsList = queryClient.fetchQuery(productNamesQuery({ request }));

// const { productsList } = useLoaderData<typeof loader>();

{
	/* Parent Product */
}
{
	/* <Suspense fallback={<div className="text-lg text-red-700">Loading...</div>}>
	<Await resolve={productsList}>
		{({ products }) => (
			<Controller
				name="parent_id"
				control={control}
				render={({ field }) => {
					const selected = products?.find((p) => p.id === field.value);
					return (
						<FormField
							control={control}
							name="parent_id"
							render={() => (
								<FormItem className="flex flex-col">
									<FormLabel>Parent Product</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													role="combobox"
													className={cn(
														"w-full justify-between",
														!selected &&
															"text-muted-foreground"
													)}
												>
													{selected
														? selected.name
														: "Select product"}
													<ChevronsUpDown className="opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent
											align="start"
											className="p-0 w-[var(--radix-popover-trigger-width)]"
										>
											<Command>
												<CommandInput placeholder="Search products" />
												<CommandList>
													<CommandEmpty>
														No products found.
													</CommandEmpty>
													<CommandGroup>
														{products?.map((prod) => (
															<CommandItem
																key={prod.id}
																value={prod.name} // ← filter by name
																onSelect={(value) => {
																	// find the matching ID, then set it
																	const match =
																		products.find(
																			(p) =>
																				p.name ===
																				value
																		);
																	if (match)
																		field.onChange(
																			match.id
																		);
																}}
															>
																{prod.name}
															</CommandItem>
														))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>
					);
				}}
			/>
		)}
	</Await>
</Suspense> */
}
