import { Row, type Table } from "@tanstack/react-table";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { type CouponFormValues } from "~/schemas/coupons.schema";
import { Checkbox } from "~/components/ui/checkbox";
import { JSX, memo } from "react";
import { DiscountCondOperator, DiscountCondType } from "~/types/coupons";
import { FormField } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { DISCOUNT_COND_TYPE_ENUM } from "~/constants";
import { CondOperatorLabels, CondTypeLabels } from "~/utils/couponsConstants";
import { Input } from "~/components/ui/input";

type TypeCellProps = {
	index: number;
	control: Control<CouponFormValues>;
	setValue: UseFormSetValue<CouponFormValues>;
	name: "conditions" | "fixed_products";
};

type CellMinimalProps = {
	index: number;
	control: Control<CouponFormValues>;
	name: "conditions" | "fixed_products";
};

type ConditionOperatorProps = CellMinimalProps;
type ConditionValueCellProps = CellMinimalProps;

export const TableRowSelector = ({ name }: { name: "conditions" | "fixed_products" }) => {
	function header({ table }: { table: Table<CouponFormValues[typeof name]> }) {
		const rows = table.getRowCount();
		return rows > 0 ? (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			</div>
		) : null;
	}

	function cell({ row }: { row: Row<CouponFormValues[typeof name]> }) {
		return (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			</div>
		);
	}

	return { header, cell };
};

export const TypeCell = memo(({ index, control, setValue, name }: TypeCellProps): JSX.Element => {
	// Reset other order_fields in the row based on the new type
	const ResetOtherFields = ({ newType, index }: { newType: DiscountCondType; index: number }) => {
		setValue(`${name}.${index}.operator`, newType === "price" ? "equal" : "in");
		setValue(`${name}.${index}.value_text`, "");
		setValue(`${name}.${index}.value_decimal`, "");
		if (name === "conditions") {
			setValue(`${name}.${index}.min_quantity`, "1");
		}
	};

	return (
		<FormField
			control={control}
			name={`${name}.${index}.type`}
			render={({ field }) => (
				<Select
					value={field.value}
					onValueChange={(newType: DiscountCondType) => {
						field.onChange(newType);
						ResetOtherFields({ newType, index });
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select type" />
					</SelectTrigger>
					<SelectContent>
						{DISCOUNT_COND_TYPE_ENUM.map((type) => (
							<SelectItem key={type} value={type}>
								{CondTypeLabels[type].singular}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		/>
	);
});

export const ConditionOperatorCell = memo(({ index, control, name }: ConditionOperatorProps): JSX.Element => {
	const type = useWatch({ control, name: `${name}.${index}.type` });
	const operators: DiscountCondOperator[] =
		type === "price"
			? ["equal", "not_equal", "greater", "greater_or_equal", "smaller", "smaller_or_equal"]
			: ["in", "not_in"];

	return (
		<FormField
			control={control}
			name={`${name}.${index}.operator`}
			render={({ field }) => (
				<Select value={field.value} onValueChange={field.onChange}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select operator" />
					</SelectTrigger>
					<SelectContent>
						{operators.map((op) => (
							<SelectItem key={op} value={op}>
								{CondOperatorLabels[op]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		/>
	);
});

export const ConditionValueCell = memo(({ index, control, name }: ConditionValueCellProps): JSX.Element => {
	const type: DiscountCondType = useWatch({ control, name: `${name}.${index}.type` });

	if (type === "price") {
		return (
			<FormField
				control={control}
				name={`${name}.${index}.value_decimal`}
				render={({ field }) => <Input type="number" placeholder="e.g. 50.00" {...field} />}
			/>
		);
	} else {
		return (
			<FormField
				control={control}
				name={`${name}.${index}.value_text`}
				render={({ field }) => (
					<p className="text-sm text-primary hover:underline cursor-pointer underline-offset-4 text-ellipsis truncate max-w-[10rem]">
						{field.value
							? field.value
							: `Select ${CondTypeLabels[type].plural.toLowerCase() || "values"}`}
					</p>
				)}
			/>
		);
	}
});
