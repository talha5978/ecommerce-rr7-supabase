import { IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

const getTopAnalytics = (
	total_revenue: string,
	total_orders: string,
	total_customers: string,
	avg_order_value: string,
) => {
	return [
		{
			title: "Total Revenue",
			value: total_revenue,
			footer: "Using data from all time",
			badge: "+12%",
		},
		{
			title: "Total Orders",
			value: total_orders,
			footer: "Using data from all time",
			badge: "+12%",
		},
		{
			title: "Total Customers",
			value: total_customers,
			footer: "Using data from all time",
			badge: "+12%",
		},
		{
			title: "Avg. Order Value",
			value: avg_order_value,
			footer: "From the data of past 6 months",
			badge: "+12%",
		},
	];
};

const AnalyticsCard = ({
	title,
	value,
	footer,
	badge,
	...props
}: {
	title: string;
	value: string;
	footer?: string;
	badge?: string;
}) => {
	return (
		<Card className="@container/card" {...props}>
			<CardHeader>
				<CardDescription>{title}</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-2xl">
					{value}
				</CardTitle>
				{badge && (
					<CardAction>
						<Badge variant="outline">
							<IconTrendingUp />
							{badge}
						</Badge>
					</CardAction>
				)}
			</CardHeader>
			{footer && (
				<CardFooter className="text-sm">
					<div className="text-muted-foreground">{footer}</div>
				</CardFooter>
			)}
		</Card>
	);
};

export const TopAnalyticsBar = () => {
	const data = getTopAnalytics("$19M+", "987", "500", "$120.00");

	return (
		<div className="*:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-4 shrink-0 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{data.map((i, idx) => {
				return (
					<AnalyticsCard
						title={i.title}
						value={i.value}
						footer={i.footer}
						badge={i.badge}
						key={idx}
					/>
				);
			})}
		</div>
	);
};
