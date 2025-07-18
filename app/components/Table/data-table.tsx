import {
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconTrendingUp,
} from "@tabler/icons-react";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	Row,
	type Table,
	useReactTable,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { z } from "zod";

import { useIsMobile } from "~/hooks/use-mobile";
import { Button } from "~/components/ui/button";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";

interface DataTableProps<T> {
	table: Table<T>;
	onPageChange?: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
	pageSize?: number;
	total?: number;
	customEmptyMessage?: string;
	cellClassName?: string;
}

export interface DataTableViewOptionsProps<T> {
	table: Table<T>;
	disabled: boolean;
}

export interface DataTableSkeletonProps {
	noOfSkeletons: number;
	columns: ColumnDef<any>[];
}

export function DataTable<T>({
	table,
	onPageChange,
	onPageSizeChange,
	pageSize,
	total,
	customEmptyMessage,
	cellClassName = "**:data-[slot=table-cell]:last:bg-background"
}: DataTableProps<T>) {
	if (!table) {
		return (
			<div>
				<p className="text-center text-muted-foreground">
					Table not initialized. Please check the data source.
				</p>
			</div>
		);
	}

	const PAGE_VALUES = [10, 20, 30, 40, 50];

	return (
		<section>
			<TableComponent>
				<TableHeader className={`bg-muted sticky top-0 z-10`}>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow
							key={headerGroup.id}
							className="[&>*]:whitespace-nowrap sticky top-0 bg-background after:content-[''] after:inset-x-0 after:h-px after:bg-border after:absolute after:bottom-0"
						>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="bg-muted">
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody className={`**:data-[slot=table-cell]:first:w-8 **:data-[slot=table-cell]:last:sticky **:data-[slot=table-cell]:last:right-0 **:data-[slot=table-cell]:last:z-10 ${cellClassName}`}>
					{table.getRowModel().rows?.length > 0 ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={table.getAllColumns().length}
								className="h-36 text-center select-none text-muted-foreground"
							>
								<p className="text-sm">{customEmptyMessage ?? "No results found"}</p>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</TableComponent>
			<div className="mt-4">
				{total && (
					<div className="px-4">
						<p>
							({total}) record{total ? (total === 1 ? "" : "s") : "s"} found
						</p>
					</div>
				)}
				{onPageSizeChange && onPageChange && pageSize ? (
					<div className="mt-4 flex w-full items-center gap-8 justify-between px-4">
						<div className="hidden items-center gap-2 sm:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${pageSize}`}
								onValueChange={(value) => onPageSizeChange(Number(value))}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue placeholder={table.getState().pagination.pageSize} />
								</SelectTrigger>
								<SelectContent side="top" defaultValue={`${pageSize}`}>
									{PAGE_VALUES.map((size) => (
										<SelectItem key={size} value={`${size}`}>
											{size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
						</div>
						<div className="ml-auto flex items-center gap-2 sm:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 sm:flex"
								onClick={() => onPageChange(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => onPageChange(table.getState().pagination.pageIndex - 1)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => onPageChange(table.getState().pagination.pageIndex + 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 sm:flex"
								size="icon"
								onClick={() => onPageChange(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</section>
	);
}

export function DataTableSkeleton({ noOfSkeletons = 8, columns } : DataTableSkeletonProps) {

	const table = useReactTable({
		data: [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<TableComponent>
			<TableHeader className="bg-muted sticky top-0 z-10">
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							return (
								<TableHead key={header.id} className="bg-muted">
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							);
						})}
					</TableRow>
				))}
			</TableHeader>
			<TableBody className="**:data-[slot=table-cell]:first:w-8">
				{Array.from({ length: noOfSkeletons }, (_, i) => i + 1).map((i) => (
					<TableRow key={i}>
						{Array.from({ length: columns.length }, (_, i) => i + 1).map((index) => {
							return (
								<TableCell key={index + index}>
									<Skeleton className="h-[30px] w-full bg-muted-dark dark:bg-muted" />
								</TableCell>
							);
						})}
					</TableRow>
				))}
			</TableBody>
		</TableComponent>
	);
}