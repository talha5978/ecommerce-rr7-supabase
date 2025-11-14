import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, ListFilter, Loader2, MoreHorizontal, RotateCcw, Search } from "lucide-react";
import { JSX, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
	Form,
	Link,
	LoaderFunctionArgs,
	useLoaderData,
	useLocation,
	useNavigate,
	useNavigation,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import DateRangePicker from "~/components/Custom-Inputs/date-range-picker";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import StatusBadge from "~/components/status-badge";
import {
	DataTable,
	DataTableSkeleton,
	DataTableViewOptionsProps,
	TableColumnsToggle,
} from "~/components/Table/data-table";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Form as ShadcnForm,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { useIsMobile } from "~/hooks/use-mobile";
import { getActiveProductsFiltersCount } from "~/utils/getActiveProductsFiltersCount";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { getProductsResetFiltersUrl } from "~/utils/getProductsResetFiltersUrl";
import { Route } from "./+types/orders";
import { defaults, PAYMENT_CURRENCY } from "@ecom/shared/constants/constants";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import {
	ProductFilterFormSchema,
	type ProductsFilterFormData,
} from "@ecom/shared/schemas/products-filter.schema";
import { cn, GetFormattedDate } from "@ecom/shared/lib/utils";
import type { CategoryListRow } from "@ecom/shared/types/category";
import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { highLvlOrdersQuery } from "~/queries/orders.q";
import type { HighLevelOrder } from "@ecom/shared/types/orders";
import TableId from "~/components/Table/TableId";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

const defaultPage = "0";
const defaultSize = defaults.DEFAULT_ORDERS_PAGE_SIZE.toString();

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: 1,
		defaultPageSize: defaults.DEFAULT_ORDERS_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(
		highLvlOrdersQuery({
			request,
			q,
			pageIndex,
			pageSize,
		}),
	);

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
	};
};

export default function OrdersPage({
	loaderData: { data, query, pageIndex, pageSize },
}: Route.ComponentProps) {
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute = useMemo(
		() => navigation.state === "loading" && navigation.location?.pathname === location.pathname,
		[navigation.state, navigation.location?.pathname, location.pathname],
	);
	// console.log(data);

	useEffect(() => {
		if (data.error != null && data.error.message) {
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);
	console.log("Re rendered");

	const columns: ColumnDef<HighLevelOrder, unknown>[] = [
		{
			accessorKey: "ID",
			header: "ID",
			cell: (info) => <TableId id={info.row.original.id} message="Order ID Copied" />,
		},
		{
			id: "Total",
			accessorKey: "Total",
			cell: (info) => (
				<p>
					{info.row.original.total} {PAYMENT_CURRENCY.toUpperCase()}
				</p>
			),
			header: () => "Total",
		},
		{
			id: "Order Status",
			accessorKey: "Order Status",
			cell: ({
				row: {
					original: { status },
				},
			}: {
				row: { original: HighLevelOrder };
			}) => {
				function getVariant(status: HighLevelOrder["status"]): [any, any] {
					if (status === "pending") {
						return ["warning", "dot"];
					} else if (status === "failed") {
						return ["destructive", "cross"];
					} else if (status === "paid") {
						return ["success", "dot"];
					} else if (status === "shipped") {
						return ["success", "tick"];
					} else if (status === "cancelled") {
						return ["default", "cross"];
					} else {
						throw new Error("Invalid order status");
					}
				}

				return (
					<StatusBadge variant={getVariant(status)[0]} icon={getVariant(status)[1]}>
						{status.charAt(0).toUpperCase() + String(status).slice(1)}
					</StatusBadge>
				);
			},
			header: () => "Order Status",
		},
		{
			id: "Payment Method",
			accessorKey: "Payment Method",
			cell: (info) => (
				<p>{info.row.original.payment.method === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
			),
			header: () => "Payment Method",
		},
		{
			id: "Payment",
			accessorKey: "Payment",
			cell: ({
				row: {
					original: { payment },
				},
			}: {
				row: { original: HighLevelOrder };
			}) => {
				function getVariant(status: HighLevelOrder["payment"]["status"]): [any, any] {
					if (status === "pending") {
						return ["warning", "dot"];
					} else if (status === "failed") {
						return ["destructive", "cross"];
					} else if (status === "completed") {
						return ["success", "tick"];
					} else if (status === "partially_refunded") {
						return ["default", "dot"];
					} else if (status === "refunded") {
						return ["default", "tick"];
					} else {
						throw new Error("Invalid payment status");
					}
				}

				return (
					<StatusBadge variant={getVariant(payment.status)[0]} icon={getVariant(payment.status)[1]}>
						{payment.status.charAt(0).toUpperCase() + String(payment.status).slice(1)}
					</StatusBadge>
				);
			},
			header: () => "Payment",
		},
		{
			id: "User",
			accessorKey: "User",
			cell: ({ row }) => {
				return (
					<div className="flex gap-2 items-center">
						<Avatar className="h-8 w-8 rounded-full my-1 ml-1 cursor-pointer">
							<AvatarImage
								src={row.original.user.avatar ?? ""}
								alt={row.original.user.name ?? "User"}
							/>
							<AvatarFallback className="rounded-lg bg-muted-foreground/30" />
						</Avatar>
						<div>
							<p>{row.original.user.name}</p>
							<a
								href={`mailto:${row.original.user.email}`}
								target="_blank"
								className="hover:underline underline-offset-4"
							>
								{row.original.user.email}
							</a>
						</div>
					</div>
				);
			},
			header: () => "User",
		},
		{
			id: "Created At",
			accessorKey: "created_at",
			cell: (info) => GetFormattedDate(info.row.original.created_at),
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: HighLevelOrder = row.original;

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
							{/* <UpdateStatusForm product={rowData as HighLevelOrder} /> */}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const tableColumns = useMemo(() => columns, []);

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: defaults.DEFAULT_PRODUCTS_PAGE,
	});

	const table = useReactTable({
		data: (data.orders as HighLevelOrder[]) ?? [],
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
				metaTitle={`Orders ${query.trim() ? `| "${query.trim()}"` : ""} | Admin Panel`}
				metaDescription="Manage your orders here."
				metaKeywords="Orders"
			/>
			<Breadcrumbs />
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold">Orders</h1>
					{query && (
						<div className="mt-3">
							<p>Showing record for order id "{query?.trim()}"</p>
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelOrder>) {
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
		navigate(
			getProductsResetFiltersUrl({
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
					<Form method="get" action="/orders">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search orders by id"
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
							{/* <SortSelector /> */}
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

	const loaderData = useLoaderData<typeof loader>();

	const categories: CategoryListRow[] = [];
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
					: null,
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
		if (values.is_featured && values.is_featured !== "null") {
			params.set("is_featured", values.is_featured);
		}
		if (values.category && Array.isArray(values.category) && values.category.length > 0) {
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
		setOpen(false);
	};

	function handleReset() {
		reset(); // Resets the form state
		navigate(
			getProductsResetFiltersUrl({
				defaultPage,
				defaultSize,
				pathname: location.pathname,
				search: location.search,
			}),
			{ replace: true },
		);
	}

	return (
		<Sheet open={!!open} onOpenChange={setOpen}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Product Filters</SheetTitle>
					<SheetDescription>Filter products by their fields and values</SheetDescription>
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
											selectedSubCategories.includes(id),
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
												<summary className="flex items-center gap-2 cursor-pointer list-none hover:underline underline-offset-4">
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
																checked
																	? newSubs.add(id)
																	: newSubs.delete(id),
															);

															const newCats = new Set(selectedCategories);
															checked
																? newCats.add(cat.id)
																: newCats.delete(cat.id);

															setValue("sub_category", Array.from(newSubs));
															setValue("category", Array.from(newCats));
														}}
													/>
													<Label
														htmlFor={`cat-${cat.id}`}
														className="font-medium text-sm cursor-pointer"
													>
														{cat.category_name}
													</Label>
												</summary>

												<div className="pl-4 m-2 mt-2 space-y-1 border-sidebar-border border-l">
													{cat.sub_category.map((sub) => (
														<div
															key={sub.id}
															className="flex items-center gap-2 hover:underline underline-offset-4"
														>
															<Checkbox
																id={`subcat-${sub.id}`}
																checked={selectedSubCategories.includes(
																	sub.id,
																)}
																onCheckedChange={(checked) => {
																	const newSubs = new Set(
																		selectedSubCategories,
																	);
																	checked
																		? newSubs.add(sub.id)
																		: newSubs.delete(sub.id);

																	// if any child remains, keep parent checked
																	const newCats = new Set(
																		selectedCategories,
																	);
																	const stillAny = subIds.some((id) =>
																		newSubs.has(id),
																	);
																	stillAny
																		? newCats.add(cat.id)
																		: newCats.delete(cat.id);

																	setValue(
																		"sub_category",
																		Array.from(newSubs),
																	);
																	setValue("category", Array.from(newCats));
																}}
															/>
															<Label
																htmlFor={`subcat-${sub.id}`}
																className="font-medium text-sm cursor-pointer"
															>
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
						<SheetFooter className="!self-end px-0 w-full **:!w-full ">
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
