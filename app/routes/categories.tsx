import { Await, Form, LoaderFunctionArgs, useFetcher, useLoaderData, useLocation, useNavigate, useSearchParams } from "react-router";
import { getCache, setCache } from "~/lib/cache";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { Route } from "./+types/categories";
import { Button } from "~/components/ui/button";
import { Badge, CirclePlus, Copy, Filter, MoreHorizontal, PlusCircle, Search, Settings2 } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { getFormattedDate } from "~/lib/utils";
import { categoriesQuery } from "~/queries/categories.q";
import type { FullCategory } from "~/types/category";
import { queryClient } from "~/lib/queryClient";
import { categoryDefaults } from "~/constants";
import { UseQueryResult } from "@tanstack/react-query";

export const handle = {
	title: "Categories",
};

export const meta = [
	{ title: "Categories | Admin Panel", description: "Product Categories" },
];

// export const loader = async ({ request }: LoaderFunctionArgs) => {
// 	const url = new URL(request.url);
// 	const q = url.searchParams.get("q")?.trim() ?? "";
	
// 	const data = await queryClient.ensureQueryData(categoriesQuery({request, q}));
// 	console.log("Loader ran ✅");
	
// 	return { data, query: q };
// };

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const q = url.searchParams.get("q")?.trim() ?? "";
	const pageParam = Number(url.searchParams.get("page") ?? String(categoryDefaults.DEFAULT_CATEGORY_PAGE));
	const sizeParam = Number(url.searchParams.get("size") ?? String(categoryDefaults.DEFAULT_CATEGORY_PAGE_SIZE));

	const pageIndex = Math.max(0, pageParam - 1);
	const pageSize = Math.max(1, sizeParam);

	const data = await queryClient.fetchQuery(categoriesQuery({request, q, pageIndex, pageSize}));

	console.log("Loader ran ✅", { q, pageIndex, pageSize, total: data.total });

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
	if (data.categories == null) {
		throw new Response("Error fetching categories", { status: 404 });
	}
	
	const navigation = useNavigation();
	const location = useLocation();

	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const tableColumns: ColumnDef<FullCategory, unknown>[] = [
		{
			accessorKey: "ID",
			header: "ID",
			cell: (info: any) => (
				<div>
					<div
						className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
						onClick={() => {
							navigator.clipboard.writeText(info.row.original.id);
							toast.success("Category id copied", {
								description: info.row.original.id,
							});
						}}
					>
						<Copy strokeWidth={1.65} width={13} className="self-center" />
						<span>{info.row.original.id}</span>
					</div>
				</div>
			),
		},
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "category_name",
			cell: (info: any) => info.row.original.category_name,
			header: () => "Name",
		},
		{
			id: "Sub Categories",
			enableHiding: false,
			accessorKey: "sub_category",
			cell: (info: any) => {
				const len = info.row.original.sub_category.length;
				return (
					<span className={`${len == 0 ? "text-destructive" : ""}`}>
						{info.row.original.sub_category.length}
					</span>
				);
			},
			header: () => "Sub Categories",
		},
		{
			id: "Created At",
			accessorKey: "createdAt",
			cell: (info: any) => getFormattedDate(info.row.original.createdAt),
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: FullCategory = row.original;

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
								<DropdownMenuItem
								// onClick={() =>
								// 	handleDetailsClick(rowData)
								// }
								>
									Update
								</DropdownMenuItem>
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

	const onPageChange = (newPageIndex: number) => {
		searchParams.set("page", (newPageIndex + 1).toString());
		navigate({ search: searchParams.toString() });
	};

	const onPageSizeChange = (newPageSize: number) => {
		searchParams.set("size", newPageSize.toString());
		searchParams.set("page", String(categoryDefaults.DEFAULT_CATEGORY_PAGE));
		navigate({ search: searchParams.toString() });
	};

	const table = useReactTable({
		data: (data.categories as FullCategory[]) ?? [],
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
	// console.log(pageSize, pageIndex, pageCount);
	
	return (
		<div className="flex flex-1 flex-col gap-6">
			<div className="flex justify-between gap-3 flex-wrap">
				<h1 className="text-2xl font-semibold">Categories ({data.total ?? "0"})</h1>
				<Button size={"sm"} className="ml-auto">
					<PlusCircle width={18} />
					<span>Add Category</span>
				</Button>
			</div>
			<div className="rounded-md flex flex-col gap-4">
				<DataTableViewOptions table={table} disabled={isFetchingThisRoute} />
				{isFetchingThisRoute ? (
					<DataTableSkeleton NoOfSkeletonRows={4} columns={tableColumns} />
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
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<FullCategory>) {
    const [searchParams] = useSearchParams();
    let currentQuery = searchParams.get("q") ?? "";

    return (
		<div className="w-full flex justify-between gap-4">
			<div>
				<Form method="get" action="/categories">
					<div className="relative">
						<Search className="absolute left-2 top-1/2 transform -translate-y-1/2" width={18} />
						<Input
							placeholder="Search"
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