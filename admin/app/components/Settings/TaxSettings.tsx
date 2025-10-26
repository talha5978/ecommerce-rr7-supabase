import { memo, useEffect, useMemo, useState } from "react";
import { Bolt, Loader2, MoreHorizontal, PlusCircle, Search, Trash } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import {
	Outlet,
	Form as RouterForm,
	useFetcher,
	useLocation,
	useNavigate,
	useNavigation,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	DataTable,
	DataTableSkeleton,
	type DataTableViewOptionsProps,
	TableColumnsToggle,
} from "~/components/Table/data-table";
import type { GetAllTaxTypes, TaxApplicationCategory, TaxRate, TaxType_Raw } from "@ecom/shared/types/taxes";
import type { TaxesLoaderData } from "~/routes/Settings/tax-settings";
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import StatusBadge from "~/components/status-badge";
import { bolleanToStringConverter, GetFormattedDate } from "@ecom/shared/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { defaults } from "@ecom/shared/constants/constants";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { Controller, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const TaxSettings = memo(function TaxSettingsFunc({ loaderData }: { loaderData: TaxesLoaderData }) {
	const taxesData = loaderData.data;
	const { query, pageIndex, pageSize } = loaderData;

	if (taxesData.taxes == null) {
		toast.error(taxesData.error?.message || "Something went wrong");
		// throw redirect("/");
	}

	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(taxesData.total / pageSize);

	const isFetchingThisRoute = useMemo(
		() => navigation.state === "loading" && navigation.location?.pathname === location.pathname,
		[navigation.state, navigation.location?.pathname, location.pathname],
	);
	// console.log(data);

	useEffect(() => {
		if (taxesData.error != null && taxesData.error.message) {
			toast.error(`${taxesData.error.statusCode} - ${taxesData.error.message}`);
		}
	}, [taxesData.error]);

	console.log("Re rendered");

	const fetcher = useFetcher();

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Tax rate deleted successfully");
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
		// console.log(fetcher.data);
	}, [fetcher.data, queryClient]);

	const handleDeleteClick = (id: number) => {
		const formData = new FormData();
		formData.append("id", id.toString());
		fetcher.submit(formData, {
			method: "POST",
			action: `/settings/taxes/${id}/delete`,
		});
	};

	const columns: ColumnDef<TaxRate, unknown>[] = [
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info: any) => {
				return <p className="md:max-w-[20ch] max-w-[15ch] truncate">{info.row.original.name}</p>;
			},
			header: () => "Name",
		},
		{
			id: "Rate",
			accessorKey: "rate",
			cell: (info: any) => {
				return <p>{info.row.original.rate.toFixed(2)}</p>;
			},
			header: () => "Rate (PKR)",
		},
		{
			id: "Type",
			accessorKey: "type",
			cell: (info: any) => <Badge variant="outline">{info.row.original.type.name}</Badge>,
			header: () => "Type",
		},
		{
			id: "Categories",
			accessorKey: "categories",
			cell: (info: any) => {
				return (
					<div className="flex flex-wrap flex-row gap-1 ">
						{info.row.original.application_categories.map((category: TaxApplicationCategory) => (
							<Badge key={category.category_id} variant={"outline"}>
								{category.category_name}
							</Badge>
						))}
					</div>
				);
			},
			header: () => "Categories",
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
			accessorKey: "created_at",
			cell: (info: any) => GetFormattedDate(info.row.original.created_at),
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: TaxRate = row.original;

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
									toast.success("Tax ID copied");
								}}
							>
								Copy ID
							</DropdownMenuItem>
							<UpdateStatusForm tax={rowData as TaxRate} />
							<DropdownMenuItem
								disabled
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
				);
			},
		},
	];

	const tableColumns = useMemo(() => columns, []);

	const { onPageChange, onPageSizeChange } = GetPaginationControls({
		defaultPage: defaults.DEFAULT_TAXES_PAGE_SIZE,
	});

	const table = useReactTable({
		data: (taxesData.taxes as TaxRate[]) ?? [],
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
			<Card>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-4">
						<DataTableViewOptions
							table={table}
							disabled={isFetchingThisRoute}
							tax_types={loaderData.tax_types}
						/>
						{query && (
							<div className="my2">
								<p>Showing records for "{query?.trim()}"</p>
							</div>
						)}
						{isFetchingThisRoute ? (
							<DataTableSkeleton noOfSkeletons={4} columns={tableColumns} />
						) : (
							<DataTable
								table={table}
								onPageChange={onPageChange}
								onPageSizeChange={onPageSizeChange}
								pageSize={pageSize}
								total={taxesData.total ?? 0}
								customEmptyMessage="No taxes found :)"
								cellClassName="bg-card"
							/>
						)}
					</div>
				</CardContent>
			</Card>
			<Outlet />
		</>
	);
});

type TaxTableViewOptionsProps = DataTableViewOptionsProps<TaxRate> & { tax_types: GetAllTaxTypes };

const DataTableViewOptions = memo(({ table, disabled, tax_types }: TaxTableViewOptionsProps) => {
	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("q") ?? "";
	const navigate = useNavigate();

	const [isTypesModalOpen, setIsTypesModalOpen] = useState<boolean>(false);

	function handleNewTaxClick() {
		navigate("create");
	}

	function onTypesBtnClick() {
		setIsTypesModalOpen(true);
	}

	const noTaxTypes = tax_types.total === 0 || tax_types.tax_types?.length === 0;

	return (
		<>
			<div className="w-full flex justify-between gap-4 items-center">
				<div className="flex gap-2 items-center">
					<RouterForm method="get" action="/settings/taxes">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search taxes"
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
					</RouterForm>
					<Button size={"sm"} variant={"outline"} onClick={onTypesBtnClick}>
						<Bolt className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex flex-row gap-2">
					<Button
						size={"sm"}
						variant={"default"}
						type="button"
						onClick={handleNewTaxClick}
						disabled={noTaxTypes}
					>
						<PlusCircle className="h-4 w-4" />
						<p className="md:inline-block hidden">New Tax</p>
					</Button>
					<TableColumnsToggle table={table} />
				</div>
			</div>
			{isTypesModalOpen && (
				<TaxTypesDialog
					open={isTypesModalOpen}
					setOpen={setIsTypesModalOpen}
					data={tax_types.tax_types ?? []}
				/>
			)}
		</>
	);
});

const TaxTypesDialog = memo(
	({ open, setOpen, data }: { open: boolean; setOpen: (open: boolean) => void; data: TaxType_Raw[] }) => {
		const navigate = useNavigate();

		const handleCreateTypeClick = () => {
			navigate("/settings/taxes/tax-types/create");
		};

		const fetcher = useFetcher();

		useEffect(() => {
			if (fetcher.data) {
				if (fetcher.data.success) {
					toast.success("Tax type deleted successfully");
				} else if (fetcher.data.error) {
					toast.error(fetcher.data.error);
				}
			}
			// console.log(fetcher.data);
		}, [fetcher.data, queryClient]);

		const handleDeleteClick = (id: number) => {
			const formData = new FormData();
			formData.append("id", id.toString());
			fetcher.submit(formData, {
				method: "POST",
				action: `/settings/taxes/tax-types/${id}/delete`,
			});
		};

		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className="sm:max-w-[550px]"
					showCloseButton={false}
					onInteractOutside={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle className="flex gap-2 justify-between items-center">
							<p>Tax Types</p>
							<Button
								size={"sm"}
								variant={"default"}
								type="button"
								onClick={handleCreateTypeClick}
							>
								<PlusCircle className="h-4 w-4" />
							</Button>
						</DialogTitle>
						<DialogDescription>Available tax types for online sales</DialogDescription>
					</DialogHeader>
					<div className="max-h-96 overflow-y-auto flex flex-col gap-3">
						{data.length > 0 ? (
							<div className="flex flex-col gap-2 rounded-xl ">
								{data.map((item) => (
									<div className="bg-card flex flex-row justify-between items-center p-4 rounded-xl">
										<div>
											<h3 className="font-semibold text-md">{item.name}</h3>
											<div className="flex flex-row text-muted-foreground gap-1">
												<p>#{item.id}</p>
												<p>-</p>
												<p>Created at {GetFormattedDate(item.created_at)}</p>
											</div>
										</div>
										<div>
											<Button
												disabled={fetcher.state === "submitting"}
												size={"icon"}
												variant={"destructive"}
												onClick={() => handleDeleteClick(item.id)}
											>
												{fetcher.state === "submitting" ? (
													<Loader2 className="animate-spin" color="white" />
												) : (
													<Trash />
												)}
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="py-10">
								<p className="text-center text-sm text-muted-foreground">
									No tax types found
								</p>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);

const StatusUpdateSchema = z.object({
	status: z.string(),
});

const UpdateStatusForm = memo(({ tax }: { tax: TaxRate }) => {
	const defaultValues = {
		status: bolleanToStringConverter(tax?.status) as "true" | "false",
	};

	const { control, reset } = useForm<z.infer<typeof StatusUpdateSchema>>({
		resolver: zodResolver(StatusUpdateSchema),
		defaultValues,
	});

	// Watch form values to trigger submission on change
	const status = useWatch({ control, name: "status" });

	const [submittingField, setSubmittingField] = useState<string | null>(null);

	const isStatusSubmitting = submittingField === "status";

	const fetcher = useFetcher();

	// Handle fetcher state for toasts and state updates
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Status updated successfully");
				const newStatus =
					fetcher.data.status !== undefined
						? bolleanToStringConverter(fetcher.data.status)
						: (status as "true" | "false");
				reset({
					status: newStatus as "true" | "false",
				});
				setSubmittingField(null);
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
				setSubmittingField(null);
			} else {
				toast.error("Something went wrong");
				setSubmittingField(null);
			}
		}
	}, [fetcher.data, reset, status]);

	// Trigger submission when status or is_featured changes
	useEffect(() => {
		const initialStatus = bolleanToStringConverter(tax?.status) as "true" | "false";
		const currentStatus = status !== initialStatus;

		if (currentStatus) {
			const formData = new FormData();
			let changedField: string | null = null;

			if (currentStatus && status !== undefined) {
				formData.append("status", status);
				changedField = "status";
			}
			if (changedField) {
				setSubmittingField(changedField);
				fetcher.submit(formData, { method: "post", action: `${tax.id}/update` });
			}
		}
	}, [status, tax]);

	const fields = useMemo(
		() => [
			{ label: "Active", value: "true", id: Math.floor(Math.random() * 99999).toString() },
			{ label: "Inactive", value: "false", id: Math.floor(Math.random() * 99999).toString() },
		],
		[],
	);

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent>
					<DropdownMenuRadioGroup value={status}>
						<Controller
							name="status"
							control={control}
							render={({ field }) => (
								<>
									{fields.map((item) => (
										<DropdownMenuRadioItem
											key={item.id}
											value={item.value}
											onSelect={(e) => {
												e.preventDefault();
												field.onChange(item.value);
											}}
											className={`cursor-pointer ${
												isStatusSubmitting && "text-muted-foreground"
											}`}
											disabled={isStatusSubmitting}
										>
											{item.label}
											{isStatusSubmitting && item.value === status && (
												<Loader2 className="animate-spin ml-auto" />
											)}
										</DropdownMenuRadioItem>
									))}
								</>
							)}
						/>
					</DropdownMenuRadioGroup>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	);
});

export default TaxSettings;
