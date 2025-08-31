import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	Table,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { ChevronRight, LayoutGrid, MoreHorizontal, PlusCircle, Search, TableOfContents } from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	Form,
	Link,
	useLoaderData,
	useLocation,
	useNavigation,
	useParams,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { CouponCard, CouponCardSkeleton, CreateNewCouponCard } from "~/components/Coupons/CouponCard";
import CouponsPageContex, { CouponsPageCtx, type ViewMode } from "~/components/Coupons/MainCouponsContext";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import StatusBadge from "~/components/status-badge";
import {
	DataTable,
	DataTableSkeleton,
	TableColumnsToggle,
	TableRowSelector,
} from "~/components/Table/data-table";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { highLevelCouponsQuery } from "~/queries/coupons.q";
import { CouponTypeOptions, getFullDateTimeFormat } from "~/utils/couponsConstants";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { Route } from "./+types/coupons";
import { defaults } from "@ecom/shared/constants/constants";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import type { GetHighLevelCouponsResp, HighLevelCoupon } from "@ecom/shared/types/coupons";
import { GetFormattedDate } from "@ecom/shared/lib/utils";
import type { CouponTypesOption } from "@ecom/shared/types/coupons-comp";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import { protectLoader } from "~/utils/routeGuards";
import { Permission } from "@ecom/shared/permissions/permissions.enum";

const SELECTED_COUPON_DETAILS_TAG = "couponId" as const;

type LoaderReturn = {
	data: GetHighLevelCouponsResp;
	query: string;
	pageIndex: number;
	pageSize: number;
};

export const loader = protectLoader<LoaderReturn>({
	permissions: Permission.MANAGE_COUPONS,
})(async ({ request }: Route.LoaderArgs) => {
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
		highLevelCouponsQuery({ request, searchQuery, pageIndex, pageSize }),
	);

	return {
		data,
		query: searchQuery,
		pageIndex,
		pageSize,
	};
});

export default function CouponsMainCtx({}: Route.ComponentProps) {
	return (
		<CouponsPageContex>
			<CouponsPage />
			<CouponTypeSelectDialog />
		</CouponsPageContex>
	);
}

const getRouteFetchingState = () => {
	const navigation = useNavigation();
	const location = useLocation();
	const params = useParams();

	const isFetchingThisRoute = useMemo(
		() =>
			navigation.state === "loading" &&
			navigation.location?.pathname === location.pathname &&
			!params[SELECTED_COUPON_DETAILS_TAG] &&
			params[SELECTED_COUPON_DETAILS_TAG] != null &&
			params[SELECTED_COUPON_DETAILS_TAG]?.length === 0,
		[navigation.state, navigation.location?.pathname, location.pathname],
	);

	return isFetchingThisRoute;
};

const SeeDetailsButton = memo(({ rowId }: { rowId: number }) => {
	const suppressNavigation = useSuppressTopLoadingBar();
	const handleSeeDetailsClick = (id: number) => {
		suppressNavigation(() => {}).navigate(`coupon/${id}`);
	};

	return <DropdownMenuItem onClick={() => handleSeeDetailsClick(rowId)}>See details</DropdownMenuItem>;
});

const CouponsPage = memo(() => {
	const { data, query, pageIndex, pageSize } = useLoaderData<typeof loader>();

	const pageCount = useMemo(() => Math.ceil(data.total / pageSize), [data.total, pageSize]);

	const { setCouponTypeDialogState } = useContext(CouponsPageCtx);

	const handleCreateClick = () => {
		setCouponTypeDialogState(true);
		return;
	};
	// console.log(data);
	const [columnVisibility, setColumnVisibility] = useState({});

	useEffect(() => {
		if (data.error != null && data.error.message) {
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	const columns: ColumnDef<HighLevelCoupon>[] = [
		{
			id: "select",
			accessorKey: "select",
			header: ({ table }) => TableRowSelector({ name: "select" }).header({ table }),
			cell: ({ row }) => TableRowSelector({ name: "select" }).cell({ row }),
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
			cell: (info) => getFullDateTimeFormat(info.row.original.start_timestamp),
			header: () => "Start",
		},
		{
			id: "End",
			accessorKey: "end_timestamp",
			cell: (info) => getFullDateTimeFormat(info.row.original.end_timestamp),
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
									toast.success(`Coupon ID #${rowData.id} copied`);
								}}
							>
								Copy ID
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<SeeDetailsButton rowId={rowData.id} />
							<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
								<DropdownMenuItem>Update</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const tableColumns = useMemo(() => columns, [columnVisibility, data]);

	const table = useReactTable({
		data: (data?.coupons as HighLevelCoupon[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		onColumnVisibilityChange: setColumnVisibility,
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection: true,
		pageCount,
		state: {
			columnVisibility,
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
				<div className="rounded-md flex flex-col gap-2">
					<PageOptions />
					<CouponsArea table={table} />
				</div>
			</section>
		</>
	);
});

const CouponsTable = ({ table }: { table: Table<HighLevelCoupon> }) => {
	const { data, pageSize } = useLoaderData<typeof loader>();

	const isFetchingThisRoute = getRouteFetchingState();

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: 1,
	});

	const cols = table.getAllColumns();

	return (
		<div className="flex flex-col gap-4">
			<div className="w-fit self-end">
				<TableColumnsToggle table={table} />
			</div>
			{isFetchingThisRoute ? (
				<DataTableSkeleton noOfSkeletons={4} columns={cols} />
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
	);
};

const CouponsGrid = memo(() => {
	const { data } = useLoaderData<typeof loader>();

	return (
		<motion.ul
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className="main-coupons-grid mt-2"
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

const CouponsArea = ({ table }: { table: Table<HighLevelCoupon> }) => {
	const { view_mode } = useContext(CouponsPageCtx);
	console.log("Coupons area re rendered");

	const isFetchingThisRoute = getRouteFetchingState();

	if (view_mode === "grid") {
		return isFetchingThisRoute ? <CouponCardSkeleton className="mt-2" /> : <CouponsGrid />;
	} else {
		return <CouponsTable table={table} />;
	}
};

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
					<Link
						key={option.value}
						to={`/coupons/create/${option.value}`}
						viewTransition
						prefetch="intent"
					>
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

const PageOptions = memo(() => {
	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("q") ?? "";
	const isFetchingThisRoute = getRouteFetchingState();

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
								disabled={isFetchingThisRoute || false}
							/>
						</div>
						{/* Invisible submit button: Enter in input triggers submit */}
						<Button type="submit" className="hidden">
							Search
						</Button>
					</Form>
				</div>
				<ViewModeChangeButtons />
			</div>
		</>
	);
});
