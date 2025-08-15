import type { FullCoupon, GetFullCoupon } from "@ecom/shared/types/coupons";
import { memo, useMemo } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@ecom/shared/lib/utils";
import { DollarSignIcon, PercentIcon, ShoppingBagIcon, TagIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";

interface CouponDetailsCardProps {
	data: GetFullCoupon;
	className?: string;
}

export const CouponDetailsDialog = memo(({ data, className }: CouponDetailsCardProps) => {
	const coupon = data.coupon;
	if (coupon == null || data.error != null) {
		return <p>No data</p>;
	}

	const {
		code,
		description,
		status,
		coupon_type,
		discount_type,
		discount_value,
		start_timestamp,
		end_timestamp,
		created_at,
		main_simple_conditions,
		buy_x_get_y_conditions,
		order_conditions,
		customer_conditions,
		usage_conditions,
	} = coupon;

	const calculatedStatus = useMemo(() => {
		const now = new Date();
		const start = new Date(start_timestamp);
		const end = new Date(end_timestamp);
		if (now < start) return "Scheduled";
		if (now > end) return "Expired";
		return "Live";
	}, [start_timestamp, end_timestamp]);

	const getDiscountIcon = () => {
		switch (discount_type.toLowerCase()) {
			case "percentage":
				return <PercentIcon className="h-4 w-4 text-primary" />;
			case "fixed":
				return <DollarSignIcon className="h-4 w-4 text-primary" />;
			case "buy_x_get_y":
				return <ShoppingBagIcon className="h-4 w-4 text-primary" />;
			default:
				return <TagIcon className="h-4 w-4 text-primary" />;
		}
	};

	const createdAtLabel = (timestamp: string) => format(new Date(timestamp), "MMM dd, yyyy HH:mm");

	const generalItems = useMemo(
		() => [
			{ heading: "Code", value: code },
			{ heading: "Description", value: description || "N/A" },
			{ heading: "Coupon Type", value: coupon_type },
			{ heading: "Status", value: status ? "Active" : "Inactive" },
			{ heading: "Discount Type", value: discount_type },
			{ heading: "Discount Value", value: discount_value ? `${discount_value}` : "N/A" },
			{ heading: "Starts", value: start_timestamp },
			{ heading: "Expires", value: end_timestamp },
			{ heading: "Created", value: created_at || "" },
		],
		[
			code,
			description,
			coupon_type,
			status,
			discount_type,
			discount_value,
			start_timestamp,
			end_timestamp,
			created_at,
		],
	);

	return (
		<Card
			className={cn(
				"rounded-md border shadow-sm hover:shadow-lg transition-shadow duration-150",
				className,
			)}
		>
			<CardHeader className="border-b px-6 py-4">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-md">{getDiscountIcon()}</div>
						<div>
							<CardTitle className="text-xl font-semibold tracking-tight">{code}</CardTitle>
							<p
								className={cn(
									"text-sm font-medium",
									calculatedStatus === "Live" && "text-success/80",
									calculatedStatus === "Expired" && "text-destructive/70",
									calculatedStatus === "Scheduled" && "text-warning",
								)}
							>
								{calculatedStatus}
							</p>
						</div>
					</div>
					<Badge variant={status ? "success" : "destructive"} className="capitalize">
						{status ? "Active" : "Inactive"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="px-6 py-4 flex flex-col gap-6">
				{/* General Information */}
				<div>
					<h3 className="text-lg font-semibold mb-2">General</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						{generalItems.map((item, index) => (
							<div key={index} className="flex flex-col">
								<span className="text-muted-foreground">{item.heading}</span>
								<span className="font-medium">{item.value}</span>
							</div>
						))}
					</div>
				</div>

				{/* Main Simple Conditions */}
				{main_simple_conditions.length > 0 && (
					<div>
						<h3 className="text-lg font-semibold mb-2">Target Product Conditions</h3>
						<div className="space-y-2">
							{main_simple_conditions.map((condition, index) => (
								<div key={index} className="p-3 rounded-md text-sm">
									<p>
										<span className="font-medium">Type:</span> {condition.type}
									</p>
									<p>
										<span className="font-medium">Operator:</span> {condition.operator}
									</p>
									<p>
										<span className="font-medium">Value (Decimal):</span>{" "}
										{condition.value_decimal || "N/A"}
									</p>
									<p>
										<span className="font-medium">Value IDs:</span>{" "}
										{condition.value_ids?.join(", ") || "N/A"}
									</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Buy X Get Y Conditions */}
				{buy_x_get_y_conditions && (
					<div>
						<h3 className="text-lg font-semibold mb-2">Buy X Get Y Conditions</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
							<div>
								<p className="font-semibold">Buy Group</p>
								<p>
									<span className="font-medium">Min Value Type:</span>{" "}
									{buy_x_get_y_conditions.buy_group.min_value_type}
								</p>
								<p>
									<span className="font-medium">Min Value:</span>{" "}
									{buy_x_get_y_conditions.buy_group.min_value}
								</p>
								<p>
									<span className="font-medium">Entity Type:</span>{" "}
									{buy_x_get_y_conditions.buy_group.entitiy_type}
								</p>
								<p>
									<span className="font-medium">IDs:</span>{" "}
									{buy_x_get_y_conditions.buy_group.ids.join(", ") || "N/A"}
								</p>
							</div>
							<div>
								<p className="font-semibold">Get Group</p>
								<p>
									<span className="font-medium">Quantity:</span>{" "}
									{buy_x_get_y_conditions.get_group.get_quantity}
								</p>
								<p>
									<span className="font-medium">Discount %:</span>{" "}
									{buy_x_get_y_conditions.get_group.discount_percent}
								</p>
								<p>
									<span className="font-medium">Entity Type:</span>{" "}
									{buy_x_get_y_conditions.get_group.entitiy_type}
								</p>
								<p>
									<span className="font-medium">IDs:</span>{" "}
									{buy_x_get_y_conditions.get_group.ids.join(", ") || "N/A"}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Order Conditions */}
				<div>
					<h3 className="text-lg font-semibold mb-2">Order Conditions</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div>
							<p>
								<span className="font-medium">Min Purchase Qty:</span>{" "}
								{order_conditions.min_purchase_qty || "N/A"}
							</p>
							<p>
								<span className="font-medium">Min Purchase Amount:</span>{" "}
								{order_conditions.min_purchase_amount || "N/A"}
							</p>
							<p>
								<span className="font-medium">Max Uses/Order:</span>{" "}
								{order_conditions.max_uses_per_order || "Unlimited"}
							</p>
						</div>
						{order_conditions.conditions && order_conditions.conditions.length > 0 && (
							<div>
								<p className="font-semibold">Conditions</p>
								{order_conditions.conditions.map((condition, index) => (
									<div key={index} className="p-2 rounded-md mt-2">
										<p>
											<span className="font-medium">Type:</span> {condition.type}
										</p>
										<p>
											<span className="font-medium">Operator:</span>{" "}
											{condition.operator}
										</p>
										<p>
											<span className="font-medium">Value (Decimal):</span>{" "}
											{condition.value_decimal || "N/A"}
										</p>
										<p>
											<span className="font-medium">Value IDs:</span>{" "}
											{condition.value_ids?.join(", ") || "N/A"}
										</p>
										<p>
											<span className="font-medium">Min Quantity:</span>{" "}
											{condition.min_quantity}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Customer Conditions */}
				<div>
					<h3 className="text-lg font-semibold mb-2">Customer Conditions</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<p>
							<span className="font-medium">Customer Group:</span>{" "}
							{customer_conditions.customer_group || "N/A"}
						</p>
						<p>
							<span className="font-medium">Min Purchased Amount:</span>{" "}
							{customer_conditions.min_purchased_amount || "N/A"}
						</p>
						<p>
							<span className="font-medium">Customer Emails:</span>{" "}
							{customer_conditions.customer_emails.length > 0
								? customer_conditions.customer_emails.join(", ")
								: "None"}
						</p>
					</div>
				</div>

				{/* Usage Conditions */}
				<div>
					<h3 className="text-lg font-semibold mb-2">Usage Conditions</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<p>
							<span className="font-medium">Max Total Uses:</span>{" "}
							{usage_conditions.max_total_uses || "Unlimited"}
						</p>
						<p>
							<span className="font-medium">One Use/Customer:</span>{" "}
							{usage_conditions.one_use_per_customer ? "Yes" : "No"}
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-2 pt-4 border-t">
					<Button variant="outline" size="sm">
						Back
					</Button>
					<Button size="sm">Edit</Button>
				</div>
			</CardContent>
		</Card>
	);
});
