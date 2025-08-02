import {
	Form,
	Link,
	LoaderFunctionArgs,
	useFetcher,
	useLocation,
	useNavigate,
	useSearchParams,
} from "react-router";
import { Route } from "./+types/collections";
import { Button } from "~/components/ui/button";
import {
	ArrowDownWideNarrow,
	ArrowUpDown,
	ArrowUpNarrowWide,
	Loader2,
	MoreHorizontal,
	PlusCircle,
	Search,
	Settings2,
	TriangleAlert,
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
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { useEffect, useMemo, useState } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { defaults, sortTypeEnums } from "~/constants";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { bolleanToStringConverter, GetFormattedDate } from "~/lib/utils";
import StatusBadge from "~/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, Form as ShadcnForm } from "~/components/ui/form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Checkbox } from "~/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMobile } from "~/hooks/use-mobile";
import { ProductStatusUpdateFormValues, ProductStatusUpdateInputSchema } from "~/schemas/product.schema";
import { collectionsQuery } from "~/queries/collections.q";
import { HighLevelCollection } from "~/types/collections";
import {
	CollectionFilers,
	CollectionFilterFormSchema,
	CollectionsFilterFormData,
} from "~/schemas/collections-filter.schema";
import { getCollectionsFiltersPayload } from "~/utils/getCollectionssFiltersPayload";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_COLLECTIONS_PAGE,
		defaultPageSize: defaults.DEFAULT_COLLECTIONS_PAGE_SIZE,
	});

	const collectionFilters: CollectionFilers = getCollectionsFiltersPayload({ request });

	const data = await queryClient.fetchQuery(
		collectionsQuery({
			request,
			q,
			pageIndex,
			pageSize,
			filters: collectionFilters,
		}),
	);

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
	};
};

export default function CollectionsPage({
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

	const columns: ColumnDef<HighLevelCollection, unknown>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info: any) => {
				return <p className="md:max-w-[35ch] max-w-[20ch] truncate">{info.row.original.name}</p>;
			},
			header: () => "Name",
		},
		{
			id: "Status",
			accessorKey: "status",
			cell: (info: any) => {
				return (
					<StatusBadge variant={info.row.original?.status ? "success" : "destructive"} icon="dot">
						{info.row.original?.status ? "Active" : "Inactive"}
					</StatusBadge>
				);
			},
			header: () => "Status",
		},
		{
			id: "Products",
			accessorKey: "products_count",
			cell: (info: any) => {
				const len = info.row.original.products_count;
				const isZeroLen = len === 0;
				return (
					<div className={`${isZeroLen ? "flex gap-2 items-center" : ""}`}>
						<p className={`${isZeroLen ? "text-destructive" : ""}`}>{len}</p>
						{isZeroLen && <TriangleAlert className="w-4 h-4 text-destructive" />}
					</div>
				);
			},
			header: () => "Products",
		},
		{
			id: "Url Key",
			accessorKey: "url_key",
			cell: (info: any) => "/" + info.row.original.url_key,
			header: () => "Url Key",
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
				const rowData: HighLevelCollection = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
								<DropdownMenuItem>Update</DropdownMenuItem>
							</Link>
							<UpdateStatusForm
								inputStatus={rowData.status as boolean}
								collectionId={rowData.id}
							/>
							<Link to={`${rowData.id}/update`}>
								<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const tableColumns = useMemo(() => columns, []);

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: defaults.DEFAULT_COLLECTIONS_PAGE,
	});

	const table = useReactTable({
		data: (data.collections as HighLevelCollection[]) ?? [],
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
				metaTitle={`Collections ${query.trim() ? `| "${query.trim()}"` : ""} | Admin Panel`}
				metaDescription="Manage your product collections here."
				metaKeywords="Collections"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Collections</h1>
						<Link to="create" viewTransition className="ml-auto">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Create Collection</span>
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

function UpdateStatusForm({ inputStatus, collectionId }: { inputStatus: boolean; collectionId: string }) {
	const defaultValues = {
		status: bolleanToStringConverter(inputStatus) as "true" | "false",
	};

	const { control, reset } = useForm<ProductStatusUpdateFormValues>({
		resolver: zodResolver(ProductStatusUpdateInputSchema),
		defaultValues,
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
					fetcher.data?.status !== undefined
						? bolleanToStringConverter(fetcher.data?.status)
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
		const initialStatus = bolleanToStringConverter(inputStatus) as "true" | "false";
		const currentStatus = status !== initialStatus;

		if (currentStatus && status != undefined) {
			const formData = new FormData();
			formData.append("status", status);
			setSubmitting(true); // Set the submitting field
			fetcher.submit(formData, { method: "post", action: `${collectionId}/update` });
		}
	}, [status, inputStatus, collectionId, fetcher]);

	const fields = useMemo(
		() => [
			{ label: "Active", value: "true" },
			{ label: "Inactive", value: "false" },
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
												key={item.value + item.label}
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

function SortSelector() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type sortFormData = Pick<CollectionsFilterFormData, "sortBy" | "sortType">;

	const form = useForm<sortFormData>({
		resolver: zodResolver(CollectionFilterFormSchema),
		defaultValues: {
			sortBy:
				(searchParams.get("sortBy") as sortFormData["sortBy"]) ||
				defaults.defaultCollectionSortByFilter,
			sortType:
				(searchParams.get("sortType") as sortFormData["sortType"]) ||
				defaults.defaultCollectionSortTypeFilter,
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
											<SelectItem value="status">Status</SelectItem>
											<SelectItem value="products_count">Products Count</SelectItem>
											<SelectItem value="name">Name</SelectItem>
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelCollection>) {
	const isMobile = useIsMobile({ customBreakpoint: 400 });

	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("q") ?? "";
	console.log("FDsa");

	return (
		<>
			<div className="w-full flex justify-between gap-4 items-center">
				<div className="flex gap-2 items-center">
					<Form method="get" action="/collections">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search collections"
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
						<DropdownMenuContent align={isMobile ? "end" : "start"} className="w-fit">
							<DropdownMenuLabel>Sort Products</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{/* Sorting Select! */}
							<SortSelector />
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Columns toggle */}
				<TableColumnsToggle table={table} />
			</div>
		</>
	);
}
