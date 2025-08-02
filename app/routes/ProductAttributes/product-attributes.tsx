import { Link, LoaderFunctionArgs, Outlet, useLocation } from "react-router";
import { Route } from "./+types/product-attributes";
import { Button } from "~/components/ui/button";
import { ArrowRight, PlusCircle, Search, Settings2 } from "lucide-react";
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
import { toast } from "sonner";
import { useNavigation } from "react-router";
import type { HighLevelProductAttribute } from "~/types/attributes.d";
import { queryClient } from "~/lib/queryClient";
import { useEffect, useState } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { highLevelProductAttributesQuery } from "~/queries/product-attributes.q";
import { Input } from "~/components/ui/input";
import { useForm } from "react-hook-form";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const data = await queryClient.fetchQuery(highLevelProductAttributesQuery({ request }));

	return {
		data,
	};
};

export default function ProductsAttributesPage({ loaderData: { data } }: Route.ComponentProps) {
	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
			id: "attribute_type",
			enableHiding: false,
			accessorKey: "attribute_type",
			cell: (info: any) => {
				const val = info.row.original.attribute_type;
				return val.charAt(0).toUpperCase() + String(val).slice(1);
			},
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
					<div className="flex items-center justify-center">
						<Link to={`${rowData.attribute_type}/values`}>
							<Button variant="outline" className=" cursor-pointer">
								<span>View Values</span>
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: (data.product_attributes as HighLevelProductAttribute[]) ?? [],
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
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Product Attributes</h1>
						<Link to="create" viewTransition className="ml-auto">
							<Button size="sm" className="ml-auto">
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
						<DataTableSkeleton noOfSkeletons={4} columns={tableColumns} />
					) : (
						<DataTable table={table} total={data.product_attributes?.length ?? 0} />
					)}
				</div>
			</section>
			<Outlet />
		</>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelProductAttribute>) {
	const { register, handleSubmit } = useForm({
		defaultValues: {
			attribute_type: (table.getColumn("attribute_type")?.getFilterValue() as string) ?? "",
		},
	});

	function onSubmit(data: { attribute_type: string }) {
		table.getColumn("attribute_type")?.setFilterValue(data.attribute_type);
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
							{...register("attribute_type")}
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
