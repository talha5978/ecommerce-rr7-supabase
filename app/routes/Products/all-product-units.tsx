import {
	Await,
	Form,
	Link,
	LoaderFunctionArgs,
	useFetcher,
	useLoaderData,
	useLocation,
	useSearchParams,
} from "react-router";
import { Route } from "./+types/all-product-units";
import { Button } from "~/components/ui/button";
import { ChevronsUpDown, Loader2, MoreHorizontal, PlusCircle, Search, Settings2 } from "lucide-react";
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
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { defaults, SUPABASE_IMAGE_BUCKET_PATH } from "~/constants";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { allProductUnitsQuery } from "~/queries/product-variants.q";
import type { ProductVariantRow } from "~/types/product-variants";
import StatusBadge from "~/components/status-badge";
import { Skeleton } from "~/components/ui/skeleton";
import ImageViewer from "~/components/ImageViewer/image-viewer";
import { cn, GetFormattedDate } from "~/lib/utils";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import CopyField from "~/components/Table/TableId";
import handleDuplicateClick from "~/utils/handleDuplicateProrductVaraint";
import { productNamesQuery } from "~/queries/products.q";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Form as ShadcnUiForm,
} from "~/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import { z } from "zod";
import { useNavigate } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE,
		defaultPageSize: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(allProductUnitsQuery({ request, q, pageIndex, pageSize }));

	const productsList = queryClient.fetchQuery(productNamesQuery({ request }));

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
		productsList,
	};
};

export default function ProductVariantsPage({
	loaderData: { data, query, pageIndex, pageSize },
}: Route.ComponentProps) {
	if (data.product_variants == null) {
		throw new Response("Error fetching variants", { status: 404 });
	}
	// console.log(data);

	const navigation = useNavigation();
	const location = useLocation();

	const [isProductDialogOpen, setProductDialogState] = useState<boolean>(false);

	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const fetcher = useFetcher();

	// Handle fetcher state for toasts
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Variant Duplicated successfully");
				toast.warning(
					"Variant is using the same images as the original variant, please change the images.",
				);
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			} else {
				toast.error("Something went wrong");
			}
		}
	}, [fetcher.data, queryClient]);

	const tableColumns: ColumnDef<ProductVariantRow, unknown>[] = [
		{
			id: "Sr. No.",
			enableHiding: false,
			accessorKey: "id",
			cell: (info: any) => `(${info.row.index + 1})`,
			header: () => "Sr. No.",
		},
		{
			id: "Image",
			accessorKey: "images",
			cell: (info: any) => {
				const rowImg = info.row.original.images[0];
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
					);
				} else {
					return <Skeleton className="h-16 w-16 rounded-sm" />;
				}
			},
			header: () => "Image",
		},
		{
			id: "SKU",
			enableHiding: false,
			accessorKey: "sku",
			cell: (info: any) => <CopyField id={info.row.original.sku} message="SKU copied" />,
			header: () => "SKU",
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
			id: "Original Price",
			accessorKey: "sale_price",
			cell: (info: any) => info.row.original.original_price,
			header: () => "Original Price",
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
			id: "Created At",
			accessorKey: "createdAt",
			cell: (info: any) => GetFormattedDate(info.row.original.createdAt),
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: ProductVariantRow = row.original;

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
									disabled={fetcher.state === "submitting"}
									onClick={() => handleDuplicateClick({ fetcher, input: rowData })}
								>
									{fetcher.state === "submitting" ? (
										<Loader2 className="animate-spin" color="white" />
									) : null}
									Create Duplicate
								</DropdownMenuItem>
								<Link to={`/products/${rowData.product_id}/variants/${rowData.id}/update`}>
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
		defaultPage: defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE,
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
			},
		},
	});

	const handleCreateNewUnitClick = () => setProductDialogState(true);

	return (
		<>
			<MetaDetails
				metaTitle="All Product Units | Admin Panel"
				metaDescription="Manage all product units here."
			/>
			<div className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">All Units</h1>
						<Button size={"sm"} className="ml-auto" onClick={handleCreateNewUnitClick}>
							<PlusCircle width={18} />
							<span>Create Variant</span>
						</Button>
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

			{isProductDialogOpen && (
				<ProductsDialog open={isProductDialogOpen} setOpen={setProductDialogState} />
			)}
		</>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<ProductVariantRow>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<Form method="get">
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search SKU"
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

export function ProductsDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
	const { productsList } = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	type CreateProductUnitForm = { product: string };

	const form = useForm<CreateProductUnitForm>({
		resolver: zodResolver(z.object({ product: z.string().min(1, "Select a product") })),
		defaultValues: { product: "" },
	});

	const { control, handleSubmit, formState } = form;

	function onFormSubmit(values: CreateProductUnitForm) {
		if (!values.product) {
			toast.error("Please select a product.");
			return;
		}
		// console.log("Selected product ID:", values.product);
		setOpen(false);
		return navigate(`/products/${values.product}/variants/create`);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Select Product</DialogTitle>
					<DialogDescription>Select a product you want to create a variant for.</DialogDescription>
				</DialogHeader>
				{/* TODO: CREATE A fallback for the products dialog suspense */}
				<Suspense fallback={<div className="text-lg text-red-700">Loading...</div>}>
					<Await resolve={productsList}>
						{({ products }) => (
							<form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-6">
								<ShadcnUiForm {...form}>
									<Controller
										name="product"
										control={control}
										render={({ field }) => {
											const selected = products?.find((p) => p.id === field.value);
											return (
												<FormField
													control={control}
													name="product"
													render={() => (
														<FormItem className="flex flex-col">
															<FormLabel>Product</FormLabel>
															<Popover>
																<PopoverTrigger asChild>
																	<FormControl>
																		<Button
																			variant="outline"
																			role="combobox"
																			className={cn(
																				"w-full justify-between",
																				!selected &&
																					"text-muted-foreground",
																			)}
																		>
																			{selected
																				? selected.name
																				: "Select a product"}
																			<ChevronsUpDown className="opacity-50" />
																		</Button>
																	</FormControl>
																</PopoverTrigger>
																<PopoverContent
																	align="start"
																	className="p-0 w-[var(--radix-popover-trigger-width)]"
																>
																	<Command>
																		<CommandInput placeholder="Search products" />
																		<CommandList>
																			<CommandEmpty>
																				No products found.
																			</CommandEmpty>
																			<CommandGroup>
																				{products?.map((prod) => (
																					<CommandItem
																						key={prod.id}
																						value={prod.name} // ← filter by name
																						onSelect={(value) => {
																							// find the matching ID, then set it
																							const match =
																								products.find(
																									(p) =>
																										p.name ===
																										value,
																								);
																							if (match)
																								field.onChange(
																									match.id,
																								);
																						}}
																					>
																						{prod.name}
																					</CommandItem>
																				))}
																			</CommandGroup>
																		</CommandList>
																	</Command>
																</PopoverContent>
															</Popover>
															<FormMessage />
														</FormItem>
													)}
												/>
											);
										}}
									/>

									<div className="flex gap-2 justify-end">
										<DialogClose asChild>
											<Button variant="outline">Close</Button>
										</DialogClose>
										<Button type="submit" disabled={!formState.isValid}>
											Proceed
										</Button>
									</div>
								</ShadcnUiForm>
							</form>
						)}
					</Await>
				</Suspense>
			</DialogContent>
		</Dialog>
	);
}
