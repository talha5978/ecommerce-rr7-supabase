import { type TransitionFunction, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Table, type ColumnDef } from "@tanstack/react-table";
import type { CouponFormValues } from "~/schemas/coupons.schema";
import { ConditionOperatorCell, ConditionValueCell, TableRowSelector, TypeCell } from "./TableComponents";
import { FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { Trash2 } from "lucide-react";
import type { Control, UseFieldArrayAppend, UseFieldArrayRemove, UseFormSetValue } from "react-hook-form";
import type { DiscountCondType } from "~/types/coupons";
import { Input } from "~/components/ui/input";

type ColsParams = {
	control: Control<CouponFormValues>;
	setValue: UseFormSetValue<CouponFormValues>;
	selectedType: (index: number) => DiscountCondType;
	remove_fields: UseFieldArrayRemove;
};

type ColsType<T extends keyof CouponFormValues> = ColumnDef<CouponFormValues[T], unknown>[];

export const FixedProductsCols = ({
	control,
	setValue,
	selectedType,
	remove_fields,
}: ColsParams): ColsType<"fixed_products"> => {
	const fixedProductsCols: ColsType<"fixed_products"> = [
		{
			id: "select",
			header: ({ table }) => TableRowSelector({ name: "fixed_products" }).header({ table }),
			cell: ({ row }) => TableRowSelector({ name: "fixed_products" }).cell({ row }),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "Type",
			accessorKey: "type",
			header: "Type",
			enableHiding: false,
			cell: ({ row }) => (
				<TypeCell index={row.index} control={control} setValue={setValue} name="fixed_products" />
			),
		},
		{
			id: "Operator",
			accessorKey: "operator",
			header: "Operator",
			cell: ({ row }) => (
				<ConditionOperatorCell control={control} index={row.index} name="fixed_products" />
			),
		},
		{
			id: "Value",
			header: "Value",
			accessorKey: "value",
			cell: ({ row }) => (
				<FormField
					control={control}
					name={`fixed_products.${row.index}.${
						selectedType(row.index) === "price" ? "value_decimal" : "value_text"
					}`}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<ConditionValueCell
									control={control}
									index={row.index}
									name="fixed_products"
									field={field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => {
				return (
					<div className="flex items-center justify-center">
						<Button
							type="button"
							variant="destructive"
							className={"size-8"}
							onClick={() => remove_fields(row.index)}
						>
							<Trash2 className="!h-4 !w-4" />
						</Button>
					</div>
				);
			},
		},
	];

	const fixProdCols = useMemo(() => fixedProductsCols, []);

	return fixProdCols;
};

export const OrderConditionsCols = ({
	control,
	setValue,
	selectedType,
	remove_fields,
}: ColsParams): ColsType<"conditions"> => {
	const orderConditionCols: ColsType<"conditions"> = [
		{
			id: "select",
			header: ({ table }) => TableRowSelector({ name: "conditions" }).header({ table }),
			cell: ({ row }) => TableRowSelector({ name: "conditions" }).cell({ row }),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "Type",
			accessorKey: "type",
			header: "Type",
			enableHiding: false,
			cell: ({ row }) => (
				<TypeCell index={row.index} control={control} setValue={setValue} name="conditions" />
			),
		},
		{
			id: "Operator",
			accessorKey: "operator",
			header: "Operator",
			cell: ({ row }) => (
				<ConditionOperatorCell control={control} index={row.index} name="conditions" />
			),
		},
		{
			id: "Value",
			header: "Value",
			accessorKey: "value",
			cell: ({ row }) => (
				<FormField
					control={control}
					name={`conditions.${row.index}.${
						selectedType(row.index) === "price" ? "value_decimal" : "value_text"
					}`}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<ConditionValueCell
									control={control}
									index={row.index}
									name="conditions"
									field={field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			),
		},
		{
			id: "Min. Quantity",
			accessorKey: "min_quantity",
			header: "Min. Quantity",
			cell: ({ row }) => {
				const index = row.index;
				return (
					<FormField
						control={control}
						name={`conditions.${index}.min_quantity`}
						render={({ field }) => (
							<Input
								type="number"
								placeholder="e.g. 1"
								min={1}
								minLength={1}
								className="max-w-[5rem]"
								{...field}
							/>
						)}
					/>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				return (
					<Button
						type="button"
						variant="destructive"
						className={"size-8"}
						onClick={() => remove_fields(row.index)}
					>
						<Trash2 className="!h-4 !w-4" />
					</Button>
				);
			},
		},
	];

	const orderCols = useMemo(() => orderConditionCols, []);

	return orderCols;
};

export const appendOrderCondition = (
	appendFunc: UseFieldArrayAppend<CouponFormValues>,
): TransitionFunction => {
	return () =>
		appendFunc({
			type: "price",
			operator: "equal",
			value_text: [],
			value_decimal: "",
			min_quantity: "",
		});
};

export const appendFixProdCondition = (
	appendFunc: UseFieldArrayAppend<CouponFormValues>,
): TransitionFunction => {
	return () =>
		appendFunc({
			type: "price",
			operator: "equal",
			value_text: [],
			value_decimal: "",
			min_quantity: "",
		});
};

export const remOrderSelectedRows = ({
	tableName,
	table,
	remove_fields,
}: {
	tableName: "conditionsTable" | "fixedProductsTable";
	table: Table<CouponFormValues["conditions"] | CouponFormValues["fixed_products"]>;
	remove_fields: UseFieldArrayRemove;
}) => {
	if (tableName === "conditionsTable") {
		const selectedIndices = table
			.getSelectedRowModel()
			.rows.map((row) => row.index)
			.sort((a, b) => b - a);

		remove_fields(selectedIndices);
		table.resetRowSelection();
	} else if (tableName === "fixedProductsTable") {
		const selectedIndices = table
			.getSelectedRowModel()
			.rows.map((row) => row.index)
			.sort((a, b) => b - a);

		remove_fields(selectedIndices);
		table.resetRowSelection();
	}
};
