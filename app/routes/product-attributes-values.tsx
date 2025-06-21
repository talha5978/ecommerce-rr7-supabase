import { Await, Form, Link, LoaderFunctionArgs, Outlet, useFetcher, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Route } from "./+types/product-attributes-values";
import { Button } from "~/components/ui/button";
import { Badge, CirclePlus, Copy, Dot, Filter, MoreHorizontal, PlusCircle, Search, Settings2 } from "lucide-react";
import { DataTable, DataTableSkeleton, DataTableViewOptionsProps } from "~/components/Table/data-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ColumnDef, getCoreRowModel, Row, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { GetFormattedDate } from "~/lib/utils";
import { subCategoriesQuery } from "~/queries/categories.q";
import { queryClient } from "~/lib/queryClient";
import { defaults } from "~/constants";
import BackButton from "~/components/Nav/BackButton";
import TableId from "~/components/Table/TableId";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { productAttributesByTypeQuery } from "~/queries/product-attributes.q";
import { AttributeType, ProductAttribute } from "~/types/product-attributes";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    const attributeType = (params.attributeType as AttributeType);
    if (!attributeType) {
        throw new Response("Attribute type is required", { status: 400 });
    }
    
    const data = await queryClient.fetchQuery(
		productAttributesByTypeQuery({ request, attribute_type: attributeType })
	);

    return {
        data,
    };
};

export default function ProductAttributeValuesPage({
    loaderData: { data }, params
}: Route.ComponentProps) {
    
    if (data.product_attributes == null) {
        throw new Response(`Error fetching ${params.attributeType} attributes`, { status: 404 });
    }
    // console.log(data);
    
    const navigation = useNavigation();
    const location = useLocation();

    const isFetchingThisRoute =
        navigation.state === "loading" && navigation.location?.pathname === location.pathname;

    const tableColumns: ColumnDef<ProductAttribute, unknown>[] = [
        {
            id: "Attribute ID",
            enableHiding: false,
            accessorKey: "id",
            cell: (info: any) => <TableId id={info.row.original.id} />,
            header: () => "Attribute ID",
        },
		{
			id: "Attribute Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info: any) => info.row.original.name,
			header: () => "Attribute Name",
		},
		{
			id: "Attribute Value",
			accessorKey: "value",
			cell: (info: any) => {
                const val = info.row.original.value;
                const isColor = params.attributeType == "color";
                
                return (
                    <div className="flex gap-2 items-center">
                        {isColor && <Dot className={`text-[${val}]  rounded-full`} color={val} size={48} strokeWidth={7} />}
                        <span>{val}</span>
                    </div>
                )
            },
			header: () => "Attribute Value",
		},
        {
            id: "actions",
            cell: ({ row }) => {
                const rowData: ProductAttribute = row.original;

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


    const table = useReactTable({
        data: (data.product_attributes as ProductAttribute[]) ?? [],
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
            <div className="flex flex-1 flex-col gap-6">
                <div>
                    <div className="flex justify-between gap-3 flex-wrap">
                        <div className="flex gap-4 items-center">
                            <BackButton href={"/product-attributes"} />
                            <h1 className="text-2xl font-semibold">{params.attributeType?.toUpperCase()}</h1>
                        </div>
                        <Link to="create" viewTransition className="ml-auto">
                            <Button size={"sm"} className="ml-auto">
                                <PlusCircle width={18} />
                                <span>Add Attribute</span>
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="rounded-md flex flex-col gap-4">
                    <DataTableViewOptions table={table} disabled={isFetchingThisRoute} />
                    {isFetchingThisRoute ? (
                        <DataTableSkeleton noOfSkeletons={8} columns={tableColumns} />
                    ) : (
                        <DataTable
                            table={table}
                            total={data.total ?? 0}
                        />
                    )}
                </div>
            </div>
            <Outlet />
        </>
    );
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<ProductAttribute>) {
    const [searchParams] = useSearchParams();
    let currentQuery = searchParams.get("q") ?? "";
    
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