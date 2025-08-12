import { Form, Link, useLoaderData, useLocation, useSearchParams } from "react-router";
import { Route } from "./+types/coupons";
import { Button } from "~/components/ui/button";
import { ChevronRight, LayoutGrid, MoreHorizontal, PlusCircle, Search, TableOfContents } from "lucide-react";

import { useNavigation } from "react-router";
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { defaults } from "~/constants";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { CouponTypeOptions } from "~/utils/couponsConstants";
import type { CouponTypesOption } from "~/components/Coupons/coupons-comp";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	Table,
	useReactTable,
} from "@tanstack/react-table";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { queryClient } from "~/lib/queryClient";
import { highLevelCouponsQuery } from "~/queries/coupons.q";
import { toast } from "sonner";
import type { HighLevelCoupon } from "~/types/coupons";
import StatusBadge from "~/components/status-badge";
import { GetFormattedDate } from "~/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
	DataTable,
	DataTableSkeleton,
	TableColumnsToggle,
	TableRowSelector,
	type DataTableViewOptionsProps,
} from "~/components/Table/data-table";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CouponCard, CouponCardSkeleton, CreateNewCouponCard } from "~/components/Coupons/CouponCard";
import { motion } from "motion/react";
import CouponsPageContex, { CouponsPageCtx, type ViewMode } from "~/components/Coupons/MainCouponsContext";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const {
		q: searchQuery,
		pageIndex,
		pageSize,
	} = getPaginationQueryPayload({
		request,
		defaultPageNo: 1,
		defaultPageSize: defaults.DEFAULT_COUPONS_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(
		highLevelCouponsQuery({
			request,
			searchQuery,
			pageIndex,
			pageSize,
		}),
	);

	return {
		data,
		query: searchQuery,
		pageIndex,
		pageSize,
	};
};

export default function CouponsMainCtx({}: Route.ComponentProps) {
	return (
		<CouponsPageContex>
			<CouponsPage />
			<CouponTypeSelectDialog />
		</CouponsPageContex>
	);
}

const CouponsPage = memo(() => {
	const { data, query, pageIndex, pageSize } = useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = useMemo(() => Math.ceil(data.total / pageSize), [data.total, pageSize]);

	const isFetchingThisRoute = useMemo(
		() => navigation.state === "loading" && navigation.location?.pathname === location.pathname,
		[navigation.state, navigation.location?.pathname, location.pathname],
	);

	const { setCouponTypeDialogState } = useContext(CouponsPageCtx);

	const handleCreateClick = () => {
		setCouponTypeDialogState(true);
		return;
	};
	// console.log(data);

	useEffect(() => {
		if (data.error != null && data.error.message) {
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	const columns: ColumnDef<HighLevelCoupon>[] = [
		{
			id: "select",
			header: ({ table }) => TableRowSelector({ name: "id" }).header({ table }),
			cell: ({ row }) => TableRowSelector({ name: "id" }).cell({ row }),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "code",
			enableHiding: false,
			accessorKey: "code",
			cell: (info) => {
				return <p className="md:max-w-[35ch] max-w-[20ch] truncate">{info.row.original.code}</p>;
			},
			header: () => "Code",
		},
		{
			id: "Type",
			accessorKey: "coupon_type",
			cell: (info) =>
				info.row.original.coupon_type.charAt(0).toUpperCase() +
				info.row.original.coupon_type.slice(1),
			header: () => "Type",
		},
		{
			id: "Uses",
			accessorKey: "uses",
			cell: (info) => "N/A",
			header: () => "Uses",
		},
		{
			id: "Start",
			accessorKey: "start_timestamp",
			cell: (info) => format(info.row.original.start_timestamp, "PPP hh:mm a"),
			header: () => "Start",
		},
		{
			id: "End",
			accessorKey: "end_timestamp",
			cell: (info) => format(info.row.original.end_timestamp, "PPP hh:mm a"),
			header: () => "End",
		},
		{
			id: "Status",
			accessorKey: "status",
			cell: (info) => {
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
			cell: (info) => {
				const field = info.row.original.created_at;
				return field !== null ? GetFormattedDate(field) : null;
			},
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: HighLevelCoupon = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									navigator.clipboard.writeText(rowData.id.toString());
									toast.success("Coupon ID copied", {
										description: rowData.id,
									});
								}}
							>
								Copy ID
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<Link to={`${rowData.id}/variants`} viewTransition prefetch="intent">
								<DropdownMenuItem>See details</DropdownMenuItem>
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

	const tableColumns = useMemo(() => columns, []);

	const table = useReactTable({
		data: (data.coupons as HighLevelCoupon[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection: true,
		pageCount,
		state: {
			pagination: {
				pageIndex,
				pageSize,
			},
		},
	});

	console.log("Re rendered");

	return (
		<>
			<MetaDetails
				metaTitle={`Coupons ${query.trim() ? `| "${query.trim()}"` : ""} | Admin Panel`}
				metaDescription="Manage your store coupons here."
				metaKeywords="Coupons"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Coupons</h1>
						<Button size="sm" className="ml-auto" onClick={handleCreateClick}>
							<PlusCircle width={18} />
							<span>Create Coupon</span>
						</Button>
					</div>
					{query && (
						<div className="mt-3">
							<p>Showing records for "{query?.trim()}"</p>
						</div>
					)}
				</div>
				<div className="rounded-md flex flex-col gap-4">
					<PageOptions table={table} disabled={isFetchingThisRoute} />
					<CouponsArea table={table} columns={tableColumns} />
				</div>
			</section>
		</>
	);
});

const CouponsTable = memo(({ table }: { table: Table<HighLevelCoupon> }) => {
	const { data, pageSize } = useLoaderData<typeof loader>();

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: 1,
	});

	return (
		<DataTable
			table={table}
			onPageChange={onPageChange}
			onPageSizeChange={onPageSizeChange}
			pageSize={pageSize}
			total={data.total ?? 0}
		/>
	);
});

const CouponsGrid = memo(() => {
	const { data } = useLoaderData<typeof loader>();

	return (
		<motion.ul
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className="main-coupons-grid"
		>
			{data?.coupons?.map((coupon) => (
				<li key={coupon.id} className="main-coupons-grid-item">
					<CouponCard coupon={coupon} />
				</li>
			))}
			<li key={"create-new-coupon"} className="main-coupons-grid-item">
				<CreateNewCouponCard />
			</li>
		</motion.ul>
	);
});

const CouponsArea = memo(
	({ table, columns }: { table: Table<HighLevelCoupon>; columns: ColumnDef<HighLevelCoupon>[] }) => {
		const { view_mode } = useContext(CouponsPageCtx);
		console.log("Coupons area re rendered");

		const navigation = useNavigation();
		const location = useLocation();

		const isFetchingThisRoute = useMemo(
			() => navigation.state === "loading" && navigation.location?.pathname === location.pathname,
			[navigation.state, navigation.location?.pathname, location.pathname],
		);

		if (view_mode === "grid") {
			return isFetchingThisRoute ? <CouponCardSkeleton /> : <CouponsGrid />;
		} else {
			return isFetchingThisRoute ? (
				<DataTableSkeleton noOfSkeletons={4} columns={columns} />
			) : (
				<CouponsTable table={table} />
			);
		}
	},
);

const CouponTypeSelectDialog = memo(() => {
	const { isCouponTypeDialogOpen, setCouponTypeDialogState } = useContext(CouponsPageCtx);

	const onOpenChange = () => setCouponTypeDialogState(!isCouponTypeDialogOpen);
	const onCancel = () => setCouponTypeDialogState(false);

	return (
		<Dialog open={isCouponTypeDialogOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Select Coupon Type</DialogTitle>
					<DialogDescription>Select the type of the coupon you want to create.</DialogDescription>
				</DialogHeader>
				{CouponTypeOptions.map((option: CouponTypesOption) => (
					<Link key={option.value} to={`/coupons/create/${option.value}`}>
						<div className="px-4 py-4 hover:dark:bg-muted hover:bg-muted-dark cursor-pointer rounded-lg ease-in-out duration-150 transition-colors">
							<div className="flex items-center gap-4">
								{option.icon}
								<div className="flex flex-col flex-1">
									<p className="text-md">{option.label}</p>
									<p className="text-sm text-muted-foreground">{option.description}</p>
								</div>
								<ChevronRight className="h-5 w-5 text-muted-foreground" />
							</div>
						</div>
					</Link>
				))}
				<DialogFooter className="flex justify-end mt-4">
					<Button variant="outline" size={"sm"} onClick={onCancel}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});

const ViewModeChangeButtons = memo(() => {
	const { view_mode, setViewMode } = useContext(CouponsPageCtx);

	const onTabChange = useCallback(
		(value: ViewMode) => {
			setViewMode(value);
		},
		[setViewMode],
	);

	const options: { value: ViewMode; label: string; icon: React.ReactNode }[] = useMemo(() => {
		return [
			{
				value: "table",
				label: "Table",
				icon: <TableOfContents />,
			},
			{
				value: "grid",
				label: "Grid",
				icon: <LayoutGrid />,
			},
		];
	}, []);

	return (
		<Tabs value={view_mode} onValueChange={(value) => onTabChange(value as ViewMode)}>
			<TabsList className="h-8 light:bg-muted-dark *:cursor-pointer *:select-none *:dark:hover:bg-muted *:dark:text-secondary-foreground">
				{options.map((option) => (
					<TabsTrigger
						key={option.value}
						value={option.value}
						className="data-[state=active]:shadow-xs"
					>
						{option.icon}
						<span className="sr-only">{option.label}</span>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
});

function PageOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelCoupon>) {
	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("q") ?? "";

	return (
		<>
			<div className="w-full flex justify-between gap-4 items-center">
				<div>
					<Form method="get" action="/coupons">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search coupons"
								name="q"
								className="w-full pl-8"
								id="search"
								defaultValue={currentQuery.trim()}
								disabled={disabled}
							/>
						</div>
						{/* Invisible submit button: Enter in input triggers submit */}
						<Button type="submit" className="hidden">
							Search
						</Button>
					</Form>
				</div>
				<div className="flex gap-2 items-center">
					<ViewModeChangeButtons />
					<TableColumnsToggle table={table} />
				</div>
			</div>
			{/* <FiltersSheet open={filtersMenuOpen} setOpen={handleFiltersClick} /> */}
		</>
	);
}

// function FiltersSheet({ open, setOpen }: { open?: boolean; setOpen: (open: boolean) => void }) {
//     const [searchParams] = useSearchParams();
//     const navigate = useNavigate();
//     const location = useLocation();
//     const currentQuery = searchParams.get("q") || undefined;

//     const currentPageIndex = searchParams.get("page") || defaultPage;
//     const currentPageSize = searchParams.get("size") || defaultSize;

//     const loaderData = useLoaderData<typeof loader>();

//     const categories: CategoryListRow[] = loaderData.categories.categories as CategoryListRow[];
//     const navigation = useNavigation();
//     const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

//     type BoolVals = "true" | "false" | "null";
//     const createdFromParam = searchParams.get("createdFrom");
//     const createdToParam = searchParams.get("createdTo");

//     const form = useForm<ProductsFilterFormData>({
//         resolver: zodResolver(ProductFilterFormSchema),
//         defaultValues: {
//             q: currentQuery,
//             page: currentPageIndex,
//             size: currentPageSize,
//             status: (searchParams.get("status") as BoolVals) || "null",
//             is_featured: (searchParams.get("is_featured") as BoolVals) || "null",
//             category: searchParams.get("category")?.split(",") ?? [],
//             sub_category: searchParams.get("sub_category")?.split(",") ?? [],
//             free_shipping: (searchParams.get("free_shipping") as BoolVals) || "null",
//             createdAt:
//                 createdFromParam && createdToParam
//                     ? {
//                             from: new Date(createdFromParam),
//                             to: new Date(createdToParam),
//                     }
//                     : null
//         },
//     });

//     const { handleSubmit, control, setValue, reset } = form;

//     const selectedCategories = useWatch({ control, name: "category" }) || [];
//     const selectedSubCategories = useWatch({ control, name: "sub_category" }) || [];

//     const validSubCategoryIds = useMemo(() => {
//         return categories
//             .filter((cat) => selectedCategories.includes(cat.id))
//             .flatMap((cat) => cat.sub_category.map((sc) => sc.id));
//     }, [categories, selectedCategories]);

//     useEffect(() => {
//         const filtered = selectedSubCategories.filter((id) => validSubCategoryIds.includes(id));
//         if (
//             filtered.length !== selectedSubCategories.length ||
//             filtered.some((id, i) => id !== selectedSubCategories[i])
//         ) {
//             setValue("sub_category", filtered);
//         }
//     }, [selectedSubCategories, validSubCategoryIds, setValue]);

//     // Handle form submission
//     const onFormSubmit = (values: ProductsFilterFormData) => {
//         console.log(values);
//         // return;
//         const params = new URLSearchParams();

//         // Append only explicitly set or changed values

//         if (values.q) params.set("q", values.q);
//         if (values.status && values.status !== "null") params.set("status", values.status);
//         if (values.is_featured && values.is_featured !== "null"){
//             params.set("is_featured", values.is_featured);
//         }
//         if (values.category && Array.isArray(values.category) && values.category.length > 0){
//             params.set("category", values.category!.join(","));
//         }
//         if (values.sub_category && Array.isArray(values.sub_category) && values.sub_category!.length > 0) {
//             params.set("sub_category", values.sub_category!.join(","));
//         }
//         if (values.free_shipping && values.free_shipping !== "null")
//             params.set("free_shipping", values.free_shipping);

//         if (values.createdAt) {
//             params.set("createdFrom", values.createdAt.from.toISOString());
//             params.set("createdTo", values.createdAt.to.toISOString());
//         } else {
//             params.delete("createdFrom");
//             params.delete("createdTo");
//         }

//         if (values.sortBy) params.set("sortBy", values.sortBy);
//         if (values.sortType) params.set("sortType", values.sortType);

//         // Only append pageIndex and pageSize if they differ from current values or are explicitly set
//         if (currentPageIndex !== defaultPage) {
//             params.set("page", String(currentPageIndex));
//         }
//         if (currentPageSize !== defaultSize) {
//             params.set("size", String(currentPageSize));
//         }

//         // preserve kro unko agr pehly se apply keye hoe hain
//         const sortBy = searchParams.get("sortBy");
//         const sortType = searchParams.get("sortType");
//         if (sortBy) params.set("sortBy", sortBy);
//         if (sortType) params.set("sortType", sortType);

//         navigate(`?${params.toString()}`);
//     };

//     function handleReset() {
//         reset(); // Resets the form state
//         navigate(getProductsResetFiltersUrl({
//             defaultPage,
//             defaultSize,
//             pathname: location.pathname,
//             search: location.search
//         }), { replace: true });
//         setOpen(false);
//     }

//     return (
//         <Sheet open={!!open} onOpenChange={setOpen}>
//             <SheetContent>
//                 <SheetHeader>
//                     <SheetTitle>Product Filters & Sort</SheetTitle>
//                     <SheetDescription>Sort and filter products by their fields and values</SheetDescription>
//                 </SheetHeader>
//                 <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 flex flex-col p-4 h-full">
//                     <ShadcnForm {...form}>
//                         <div className="flex justify-between gap-2 items-center">
//                             <h2 className="text-xl mt-0 font-bold">Filter</h2>
//                             <Button variant="link" onClick={handleReset}>
//                                 Reset All
//                             </Button>
//                         </div>
//                         {/* Status Filter */}
//                         <FormField
//                             control={control}
//                             name="status"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Status</FormLabel>
//                                     <FormControl>
//                                         <div className="*:w-full">
//                                             <Select value={field.value} onValueChange={field.onChange}>
//                                                 <SelectTrigger>
//                                                     <SelectValue placeholder="Select status" />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     <SelectItem value="null">Select status</SelectItem>
//                                                     <SelectItem value="true">Active</SelectItem>
//                                                     <SelectItem value="false">Inactive</SelectItem>
//                                                 </SelectContent>
//                                             </Select>
//                                         </div>
//                                     </FormControl>
//                                 </FormItem>
//                             )}
//                         />

//                         {/* Featured Filter */}
//                         <FormField
//                             control={control}
//                             name="is_featured"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Featured</FormLabel>
//                                     <FormControl>
//                                         <div className="*:w-full">
//                                             <Select value={field.value} onValueChange={field.onChange}>
//                                                 <SelectTrigger>
//                                                     <SelectValue placeholder="Select featured status" />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     <SelectItem value="null">
//                                                         Select featured status
//                                                     </SelectItem>
//                                                     <SelectItem value="true">Active</SelectItem>
//                                                     <SelectItem value="false">Inactive</SelectItem>
//                                                 </SelectContent>
//                                             </Select>
//                                         </div>
//                                     </FormControl>
//                                 </FormItem>
//                             )}
//                         />

//                         {/* Category Tree */}
//                         <FormItem>
//                             <FormLabel>Categories</FormLabel>
//                             <FormControl className="mt-1">
//                                 <div className="max-h-64 overflow-y-auto space-y-2">
//                                     {categories.map((cat) => {
//                                         const subIds = cat.sub_category.map((sc) => sc.id);
//                                         const childChecked = subIds.map((id) =>
//                                             selectedSubCategories.includes(id)
//                                         );
//                                         const allChecked = childChecked.every(Boolean);
//                                         const noneChecked = childChecked.every((c) => !c);
//                                         const indeterminate = !allChecked && !noneChecked;

//                                         return (
//                                             <details
//                                                 key={cat.id}
//                                                 className="rounded"
//                                                 open={allChecked || indeterminate}
//                                             >
//                                                 <summary className="flex items-center gap-2 cursor-pointer list-none hover:underline underline-offset-4">
//                                                     <Checkbox
//                                                         id={`cat-${cat.id}`}
//                                                         checked={
//                                                             allChecked
//                                                                 ? true
//                                                                 : indeterminate
//                                                                 ? "indeterminate"
//                                                                 : false
//                                                         }
//                                                         onCheckedChange={(checked) => {
//                                                             const newSubs = new Set(selectedSubCategories);
//                                                             subIds.forEach((id) =>
//                                                                 checked ? newSubs.add(id) : newSubs.delete(id)
//                                                             );

//                                                             const newCats = new Set(selectedCategories);
//                                                             checked
//                                                                 ? newCats.add(cat.id)
//                                                                 : newCats.delete(cat.id);

//                                                             setValue("sub_category", Array.from(newSubs));
//                                                             setValue("category", Array.from(newCats));
//                                                         }}
//                                                     />
//                                                     <Label htmlFor={`cat-${cat.id}`} className="font-medium text-sm cursor-pointer">
//                                                         {cat.category_name}
//                                                     </Label>
//                                                 </summary>

//                                                 <div className="pl-4 m-2 mt-2 space-y-1 border-sidebar-border border-l">
//                                                     {cat.sub_category.map((sub) => (
//                                                         <div key={sub.id} className="flex items-center gap-2 hover:underline underline-offset-4">
//                                                             <Checkbox
//                                                                 id={`subcat-${sub.id}`}
//                                                                 checked={selectedSubCategories.includes(
//                                                                     sub.id
//                                                                 )}
//                                                                 onCheckedChange={(checked) => {
//                                                                     const newSubs = new Set(
//                                                                         selectedSubCategories
//                                                                     );
//                                                                     checked
//                                                                         ? newSubs.add(sub.id)
//                                                                         : newSubs.delete(sub.id);

//                                                                     // if any child remains, keep parent checked
//                                                                     const newCats = new Set(
//                                                                         selectedCategories
//                                                                     );
//                                                                     const stillAny = subIds.some((id) =>
//                                                                         newSubs.has(id)
//                                                                     );
//                                                                     stillAny
//                                                                         ? newCats.add(cat.id)
//                                                                         : newCats.delete(cat.id);

//                                                                     setValue(
//                                                                         "sub_category",
//                                                                         Array.from(newSubs)
//                                                                     );
//                                                                     setValue("category", Array.from(newCats));
//                                                                 }}
//                                                             />
//                                                             <Label htmlFor={`subcat-${sub.id}`} className="font-medium text-sm cursor-pointer">
//                                                                 {sub.sub_category_name}
//                                                             </Label>
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             </details>
//                                         );
//                                     })}
//                                 </div>
//                             </FormControl>
//                         </FormItem>

//                         {/* Free Shipping Filter */}
//                         <FormField
//                             control={control}
//                             name="free_shipping"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Free Shipping</FormLabel>
//                                     <FormControl>
//                                         <div className="*:w-full">
//                                             <Select value={field.value} onValueChange={field.onChange}>
//                                                 <SelectTrigger>
//                                                     <SelectValue placeholder="Select free shipping" />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     <SelectItem value="null">Select free shipping</SelectItem>
//                                                     <SelectItem value="true">Available</SelectItem>
//                                                     <SelectItem value="false">Not Available</SelectItem>
//                                                 </SelectContent>
//                                             </Select>
//                                         </div>
//                                     </FormControl>
//                                 </FormItem>
//                             )}
//                         />

//                         {/* Date Created Filter */}
//                         <Controller
//                             control={control}
//                             name="createdAt"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Date Created</FormLabel>
//                                     <FormControl>
//                                         <DateRangePicker
//                                             className="w-full"
//                                             value={field.value ?? null}
//                                             onDateRangeChange={field.onChange}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />

//                         {/* Form Actions */}
//                         <SheetFooter className="!self-end px-0 w-full">
//                             <Button type="submit" disabled={isSubmitting}>
//                                 {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
//                                 Apply
//                             </Button>
//                             <SheetClose asChild>
//                                 <Button variant="outline">Close</Button>
//                             </SheetClose>
//                         </SheetFooter>
//                     </ShadcnForm>
//                 </form>
//             </SheetContent>
//         </Sheet>
//     );
// }
