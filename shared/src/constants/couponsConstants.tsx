import type { DiscountCustomerGrps, DiscountType } from "@ecom/shared/types/coupons";
import { IconShoppingCartDiscount } from "@tabler/icons-react";
import {
	BadgePercent,
	DollarSign,
	Percent,
	PlusCircle,
	UserCog,
	UserLock,
	UserRoundCheck,
	Users,
} from "lucide-react";
import { type JSX } from "react";
import type { CouponTypesOption } from "@ecom/shared/types/coupons-comp";
import { format } from "date-fns";

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
];

export const CustomerGroupsLabels: Record<DiscountCustomerGrps, { label: string; icon: JSX.Element }> = {
	all: { label: "All", icon: <UserRoundCheck /> },
	admins: { label: "Admins", icon: <UserLock /> },
	employee: { label: "Employees", icon: <UserCog /> },
	consumer: { label: "General Customers", icon: <Users /> },
};

export const CouponTypeOptions: CouponTypesOption[] = [
	{
		label: "Manual Discount",
		description: "Cusomters will get a discount if they enter a code at checkout.",
		value: "manual",
		icon: <BadgePercent className="h-5 w-5" />,
	},
	{
		label: "Automatic Discount",
		description: "Cusomters will get a discount automatically in their cart.",
		value: "automatic",
		icon: <IconShoppingCartDiscount className="h-5 w-5" />,
	},
];

export const getDiscountAmntConstraint = (comp: "label" | "icon", discountType: DiscountType | undefined) => {
	if (discountType === "fixed_order" || discountType === "fixed_product") {
		return comp === "label" ? (
			"Amount"
		) : (
			<DollarSign className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground  " />
		);
	} else if (discountType === "percentage_order" || discountType === "percentage_product") {
		return comp === "label" ? (
			"Percentage"
		) : (
			<Percent className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground  " />
		);
	} else {
		return comp === "label" ? (
			"Value"
		) : (
			<PlusCircle className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground   rotate-45" />
		);
	}
};

export const getFullDateTimeFormat = (timeStamp: string) => format(new Date(timeStamp), "PPP hh:mm a");

export function getDefaultDates(): { start_timestamp: Date; end_timestamp: Date } {
	const today = new Date();

	// Set the time to 12 pm (noon)
	today.setHours(12, 0, 0, 0); // hours, minutes, seconds, milliseconds

	// Get the date after 5 days from now
	const delayedDate = new Date(today);
	delayedDate.setDate(delayedDate.getDate() + 5);
	delayedDate.setHours(12, 0, 0, 0); // set the time to 12 pm (noon) as well

	return {
		start_timestamp: today,
		end_timestamp: delayedDate,
	};
}

export const getCouponStatus = (startTimestamp: string, endTimestamp: string) => {
	const now = new Date();
	const start = new Date(startTimestamp);
	const end = new Date(endTimestamp);

	if (now < start) {
		return "Scheduled";
	} else if (now >= start && now < end) {
		return "Live";
	} else if (now >= end) {
		return "Expired";
	}
};
