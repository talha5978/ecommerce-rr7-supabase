import { Row, type Table } from "@tanstack/react-table";
import { Control, ControllerRenderProps, UseFormSetValue, useWatch } from "react-hook-form";
import { Checkbox } from "~/components/ui/checkbox";
import { type JSX, memo, Suspense, useCallback, useMemo, useState } from "react";
import { FormField } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	CondOperatorLabels,
	CondTypeLabels,
	getAllSearchParams,
	typesToSelect,
	typeToParamMap,
} from "@ecom/shared/constants/couponsConstants";
import { Input } from "~/components/ui/input";
import { CategoriesSelectionArea } from "~/components/Coupons/SelectionAreas/CategoriesSelectionArea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "../ui/button";
import { SearchBar } from "~/components/Coupons/SearchBar";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import { Await, useLoaderData, useSearchParams } from "react-router";
import { type CreateCouponsLoader } from "~/routes/Coupons/create-coupon";
import { AccordianSkeleton } from "./Skeletons/AccordianSkeleton";
import { PaginationSkeleton } from "./Skeletons/PaginationSkeleton";
import PaginationOptions from "./PaginationOptions";
import { LineSkeleton } from "./Skeletons/LineSkeleton";
import { SKUsSelectionArea } from "./SelectionAreas/SKUSelectionArea";
import { CollectionsSelectionArea } from "./SelectionAreas/CollectionsSelectionArea";
import { CouponFormValues } from "@ecom/shared/schemas/coupons.schema";
import type {
	FixedProductsGroupOpts,
	OrdersGroupOpts,
	SelectionDialogProps,
	TypesToSelect,
} from "@ecom/shared/types/coupons-comp";
import { DiscountCondOperator, DiscountCondType } from "@ecom/shared/types/coupons";
import {
	COUPONS_CATEGORIES_PAGE_SIZE,
	COUPONS_COLLECTIONS_PAGE_SIZE,
	COUPONS_SKUS_PAGE_SIZE,
	DISCOUNT_COND_TYPE_ENUM,
} from "@ecom/shared/constants/constants";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { GetAllCategoriesResponse } from "@ecom/shared/types/category";
import { SKUsNamesListResponse } from "@ecom/shared/types/products";
import { CollectionsNamesListResponse } from "@ecom/shared/types/collections";

type FieldNames = "conditions" | "fixed_products";

type TypeCellProps = {
	index: number;
	control: Control<CouponFormValues>;
	setValue: UseFormSetValue<CouponFormValues>;
	name: FieldNames;
};

type CellMinimalProps = {
	index: number;
	control: Control<CouponFormValues>;
	name: FieldNames;
};

type ConditionOperatorProps = CellMinimalProps;
type ConditionValueCellProps = CellMinimalProps & {
	field: ControllerRenderProps<CouponFormValues>;
};

const getSelectedGroup = ({ name }: { name: FieldNames }): FixedProductsGroupOpts | OrdersGroupOpts => {
	return name === "fixed_products" ? "fix" : "order";
};

const setParamsValues = ({
	type,
	searchParams,
	suppressNavigation,
	name,
}: {
	type: TypesToSelect | null;
	searchParams: URLSearchParams;
	suppressNavigation: ReturnType<typeof useSuppressTopLoadingBar>;
	name: FieldNames;
}) => {
	const newParams = new URLSearchParams(searchParams);
	const group = getSelectedGroup({ name });

	suppressNavigation(() => {
		// Clear all parameters for the group
		getAllSearchParams([group]).forEach((param) => {
			newParams.delete(param);
		});

		// Set the flag for the selected type, if any
		if (type) {
			newParams.set(`${group}_${typeToParamMap[type]}`, "true");
		}
	}).setSearchParams(newParams);
};

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
	const [searchParams] = useSearchParams();
	const suppressNavigation = useSuppressTopLoadingBar();

	// Reset other order_fields in the row based on the new type
	const ResetOtherFields = ({ newType, index }: { newType: DiscountCondType; index: number }) => {
		setValue(`${name}.${index}.operator`, newType === "price" ? "equal" : "in");
		setValue(`${name}.${index}.value_text`, []);
		setValue(`${name}.${index}.value_decimal`, "");
		if (name === "conditions") {
			setValue(`${name}.${index}.min_quantity`, "1");
		}
		setParamsValues({
			searchParams,
			suppressNavigation,
			type: newType !== "price" ? (newType as TypesToSelect) : null,
			name,
		});
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

export const ConditionValueCell = memo(
	({ index, control, name, field }: ConditionValueCellProps): JSX.Element => {
		const type: DiscountCondType = useWatch({
			control,
			name: `${name}.${index}.type`,
		}) as DiscountCondType;
		const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

		const { fix, order } = useLoaderData<CreateCouponsLoader>();

		const [searchParams] = useSearchParams();
		const suppressNavigation = useSuppressTopLoadingBar();

		const handleSelectClick = useCallback(() => {
			if (typesToSelect.includes(type as TypesToSelect)) {
				setDialogOpen(true);
			} else {
				throw new ApiError("Invalid type selected", 400, []);
			}
		}, [type]);

		const handleDialogClose = useCallback(
			(type: TypesToSelect) => {
				setDialogOpen(false);
				const newParams = new URLSearchParams(searchParams);
				// Clear the search params for the selected type
				const tag = `${getSelectedGroup({ name })}_${type}`;
				console.log(tag + "_search");

				suppressNavigation(() => {
					newParams.delete(`${tag}_search`);
					newParams.delete(`${tag}_page`);
				}).setSearchParams(newParams);
			},
			[type, name, searchParams, suppressNavigation],
		);

		const MainFormFields = () => {
			if (type === "price") {
				return (
					<FormField
						control={control}
						name={`${name}.${index}.value_decimal`}
						render={({ field }) => (
							<Input
								type="number"
								placeholder="e.g. 50.00"
								{...field}
								value={field.value ?? ""}
							/>
						)}
					/>
				);
			}

			if (!typesToSelect.includes(type)) {
				return <p className="text-sm text-muted-foreground">Invalid type</p>;
			}

			const Label = CondTypeLabels[type as TypesToSelect]?.plural.toLowerCase();

			return (
				<FormField
					control={control}
					name={`${name}.${index}.value_text`}
					render={({ field }) => (
						<div onClick={handleSelectClick}>
							<p className="text-sm text-primary hover:underline cursor-pointer underline-offset-4 text-ellipsis truncate max-w-[10rem]">
								{Array.isArray(field.value) && field.value.length > 0
									? `${field.value.length} item${
											field.value.length > 1 ? "s" : ""
										} selected`
									: `Select ${Label}`}
							</p>
						</div>
					)}
				/>
			);
		};

		// Memoize dataSource and responses to prevent re-renders
		const dataSource = useMemo(() => {
			const group = getSelectedGroup({ name });
			return group === "fix" ? fix : order;
		}, [name, fix, order]);

		const responses = useMemo(
			() => ({
				category: dataSource?.categoriesData,
				sku: dataSource?.skusData,
				collection: dataSource?.collectionsData,
			}),
			[dataSource],
		);

		const selectedData = useMemo(() => {
			return typesToSelect.includes(type as TypesToSelect) ? responses[type as TypesToSelect] : null;
		}, [type, responses]);

		const SelectionDialogs = useCallback(() => {
			if (!isDialogOpen || !typesToSelect.includes(type as TypesToSelect)) {
				return null;
			}

			const group = getSelectedGroup({ name });

			// console.log("Group:", group);
			// console.log("DataSource:", dataSource);
			// console.log("Responses:", responses);
			// console.log("Selected type:", type);
			// console.log("Selected data:", selectedData);

			if (!selectedData) {
				return null;
			}

			return (
				<SelectionDialog
					field={field}
					type={type as TypesToSelect}
					open={isDialogOpen}
					onClose={() => handleDialogClose(type as TypesToSelect)}
					group={group}
					selectedData={selectedData}
				/>
			);
		}, [isDialogOpen, type, field, name, fix, order]);

		return (
			<>
				<MainFormFields />
				<SelectionDialogs />
			</>
		);
	},
);

const SelectionDialog = memo(function SelectionDialog({
	field,
	type,
	open,
	onClose,
	group,
	selectedData,
}: SelectionDialogProps): JSX.Element {
	// Memoize children to prevent re-renders
	const children = useMemo(() => {
		switch (type) {
			case "category":
				return (
					<Suspense
						fallback={
							<>
								<AccordianSkeleton main_skeletons={4} sub_skeletons={2} />
								<PaginationSkeleton />
							</>
						}
					>
						<Await resolve={selectedData as Promise<GetAllCategoriesResponse>}>
							{(resolvedData: GetAllCategoriesResponse | null) => (
								<>
									{resolvedData ? (
										<CategoriesSelectionArea resolvedData={resolvedData} field={field} />
									) : (
										<p>No {CondTypeLabels[type].plural.toLowerCase()} found</p>
									)}
									<PaginationOptions
										originalPageSize={COUPONS_CATEGORIES_PAGE_SIZE}
										selectedType={type}
										group={group}
										totalElements={resolvedData?.total ?? 0}
									/>
								</>
							)}
						</Await>
					</Suspense>
				);
			case "sku":
				return (
					<Suspense
						fallback={
							<>
								<LineSkeleton lines={COUPONS_SKUS_PAGE_SIZE} />
								<PaginationSkeleton />
							</>
						}
					>
						<Await resolve={selectedData as Promise<SKUsNamesListResponse>}>
							{(resolvedData: SKUsNamesListResponse | null) => (
								<>
									{resolvedData ? (
										<SKUsSelectionArea resolvedData={resolvedData} field={field} />
									) : (
										<p>No {CondTypeLabels[type].plural.toLowerCase()} found</p>
									)}
									<PaginationOptions
										originalPageSize={COUPONS_SKUS_PAGE_SIZE}
										selectedType={type}
										group={group}
										totalElements={resolvedData?.total ?? 0}
									/>
								</>
							)}
						</Await>
					</Suspense>
				);
			case "collection":
				return (
					<Suspense
						fallback={
							<>
								<LineSkeleton lines={COUPONS_COLLECTIONS_PAGE_SIZE} />
								<PaginationSkeleton />
							</>
						}
					>
						<Await resolve={selectedData as Promise<CollectionsNamesListResponse>}>
							{(resolvedData: CollectionsNamesListResponse | null) => (
								<>
									{resolvedData ? (
										<CollectionsSelectionArea resolvedData={resolvedData} field={field} />
									) : (
										<p>No {CondTypeLabels[type].plural.toLowerCase()} found</p>
									)}
									<PaginationOptions
										originalPageSize={COUPONS_COLLECTIONS_PAGE_SIZE}
										selectedType={type}
										group={group}
										totalElements={resolvedData?.total ?? 0}
									/>
								</>
							)}
						</Await>
					</Suspense>
				);
			default:
				return null;
		}
	}, [type, selectedData, field, group]);

	return (
		<Dialog open={!!open} onOpenChange={onClose}>
			<DialogContent
				className="sm:max-w-[550px]"
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Select {CondTypeLabels[type].plural} for Collection</DialogTitle>
					<DialogDescription>
						Choose {CondTypeLabels[type].plural.toLowerCase()} below to add to your conditions.
					</DialogDescription>
				</DialogHeader>
				<div className="max-h-96 overflow-y-auto space-y-4">
					<SearchBar selectedType={type} group={group} />
					{children}
				</div>
				<DialogFooter>
					<Button variant="default" onClick={onClose}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
