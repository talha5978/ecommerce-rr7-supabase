import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
	ArrowDownWideNarrow,
	ArrowUpDown,
	ArrowUpNarrowWide,
	ListFilter,
	Loader2,
	MoreHorizontal,
	RotateCcw,
	Search,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Form,
	Link,
	LoaderFunctionArgs,
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
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { type Route } from "./+types/orders";
import {
	defaults,
	type FilterOp,
	filterOps,
	PAYMENT_CURRENCY,
	sortTypeEnums,
} from "@ecom/shared/constants/constants";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { GetFormattedDate } from "@ecom/shared/lib/utils";
import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { highLvlOrdersQuery } from "~/queries/orders.q";
import type { HighLevelOrder } from "@ecom/shared/types/orders";
import TableId from "~/components/Table/TableId";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	defaultOp,
	OrdersFilterFormSchema,
	type OrderFilters,
	type OrdersFilterFormData,
} from "@ecom/shared/schemas/orders-filter.schema";
import { getOrdersFiltersPayload } from "~/utils/getOrdersFiltersPayload";
import { getActiveOrdersFiltersCount } from "~/utils/getActiveOrdersFiltersCount";
import { getOrdersResetFiltersUrl } from "~/utils/getOrdersResetFiltersUrl";
import { Constants } from "@ecom/shared/types/supabase";
import OrderStatusBadge from "~/components/Orders/OrderStatusBadge";
import PaymentStatusBadge from "~/components/Orders/PaymentStatusBadge";

const defaultPage = "0";
const defaultSize = defaults.DEFAULT_ORDERS_PAGE_SIZE.toString();

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: 1,
		defaultPageSize: defaults.DEFAULT_ORDERS_PAGE_SIZE,
	});

	const orderFilters: OrderFilters = getOrdersFiltersPayload({ request });

	const data = await queryClient.fetchQuery(
		highLvlOrdersQuery({
			request,
			q,
			pageIndex,
			pageSize,
			filters: orderFilters,
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
	// console.log("Re rendered");

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
			cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
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
			cell: ({ row }) => <PaymentStatusBadge payment={row.original.payment} />,
			header: () => "Payment",
		},
		{
			id: "Customer",
			accessorKey: "Customer",
			cell: ({ row }) => {
				return (
					<div className="flex gap-2 items-center">
						<Avatar className="h-8 w-8 rounded-full my-1 ml-1 cursor-pointer">
							<AvatarImage
								src={row.original.user.avatar ?? ""}
								alt={row.original.user.name ?? "Customer"}
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
			header: () => "Customer",
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
									toast.success("Order ID copied", {
										description: rowData.id,
									});
								}}
							>
								Copy ID
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<Link to={`order/${rowData.id}`} viewTransition prefetch="intent">
								<DropdownMenuItem>See Details</DropdownMenuItem>
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

	const activeFiltersCount = getActiveOrdersFiltersCount(searchParams);
	const [filtersMenuOpen, setFiltersMenuOpen] = useState<boolean>(false);

	function handleFiltersClick() {
		return setFiltersMenuOpen(!filtersMenuOpen);
	}

	function handleResetFilters() {
		navigate(
			getOrdersResetFiltersUrl({
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
							<DropdownMenuLabel>Sort Orders</DropdownMenuLabel>
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

function SortSelector() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type sortFormData = Pick<OrdersFilterFormData, "sortBy" | "sortType">;

	const form = useForm<sortFormData>({
		resolver: zodResolver(OrdersFilterFormSchema),
		defaultValues: {
			sortBy:
				(searchParams.get("sortBy") as sortFormData["sortBy"]) || defaults.defaultOrdersSortByFilter,
			sortType:
				(searchParams.get("sortType") as sortFormData["sortType"]) ||
				defaults.defaultOrdersSortTypeFilter,
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
											<SelectItem value="created_at">Date Created</SelectItem>
											<SelectItem value="status">Order Status</SelectItem>
											<SelectItem value="total">Total Price</SelectItem>
											<SelectItem value="discount">Discount</SelectItem>
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

const FiltersSheet = memo(function FiltersSheetFunc({
	open,
	setOpen,
}: {
	open?: boolean;
	setOpen: (open: boolean) => void;
}) {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const currentQuery = searchParams.get("q") || undefined;

	const currentPageIndex = searchParams.get("page") || defaultPage;
	const currentPageSize = searchParams.get("size") || defaultSize;

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const createdFromParam = searchParams.get("createdFrom");
	const createdToParam = searchParams.get("createdTo");

	const form = useForm<OrdersFilterFormData>({
		resolver: zodResolver(OrdersFilterFormSchema),
		defaultValues: {
			q: currentQuery,
			page: currentPageIndex,
			size: currentPageSize,
			status: searchParams.get("status") == null ? "null" : searchParams.get("status") || "null",
			total: searchParams.get("total") || "",
			total_op: (searchParams.get("total_op") as FilterOp) ?? defaultOp,
			discount: searchParams.get("discount") || "",
			discount_op: (searchParams.get("discount_op") as FilterOp) ?? defaultOp,
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
	const onFormSubmit = (values: OrdersFilterFormData) => {
		// console.log(values);
		const params: URLSearchParams = new URLSearchParams();

		// Append only explicitly set or changed values
		if (values.q) params.set("q", values.q);
		if (values.status && values.status !== "null") params.set("status", values.status);

		// for each numeric field
		if (values.total) {
			params.set("total", values.total);
			params.set("total_op", values.total_op ?? defaultOp);
		}

		if (values.discount) {
			params.set("discount", values.discount);
			params.set("discount_op", values.discount_op ?? defaultOp);
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
		setOpen(false);
	};

	const operatorItems: { value: FilterOp; label: string }[] = filterOps.map((op: FilterOp) => ({
		value: op,
		label: op.toUpperCase(),
	}));

	function handleReset() {
		reset(); // Resets the form state
		navigate(
			getOrdersResetFiltersUrl({
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
					<SheetTitle>Order Filters</SheetTitle>
					<SheetDescription>Filter orders by by your defined criteria</SheetDescription>
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
									<FormLabel>Order Status</FormLabel>
									<FormControl>
										<div className="*:w-full">
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="null">Select status</SelectItem>
													{Constants.public.Enums.order_status.map((status) => (
														<SelectItem key={status} value={status}>
															{status.charAt(0).toUpperCase() + status.slice(1)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Total Price */}
						<div className="space-y-2">
							<Label htmlFor="original_price_container">Total Price</Label>
							<div id="original_price_container" className="flex gap-2">
								{/* Operator select */}
								<FormField
									control={control}
									name="total_op"
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

								{/* Total Price */}
								<FormField
									control={control}
									name="total"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<div className="relative">
													<Input
														type="number"
														min={1}
														placeholder="e.g. 1000"
														className="pr-11"
														{...field}
													/>
													<p className="absolute right-2 top-1/2 -translate-y-1/2">
														{PAYMENT_CURRENCY.toUpperCase()}
													</p>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Discount */}
						<div className="space-y-2">
							<Label htmlFor="original_price_container">Discount</Label>
							<div id="original_price_container" className="flex gap-2">
								{/* Operator select */}
								<FormField
									control={control}
									name="discount_op"
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

								<FormField
									control={control}
									name="discount"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<div className="relative">
													<Input
														type="number"
														min={1}
														placeholder="e.g. 1000"
														className="pr-11"
														{...field}
													/>
													<p className="absolute right-2 top-1/2 -translate-y-1/2">
														{PAYMENT_CURRENCY.toUpperCase()}
													</p>
												</div>
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
});
