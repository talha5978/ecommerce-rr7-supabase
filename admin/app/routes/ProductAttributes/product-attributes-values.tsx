import { Link, LoaderFunctionArgs, Outlet, useLocation } from "react-router";
import { Route } from "./+types/product-attributes-values";
import { Button } from "~/components/ui/button";
import { Dot, MoreHorizontal, PlusCircle, Search, Settings2 } from "lucide-react";
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
import {
	ColumnDef,
	ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useNavigation } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import BackButton from "~/components/Nav/BackButton";
import TableId from "~/components/Table/TableId";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { productAttributesByTypeQuery } from "~/queries/product-attributes.q";
import type { AttributeType, ProductAttribute } from "@ecom/shared/types/attributes";
import { useForm } from "react-hook-form";
import { Input } from "~/components/ui/input";
import { useState } from "react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const attributeType = params.attributeType as AttributeType;
	if (!attributeType) {
		throw new Response("Attribute type is required", { status: 400 });
	}

	const data = await queryClient.fetchQuery(
		productAttributesByTypeQuery({ request, attribute_type: attributeType }),
	);

	return {
		data,
	};
};

export default function ProductAttributeValuesPage({ loaderData: { data }, params }: Route.ComponentProps) {
	if (data.product_attributes == null) {
		throw new Response(`Error fetching ${params.attributeType} attributes`, { status: 404 });
	}
	// console.log(data);

	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const tableColumns: ColumnDef<ProductAttribute, unknown>[] = [
		{
			id: "Attribute ID",
			enableHiding: false,
			accessorKey: "id",
			cell: (info: any) => <TableId id={info.row.original.id} message="Attribute ID copied" />,
			header: () => "Attribute ID",
		},
		{
			id: "attribute_name",
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
						{isColor && (
							<Dot
								className={`text-[${val}]  rounded-full`}
								color={val}
								size={48}
								strokeWidth={7}
							/>
						)}
						<span>{val}</span>
					</div>
				);
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
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			columnFilters,
		},
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
							<h1 className="text-2xl font-semibold">
								{params.attributeType?.charAt(0).toUpperCase() +
									String(params.attributeType).slice(1)}
							</h1>
						</div>
						<Link to="create" viewTransition className="ml-auto">
							<Button size={"sm"} className="ml-auto">
								<PlusCircle width={18} />
								<span>Add Attribute</span>
							</Button>
						</Link>
					</div>
					{columnFilters[0] && (
						<div className="mt-3">
							<p>Showing records for "{(columnFilters[0]?.value as string)?.trim()}"</p>
						</div>
					)}
				</div>
				<div className="rounded-md flex flex-col gap-4">
					<DataTableViewOptions table={table} disabled={isFetchingThisRoute} />
					{isFetchingThisRoute ? (
						<DataTableSkeleton noOfSkeletons={8} columns={tableColumns} />
					) : (
						<DataTable table={table} total={data.total ?? 0} />
					)}
				</div>
			</div>
			<Outlet />
		</>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<ProductAttribute>) {
	const { register, handleSubmit } = useForm({
		defaultValues: {
			attribute_name: (table.getColumn("attribute_name")?.getFilterValue() as string) ?? "",
		},
	});

	function onSubmit(data: { attribute_name: string }) {
		table.getColumn("attribute_name")?.setFilterValue(data.attribute_name);
	}
	return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search attributes"
							className="w-full pl-8"
							id="search"
							disabled={disabled}
							{...register("attribute_name")}
						/>
					</div>
					<Button type="submit" className="hidden">
						Search
					</Button>
				</form>
			</div>
			<TableColumnsToggle table={table} />
		</div>
	);
}
