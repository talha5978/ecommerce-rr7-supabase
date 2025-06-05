import { Await, Form, LoaderFunctionArgs, useFetcher, useLocation, useSearchParams } from "react-router";
import { getCache, setCache } from "~/lib/cache";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { Route } from "./+types/categories";
import { Button } from "~/components/ui/button";
import { Badge, CirclePlus, Copy, Filter, MoreHorizontal, PlusCircle, Search, Settings2, X } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { getFormattedDate } from "~/lib/utils";
import { Suspense } from "react";

export const handle = {
	title: "Categories",
};

type loaderData = { categories: Category[]; query: string };

interface Category {
    category_name: string;
    description: string;
    id: string;
    slug: string;
    sort_order: number;
    createdAt: string;
    sub_category: {
        description: string;
        id: string;
        parent_id: string;
        slug: string;
        sort_order: number;
        sub_category_name: string;
        createdAt: string;
    }[];
}

export async function loader({ request }: LoaderFunctionArgs) : Promise<loaderData> {
	const url = new URL(request.url);
	const q = url.searchParams.get("q")?.trim() ?? "";

	const ALL_KEY = "categories_all";
    const QUERY_KEY = q.length > 0 ? `categories_${q}` : ALL_KEY;

	const cachedExact = getCache(QUERY_KEY);
	if (cachedExact) {
		console.log(`cache hit for key "${QUERY_KEY}" 😀`);
		return { categories: cachedExact, query: q };
	}

	const { supabase } = createSupabaseServerClient(request);

    let sbQuery = supabase.from("category").select(`
        *,
        sub_category:sub_category(*)
        `);

    if (q.length > 0) {
            sbQuery = sbQuery.ilike("category_name", `%${q}%`);
    }

    const { data: categories, error } = await sbQuery;
    if (error) {
            throw new Response(error.message, { status: 500 });
    }

    setCache(QUERY_KEY, categories, 25 * 60 * 1000);
    return { categories, query: q };
}

export default function CategoriesPage({ loaderData: { categories, query } }: Route.ComponentProps) {
	console.log(categories);
    const navigation = useNavigation();
    const location = useLocation();

    const isFetchingThisRoute =
    navigation.state === "loading" &&
    navigation.location?.pathname === location.pathname;
    
    const categoryTableColumns: ColumnDef<Category, unknown>[] = [
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
                        <Copy
                            strokeWidth={1.65}
                            width={13}
                            className="self-center"
                        />
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
            header: () => "Created At"
        },
        {
			id: "actions",
			cell: ({ row }) => {
				const stdRow: Category = row.original;
                
				return (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="h-8 w-8 p-0 cursor-pointer"
								>
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									// onClick={() =>
									// 	handleDetailsClick(stdRow)
									// }
								>
									Update
								</DropdownMenuItem>
								<DropdownMenuItem
                                    variant="destructive"
									// onClick={() =>
									// 	handleDetailsClick(stdRow)
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

    const table = useReactTable({
        data: (categories as Category[]) ?? [],
        columns: categoryTableColumns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    });

	return (
		<div className="flex flex-1 flex-col gap-6">
			<div className="flex justify-between gap-3 flex-wrap">
				<h1 className="text-2xl font-semibold">Categories</h1>
				<Button size={"sm"} className="ml-auto">
					<PlusCircle className="h-4 w-4" />
					<span>Add Category</span>
				</Button>
			</div>
			<div className="rounded-md flex flex-col gap-4">
				<DataTableViewOptions table={table} disabled={isFetchingThisRoute} />
				{isFetchingThisRoute ? (
					<DataTableSkeleton NoOfSkeletonRows={4} columns={categoryTableColumns} />
				) : (
					<DataTable table={table} />
				)}
			</div>
		</div>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<Category>) {
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