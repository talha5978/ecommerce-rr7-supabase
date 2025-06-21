import { Link, LoaderFunctionArgs, Outlet, useLocation, useNavigate } from "react-router";
import { Route } from "./+types/product-attributes";
import { Button } from "~/components/ui/button";
import { ArrowRight, PlusCircle, Settings2 } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/Table/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { useNavigation } from "react-router";
import type { HighLevelProductAttribute } from "~/types/product-attributes.d";
import { queryClient } from "~/lib/queryClient";
import { useEffect } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { highLevelProductAttributesQuery } from "~/queries/product-attributes.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const data = await queryClient.fetchQuery(highLevelProductAttributesQuery({ request }));

	return {
		data
	};
};

export default function ProductsAttributesPage({
	loaderData: { data },
}: Route.ComponentProps) {
	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	useEffect(() => {
		if (data.error != null && data.error.message) {
			console.log(data);
			
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	const tableColumns: ColumnDef<HighLevelProductAttribute, unknown>[] = [
		{
			id: "Sr. No.",
			enableHiding: false,
			accessorKey: "id",
			cell: (info: any) => `(${info.row.index + 1})`,
			header: () => "Sr. No.",
		},
		{
			id: "Attribute Type",
			enableHiding: false,
			accessorKey: "attribute_type",
			cell: (info: any) => info.row.original.attribute_type.toUpperCase(),
			header: () => "Attribute Type",
		},
		{
			id: "Values Count",
			accessorKey: "values_count",
			cell: (info: any) => {
				const len = info.row.original.values_count ?? 0;
				return <span className={`${len == 0 ? "text-destructive" : ""}`}>{len}</span>;
			},
			header: () => "Values Count",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: HighLevelProductAttribute = row.original;

				return (
					<Link to={`${rowData.attribute_type}/values`}>
						<Button variant="outline" className=" cursor-pointer">
							<span>View Values</span>
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
				);
			},
		},
	];

	const table = useReactTable({
		data: (data.product_attributes as HighLevelProductAttribute[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
	});
	
	return (
		<>
			<MetaDetails
                metaTitle="Product Attribute | Admin Panel"
                metaDescription="Manage your product attributes here."
                metaKeywords="Product Attributes, Attributes"
            />
			<section className="flex flex-1 flex-col gap-6">
				<div className="flex justify-between gap-3 flex-wrap">
					<h1 className="text-2xl font-semibold">Product Attributes</h1>
					<Link to="create" viewTransition className="ml-auto">
						<Button size="sm" className="ml-auto">
							<PlusCircle width={18} />
							<span>Add Attribute</span>
						</Button>
					</Link>
				</div>
				<div className="rounded-md flex flex-col gap-4">
					<DataTableViewOptions table={table} disabled={isFetchingThisRoute} />
					{isFetchingThisRoute ? (
						<DataTableSkeleton noOfSkeletons={4} columns={tableColumns} />
					) : (
						<DataTable
							table={table}
							total={data.product_attributes?.length ?? 0}
						/>
					)}
				</div>
			</section>
			<Outlet />
		</>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelProductAttribute>) {
    return (
        <div className="w-full flex justify-end">
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