import { Form, Link, LoaderFunctionArgs, Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import { Route } from "./+types/products";
import { Button } from "~/components/ui/button";
import { MoreHorizontal, PlusCircle, Search, Settings2 } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/Table/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { useEffect } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { productsQuery } from "~/queries/products.q";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { defaults, SUPABASE_IMAGE_BUCKET_PATH } from "~/constants";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import type { HighLevelProduct } from "~/types/products";
import { GetFormattedDate } from "~/lib/utils";
import StatusBadge from "~/components/status-badge";
import { Skeleton } from "~/components/ui/skeleton";
import ImageViewer from "~/components/ImageViewer/image-viewer";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_PRODUCTS_PAGE,
		defaultPageSize: defaults.DEFAULT_PRODUCTS_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(productsQuery({ request, q, pageIndex, pageSize }));

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
	};
};

export default function ProductsMainPage({
	loaderData: { data, query, pageIndex, pageSize },
}: Route.ComponentProps) {

	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const [searchParams] = useSearchParams()
	
	useEffect(() => {
		if (data.error != null && data.error.message) {
			console.log(data);
			
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	useEffect(() => {
		if (data.error != null && data.error.message) {
			console.log(data);
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	const tableColumns: ColumnDef<HighLevelProduct, unknown>[] = [
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
				return (
					<span className={`${len == 0 ? "text-destructive" : ""}`}>
						{len}
					</span>
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
							<Link to={`${rowData.id}/variants`} viewTransition prefetch="intent">
								<DropdownMenuItem>View Variants</DropdownMenuItem>
							</Link>
							<Link to={`${rowData.id}/variants/create`} viewTransition prefetch="intent">
								<DropdownMenuItem>Add Variant</DropdownMenuItem>
							</Link>
							<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
								<DropdownMenuItem>Update</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
	
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
                metaTitle="Products | Admin Panel"
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
								<span>Add Product</span>
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelProduct>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

    return (
		<div className="w-full flex justify-between gap-4">
			<div>
				<Form method="get" action="/products">
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