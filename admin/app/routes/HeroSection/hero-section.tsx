import { Form, Link, useFetcher, useLocation, useSearchParams } from "react-router";
import { Route } from "./+types/hero-section";
import { Button } from "~/components/ui/button";
import { Loader2, MoreHorizontal, PlusCircle, Search } from "lucide-react";
import {
	DataTable,
	DataTableSkeleton,
	DataTableViewOptionsProps,
	TableColumnsToggle,
} from "~/components/Table/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useNavigation } from "react-router";
import { useEffect } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { defaults } from "@ecom/shared/constants/constants";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { GetFormattedDate } from "@ecom/shared/lib/utils";
import { HighLvlHeroSectionsQuery } from "~/queries/hero-sections.q";
import type { HighLevelHeroSection } from "@ecom/shared/types/hero-sections";
import StatusBadge from "~/components/status-badge";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
		defaultPageNo: 1,
		defaultPageSize: defaults.DEFAULT_HERO_SECTIONS_PAGE_SIZE,
	});

	const data = await queryClient.fetchQuery(
		HighLvlHeroSectionsQuery({
			request,
			q,
			pageIndex,
			pageSize,
		}),
	);

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
		queryClient,
	};
};

export default function HeroSectionManagmentPage({
	loaderData: { data, query, pageIndex, pageSize, queryClient },
}: Route.ComponentProps) {
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	useEffect(() => {
		if (data.error != null && data.error.message) {
			console.log(data);

			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	const fetcher = useFetcher();

	// Handle fetcher state for toasts and query invalidation
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Hero Section deleted successfully");
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
		console.log(fetcher.data);
	}, [fetcher.data, queryClient]);

	const handleDeleteClick = (heroSectionId: number) => {
		const formData = new FormData();
		formData.append("heroSectionId", heroSectionId.toString());
		fetcher.submit(formData, {
			method: "POST",
			action: `/hero-sections/${heroSectionId}/delete`,
		});
	};

	const tableColumns: ColumnDef<HighLevelHeroSection, unknown>[] = [
		{
			id: "Description",
			enableHiding: false,
			accessorKey: "description",
			cell: (info: any) => (
				<p className="md:max-w-[35ch] max-w-[20ch] truncate">{info.row.original.description}</p>
			),
			header: () => "Description",
		},
		{
			id: "Url",
			accessorKey: "url",
			cell: (info: any) => "/" + info.row.original.url,
			header: () => "Url",
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
			id: "Sort Order",
			accessorKey: "sort_order",
			cell: (info: any) => info.row.original.sort_order,
			header: () => "Sort Order",
		},
		{
			id: "Created At",
			accessorKey: "created_at",
			cell: (info: any) => GetFormattedDate(info.row.original.created_at),
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: HighLevelHeroSection = row.original;

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
									disabled={fetcher.state === "submitting"}
									variant="destructive"
									onClick={() => handleDeleteClick(rowData.id)}
								>
									{fetcher.state === "submitting" ? (
										<Loader2 className="animate-spin" color="white" />
									) : null}
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
		defaultPage: defaults.DEFAULT_CATEGORY_PAGE,
	});

	const table = useReactTable({
		data: (data.hero_sections as HighLevelHeroSection[]) ?? [],
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

	return (
		<>
			<MetaDetails
				metaTitle="Hero Sections | Admin Panel"
				metaDescription="Manage hero sections of your store here."
				metaKeywords="Hero Sections, Manage"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Hero Sections</h1>
						<Link to="create" viewTransition className="ml-auto">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Create Hero Section</span>
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelHeroSection>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<Form method="get" action="/hero-sections">
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search hero sections"
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
