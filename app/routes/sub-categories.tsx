import { Form, Link, LoaderFunctionArgs, useLocation, useNavigate, useSearchParams } from "react-router";
import { Route } from "./+types/sub-categories";
import { Button } from "~/components/ui/button";
import { MoreHorizontal, PlusCircle, Search, Settings2 } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/Table/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { GetFormattedDate } from "~/lib/utils";
import { subCategoriesQuery } from "~/queries/categories.q";
import type { HighLevelSubCategory } from "~/types/category.d";
import { queryClient } from "~/lib/queryClient";
import { defaults } from "~/constants";
import BackButton from "~/components/Nav/BackButton";
import TableId from "~/components/Table/TableId";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { GetPaginationControls } from "~/utils/getPaginationControls";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const categoryId = (params.categoryId as string) || "";
	if (!categoryId || categoryId == "") {
		throw new Response("Category ID is required", { status: 400 });
	}

	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_SUB_CATEGORY_PAGE,
		defaultPageSize: defaults.DEFAULT_SUB_CATEGORY_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(
		subCategoriesQuery({request, categoryId, q, pageIndex, pageSize})
	);

	return {
		data, // { subCategories: [...], total, error }
		categoryId,
		query: q,
		pageIndex,
		pageSize,
	};
};

export default function SubCategoriesPage({
	loaderData: { data, categoryId, query, pageIndex, pageSize },
}: Route.ComponentProps) {
	if (data.subCategories == null) {
		throw new Response("Error fetching categories", { status: 404 });
	}
	// console.log(data);
	
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const tableColumns: ColumnDef<HighLevelSubCategory, unknown>[] = [
		{
			accessorKey: "ID",
			header: "ID",
			cell: (info: any) => <TableId id={info.row.original.id} message="Sub category ID copied"/>,
		},
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "category_name",
			cell: (info: any) => info.row.original.sub_category_name,
			header: () => "Name",
		},
		{
			id: "Url Key",
			accessorKey: "url_key",
			cell: (info: any) => "/" + info.row.original.url_key,
			header: () => "Url Key"
		},
		{
			id: "Description",
			accessorKey: "description",
			cell: (info: any) => (
				<div className="truncate max-w-[300px]">{info.row.original.description}</div>
			),
			header: () => "Description",
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
				const rowData: HighLevelSubCategory = row.original;

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
								<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
									<DropdownMenuItem>Update</DropdownMenuItem>
								</Link>
								<DropdownMenuItem
									variant="destructive"
									// onClick={() =>
									// 	handleDetailsClick(rowData)
									// }
								>
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
		defaultPage: defaults.DEFAULT_SUB_CATEGORY_PAGE,
	});

	const table = useReactTable({
		data: (data.subCategories as HighLevelSubCategory[]) ?? [],
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
				metaTitle="Sub Categories | Admin Panel"
				metaDescription="Manage your sub categories here."
				metaKeywords="Sub Categories, Manage"
			/>
			<div className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<div className="flex gap-4 items-center">
							<BackButton href={"/categories"} />
							<h1 className="text-2xl font-semibold">Sub Categories</h1>
						</div>
						<Link to={`/categories/${categoryId}/sub-categories/create`} viewTransition className="ml-auto">
							<Button size={"sm"} className="ml-auto">
								<PlusCircle width={18} />
								<span>Create New</span>
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelSubCategory>) {
    const [searchParams] = useSearchParams();
    let currentQuery = searchParams.get("q") ?? "";
	
    return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<Form method="get">
					<div className="relative">
						<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" width={18} />
						<Input
							placeholder="Search sub categories"
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
							(column: any) => typeof column.accessorFn !== "undefined" && column.getCanHide()
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
	);
}