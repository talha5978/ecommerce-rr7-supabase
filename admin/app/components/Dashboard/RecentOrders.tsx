import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { memo, useMemo, useState } from "react";
import { Link } from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Badge } from "~/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import type { RecentOrder } from "@ecom/shared/types/admin-dashboard";

function RecentOrderTile({ order }: { order: RecentOrder }) {
	const {
		order_id,
		customer_name,
		customer_email,
		customer_phone,
		payment_status,
		total_amount,
		currency = "PKR",
		order_date,
		items,
		avatar_url,
	} = order;

	const displayedItems = items.slice(0, 2);
	const remainingCount = Math.max(0, items.length - displayedItems.length);
	const itemsSummary = `${displayedItems
		.map((i) => `${i.sku} x${i.qty}`)
		.join(", ")}${remainingCount > 0 ? ` and ${remainingCount} more` : ""}`;

	const amountString = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: currency === "PKR" ? "PKR" : currency,
		maximumFractionDigits: 2,
	}).format(total_amount as number);

	const dateString = new Date(order_date).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<Link
			to={`/orders/order/${order_id}`}
			className="block group"
			aria-label={`Open order ${order_id} details for ${customer_name}`}
		>
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-muted/80 dark:hover:bg-muted-foreground/10 px-5 py-4 transition-colors duration-150 ease-in-out rounded-lg">
				<div className="flex items-start md:items-center gap-3 w-full md:w-1/2">
					<Avatar className="w-12 h-12 rounded-full">
						<AvatarImage src={avatar_url ?? ""} alt={"Customer"} />
						<AvatarFallback className="rounded-lg">{customer_name}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-medium truncate">{customer_name}</h3>

							<Tooltip>
								<TooltipTrigger asChild>
									<Badge className="text-xs">{payment_status}</Badge>
								</TooltipTrigger>
								<TooltipContent side="bottom">Payment status</TooltipContent>
							</Tooltip>
						</div>

						<div className="mt-1 text-xs text-muted-foreground truncate">
							{customer_email ?? "—"} • {customer_phone ?? "—"}
						</div>

						<div className="mt-1 text-sm truncate">{itemsSummary}</div>
					</div>
				</div>

				<div className="flex items-center gap-4 mt-2 md:mt-0">
					<div className="text-right">
						<div className="text-sm font-semibold truncate">{amountString}</div>
						<div className="text-xs text-muted-foreground">{dateString}</div>
					</div>

					<div className="opacity-0 group-hover:opacity-100 transition-opacity">
						<ArrowRight className="h-4 w-4 " />
					</div>
				</div>
			</div>
		</Link>
	);
}

export const RecentOrdersList = memo(({ orders }: { orders: RecentOrder[] }) => {
	const [showAll, setShowAll] = useState<boolean>(false);

	const displayedOrders = useMemo(() => (showAll ? orders : orders.slice(0, 3)), [showAll, orders]);

	const hasMore = orders.length > 3;

	return (
		<Card className="w-full">
			<CardHeader className="border-b py-2">
				<CardTitle>
					<h2>Recent Orders</h2>
				</CardTitle>
				<CardDescription>Here are the most recent orders on your store</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 pt-4">
				<div>
					{displayedOrders.length === 0 ? (
						<div className="flex items-center justify-center w-full pt-6">
							<p className="text-sm text-muted-foreground">No recent orders this week</p>
						</div>
					) : (
						<ul className="space-y-1">
							{displayedOrders.map((order) => (
								<li key={order.order_id}>
									<RecentOrderTile order={order} />
								</li>
							))}
						</ul>
					)}
				</div>
				{hasMore && (
					<div className="pt-4">
						<Button variant="outline" className="w-full" onClick={() => setShowAll(!showAll)}>
							{showAll ? "Show Less" : `Show All (${orders.length})`}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
});
