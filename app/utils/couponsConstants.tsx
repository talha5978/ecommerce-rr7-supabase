import { UserCog, UserLock, UserRoundCheck, Users } from "lucide-react";
import { JSX } from "react";
import type {
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
