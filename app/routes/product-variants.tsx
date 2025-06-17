import { Form, Link, LoaderFunctionArgs, useLocation, useNavigate, useSearchParams } from "react-router";
import { Route } from "./+types/product-variants";
import { Button } from "~/components/ui/button";
import { MoreHorizontal, PlusCircle, Search, Settings2 } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/Table/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { GetFormattedDate } from "~/lib/utils";
import type { FullSubCategoryRow } from "~/types/category.d";
import { queryClient } from "~/lib/queryClient";
import { defaults, SUPABASE_IMAGE_BUCKET_PATH } from "~/constants";
import BackButton from "~/components/Nav/BackButton";
import TableId from "~/components/Table/TableId";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { productVariantsQuery } from "~/queries/products.q";
import { ProductVariantRow } from "~/types/products";
import StatusBadge from "~/components/status-badge";
import { Skeleton } from "~/components/ui/skeleton";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const productId = (params.productId as string) || "";
	if (!productId || productId == "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE,
		defaultPageSize: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(
		productVariantsQuery({request, productId, q, pageIndex, pageSize})
	);

	return {
		data,
		productId,
		query: q,
		pageIndex,
		pageSize,
	};
};

export default function ProductVariantsPage({
	loaderData: { data, productId, query, pageIndex, pageSize },
}: Route.ComponentProps) {
	if (data.product_variants == null) {
		throw new Response("Error fetching variants", { status: 404 });
	}
	// console.log(data);
	
	const navigation = useNavigation();
	const location = useLocation();

	const navigate = useNavigate();
	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	function handleUpdateNaviateClick(id: string, parent_id: string) {
		return navigate(`/categories/${parent_id}/sub-categories/${id}/update`);
	}

	const tableColumns: ColumnDef<ProductVariantRow, unknown>[] = [
		{
			id: "Sr. No.",
			enableHiding: false,
			accessorKey: "id",
			cell: (info: any) => `(${info.row.index + 1})`,
			header: () => "Sr. No.",
		},
		{
			id: "Cover",
			accessorKey: "images",
			cell: (info: any) => {
				const image = info.row.original.images[0];

				if (image) {
					return (
						<img
							src={`${SUPABASE_IMAGE_BUCKET_PATH}/${image}`}
							alt={info.row.original.name}
							className="h-16 w-16 rounded-sm object-cover shadow-2xl"
							loading="lazy"
						/>
					);
				} else {
					return <Skeleton className="h-16 w-16 rounded-sm" />;
				}
			},
			header: () => "Cover",
		},
		{
			id: "SKU",
			enableHiding: false,
			accessorKey: "sku",
			cell: (info: any) => info.row.original.sku,
			header: () => "SKU",
		},
		{
			id: "Status",
			accessorKey: "status",
			cell: (info: any) => {
				return (
					<StatusBadge variant={info.row.original.status ? "success" : "destructive"}>
						{info.row.original.status ? "Active" : "Inactive"}
					</StatusBadge>
				);
			},
			header: () => "Status",
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
			id: "actions",
			cell: ({ row }) => {
				// const rowData: FullSubCategoryRow = row.original;

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
								// 	handleUpdateNaviateClick(rowData.id, rowData.parent_id)
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

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPageSize: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE,
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
			}
		}
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<ProductVariantRow>) {
    const [searchParams] = useSearchParams();
    let currentQuery = searchParams.get("q") ?? "";
	
    return (
		<div className="w-full flex justify-between gap-4">
			<div>
				<Form method="get">
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