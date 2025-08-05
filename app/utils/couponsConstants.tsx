import { UserCog, UserLock, UserRoundCheck, Users } from "lucide-react";
import { type JSX } from "react";
import type { Groups, TypesToSelect } from "~/components/Coupons/coupons-comp";
import { DISCOUNT_COND_TYPE_ENUM } from "~/constants";
import type {
	BuyMinType,
	DiscountCondOperator,
	DiscountCondType,
	DiscountCustomerGrps,
	DiscountType,
} from "~/types/coupons";

export const discount_type_fields: { label: string; value: DiscountType; example: string }[] = [
	{
		label: "Fixed discount to entire order",
		value: "fixed_order",
		example: "e.g., $25 off the entire order",
	},
	{
		label: "Percentage discount to entire order",
		value: "percentage_order",
		example: "e.g., 20% off the entire order",
	},
	{
		label: "Fixed discount to specific products",
		value: "fixed_product",
		example: "e.g., $6 off each selected product",
	},
	{
		label: "Percentage discount to specific products",
		value: "percentage_product",
		example: "e.g., 15% off each selected product",
	},
	{
		label: "Buy X get Y",
		value: "buy_x_get_y",
		example: "e.g., Buy 2 get 1 free on selected products",
	},
];

export const CondTypeLabels: Record<DiscountCondType, Record<string, string>> = {
	category: {
		singular: "Category",
		plural: "Categories",
	},
	collection: {
		singular: "Collection",
		plural: "Collections",
	},
	price: {
		singular: "Price",
		plural: "Prices",
	},
	sku: {
		singular: "SKU",
		plural: "SKUs",
	},
};

export const CondOperatorLabels: Record<DiscountCondOperator, string> = {
	equal: "Equal To",
	not_equal: "Not Equal To",
	greater: "Greater Than",
	greater_or_equal: "Greater Than Or Equal To",
	smaller: "Smaller Than",
	smaller_or_equal: "Smaller Than Or Equal To",
	in: "In",
	not_in: "Not In",
};

export const CustomerGroupsLabels: Record<DiscountCustomerGrps, { label: string; icon: JSX.Element }> = {
	all: { label: "All", icon: <UserRoundCheck /> },
	admins: { label: "Admins", icon: <UserLock /> },
	employee: { label: "Employees", icon: <UserCog /> },
	consumer: { label: "General Customers", icon: <Users /> },
};

// Condition Type for BuyXGetY Card BUY SECTION
export const ConditionTypeValues: { value: BuyMinType; id: string; label: string }[] = [
	{
		value: "quantity",
		id: "buy-quantity",
		label: "Minimum quantity of items",
	},
	{
		value: "amount",
		id: "buy-amount",
		label: "Minimum amount of items",
	},
];

export const typesToSelect = DISCOUNT_COND_TYPE_ENUM.filter((type) => type !== "price");

// Param Tag for pagination tags
export function getPageSearchTag(selectedType: TypesToSelect, group: Groups) {
	switch (selectedType) {
		case "category":
			return `${group}_category_page`;
		case "collection":
			return `${group}_collection_page`;
		case "sku":
			return `${group}_sku_page`;
		default:
			return null;
	}
}

// Param Tag for searching
export function getNameSearchTag(selectedType: TypesToSelect, group: Groups) {
	switch (selectedType) {
		case "category":
			return `${group}_category_search`;
		case "collection":
			return `${group}_collection_search`;
		case "sku":
			return `${group}_sku_search`;
		default:
			return null;
	}
}

export const groups = ["buy", "get", "fix", "order"] as const;

export function getAllSearchParams(groupArray: Groups[]) {
	const typesToSelect: TypesToSelect[] = ["category", "collection", "sku"];
	const paramTypes = ["categories", "collections", "skus"];

	let allParams = [
		...groupArray.flatMap((groupType) =>
			typesToSelect.flatMap((type) => [`${groupType}_${type}_search`, `${groupType}_${type}_page`]),
		),
	];

	for (const group of groups) {
		if (groupArray.includes(group)) {
			allParams = [...allParams, ...paramTypes.flatMap((type) => [`${group}_${type}`])];
		}
	}

	return allParams;
}

export const typeToParamMap: Record<TypesToSelect, string> = {
	category: "categories",
	collection: "collections",
	sku: "skus",
};
