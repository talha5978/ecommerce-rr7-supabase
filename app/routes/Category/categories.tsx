import { Form, Link, LoaderFunctionArgs, useFetcher, useLocation, useSearchParams } from "react-router";
import { Route } from "./+types/categories";
import { Button } from "~/components/ui/button";
import { Loader2, MoreHorizontal, PlusCircle, Search, Settings2, TriangleAlert } from "lucide-react";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { GetFormattedDate } from "~/lib/utils";
import { highLevelCategoriesQuery } from "~/queries/categories.q";
import type { HighLevelCategory } from "~/types/category.d";
import { queryClient } from "~/lib/queryClient";
import { defaults } from "~/constants";
import { useEffect } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import TableId from "~/components/Table/TableId";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { GetPaginationControls } from "~/utils/getPaginationControls";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_CATEGORY_PAGE,
		defaultPageSize: defaults.DEFAULT_CATEGORY_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(
		highLevelCategoriesQuery({
			request,
			q,
			pageIndex,
			pageSize,
		}),
	);

	return {
		data, // { categories: [...], total, error: null }
		query: q,
		pageIndex, // zero-based
		pageSize,
	};
};

export default function CategoriesPage({
	loaderData: { data, query, pageIndex, pageSize },
}: Route.ComponentProps) {
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	useEffect(() => {
		if (data.error != null && data.error.message) {
			console.log(data);

			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	const fetcher = useFetcher();

	// Handle fetcher state for toasts and query invalidation
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Category deleted successfully");
				queryClient.invalidateQueries({ queryKey: ["categories"] });
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
		console.log(fetcher.data);
	}, [fetcher.data, queryClient]);

	const handleDeleteClick = (categoryId: string) => {
		const formData = new FormData();
		formData.append("categoryId", categoryId);
		fetcher.submit(formData, {
			method: "POST",
			action: `/categories/${categoryId}/delete`,
		});
	};

	const tableColumns: ColumnDef<HighLevelCategory, unknown>[] = [
		{
			accessorKey: "ID",
			header: "ID",
			cell: (info) => <TableId id={info.row.original.id} message="Category ID Copied" />,
		},
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "category_name",
			cell: (info: any) => info.row.original.category_name,
			header: () => "Name",
		},
		{
			id: "Url Key",
			accessorKey: "url_key",
			cell: (info: any) => "/" + info.row.original.url_key,
			header: () => "Url Key",
		},
		{
			id: "Sub Categories",
			enableHiding: false,
			accessorKey: "sub_category",
			cell: (info: any) => {
				const len = info.row.original.sub_category_count ?? 0;
				const isZeroLen = len === 0;
				return (
					<div className={`${isZeroLen ? "flex gap-2 items-center" : ""}`}>
						<p className={`${isZeroLen ? "text-destructive" : ""}`}>{len}</p>
						{isZeroLen && <TriangleAlert className="w-4 h-4 text-destructive" />}
					</div>
				);
			},
			header: () => "No. of Sub Categories",
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
				const rowData: HighLevelCategory = row.original;

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
								<Link to={`${rowData.id}/sub-categories`} viewTransition prefetch="intent">
									<DropdownMenuItem>View Sub Categories</DropdownMenuItem>
								</Link>
								<Link
									to={`${rowData.id}/sub-categories/create`}
									viewTransition
									prefetch="intent"
								>
									<DropdownMenuItem>Create Sub Category</DropdownMenuItem>
								</Link>
								<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
									<DropdownMenuItem>Update</DropdownMenuItem>
								</Link>
								<DropdownMenuItem
									disabled={fetcher.state === "submitting"}
									variant="destructive"
									onClick={() => handleDeleteClick(rowData.id)}
								>
									{fetcher.state === "submitting" ? (
										<Loader2 className="animate-spin" color="white" />
									) : null}
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
	];

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: defaults.DEFAULT_CATEGORY_PAGE,
	});

	const table = useReactTable({
		data: (data.categories as HighLevelCategory[]) ?? [],
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
				metaTitle="Categories | Admin Panel"
				metaDescription="Manage your categories here."
				metaKeywords="Categories, Manage"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Categories</h1>
						<Link to="/categories/create" viewTransition className="ml-auto">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Create Category</span>
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelCategory>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<Form method="get" action="/categories">
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search categories"
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
			</div>
			<TableColumnsToggle table={table} />
		</div>
	);
}
