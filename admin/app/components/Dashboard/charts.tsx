import { IconSwitch3, IconTableExport } from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";
import { Button } from "~/components/ui/button";
import { memo, useMemo, useState } from "react";
import DateRangePicker from "~/components/Custom-Inputs/date-range-picker";
import { ACTIVE_PROVINCES } from "@ecom/shared/constants/constants";
import { TrendingUp } from "lucide-react";
// import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import type { MainBarChartData, ProvinceSalesDataItem } from "@ecom/shared/types/admin-dashboard";

const chartConfig = {
	sales: {
		label: "Sales",
		color: "var(--chart-2)",
	},
	orders: {
		label: "Orders",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export const DashboardMainChart = memo(({ chartData }: { chartData: MainBarChartData["data"] }) => {
	const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("sales");

	const handleToggle = () => {
		setActiveChart((prev) => (prev === "sales" ? "orders" : "sales"));
	};

	return (
		<Card className="py-0">
			<CardHeader className="flex justify-between border-b sm:flex-row p-6">
				<div className="flex gap-4">
					<div>
						<Button onClick={handleToggle} size={"icon"} variant={"outline"}>
							<IconSwitch3 />
						</Button>
					</div>
					<div className="flex flex-1 flex-col justify-center gap-1">
						<CardTitle>
							<h2>{activeChart == "sales" ? "Sales" : "Orders"}</h2>
						</CardTitle>
						<CardDescription>
							{activeChart == "sales"
								? "Showing total sales over the last 30 days"
								: "Showing total orders over the last 30 days"}
						</CardDescription>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant={"outline"}>
						<IconTableExport />
						<p>Export</p>
					</Button>
					<DateRangePicker />
				</div>
			</CardHeader>
			<CardContent className="px-2 sm:[pl-2 pr-6 pb-6 pt-2]">
				<ChartContainer config={chartConfig} className="aspect-auto h-[250px] bg-red- w-full">
					<BarChart
						accessibilityLayer
						data={chartData}
						title={activeChart == "sales" ? "Sales Chart" : "Orders Chart"}
						margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
					>
						<CartesianGrid vertical={false} horizontal={true} />
						<XAxis
							dataKey="date"
							tickLine={true}
							axisLine={false}
							tickMargin={10}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<YAxis tickLine={true} axisLine={false} tickMargin={12} minTickGap={4} />
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="w-[150px] bg-background py-2"
									nameKey={activeChart}
									title={activeChart}
									accessibilityLayer
									labelFormatter={(value) => {
										return new Date(value).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										});
									}}
									formatter={(value) => {
										const formattedValue =
											activeChart == "orders"
												? value
												: value.toLocaleString("en-IN") + " PKR";

										return (
											<div className="flex w-full justify-between gap-1">
												<p>
													{activeChart.charAt(0).toUpperCase() +
														activeChart.slice(1)}
												</p>
												<p>{formattedValue}</p>
											</div>
										);
									}}
								/>
							}
						/>
						<Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
});

const provinceChartConfig = {
	sales: {
		label: "Orders",
	},
	punjab: {
		label: "Punjab",
		color: "var(--chart-1)",
	},
	sindh: {
		label: "Sindh",
		color: "var(--chart-2)",
	},
	balochistan: {
		label: "Balochistan",
		color: "var(--chart-3)",
	},
	KPK: {
		label: "KPK",
		color: "var(--chart-4)",
	},
	unknown: {
		label: "unknown",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

const PROVINCE_COLORS = Array.from({ length: 4 }, (_, index) => `var(--chart-${index + 1})`);

type SalesPiChartInput = { province: string; sales: number; fill: string }[];

export function formatProvinceSalesForPieChart(data: ProvinceSalesDataItem[]): SalesPiChartInput {
	const dataMap = new Map<string, number>();
	data.forEach((item) => {
		const key = item.province.toLowerCase();
		dataMap.set(key, item.sales);
	});

	const result: SalesPiChartInput = [];

	ACTIVE_PROVINCES.forEach((prov, index) => {
		const normalized = prov.toLowerCase();
		const sales = dataMap.get(normalized) ?? 0;

		result.push({
			province: prov,
			sales,
			fill: PROVINCE_COLORS[index],
		});

		dataMap.delete(normalized);
	});

	// Handle any unexpected provinces (e.g. "Unknown") with the fallback color
	if (dataMap.size > 0) {
		let fallbackIndex = ACTIVE_PROVINCES.length; // starts at index 4
		dataMap.forEach((sales, provinceKey) => {
			result.push({
				province: provinceKey === "unknown" ? "unknown" : provinceKey,
				sales,
				fill: PROVINCE_COLORS[fallbackIndex % PROVINCE_COLORS.length],
			});
			fallbackIndex++;
		});
	}

	// Sort by sales descending
	result.sort((a, b) => b.sales - a.sales);

	return result;
}

export const ProvincePiChart = memo(({ chartData }: { chartData: ProvinceSalesDataItem[] }) => {
	const salesChartData = useMemo(() => formatProvinceSalesForPieChart(chartData), [chartData]);

	return (
		<Card className="flex flex-col">
			<CardHeader className="border-b py-2">
				<CardTitle>
					<h2>Provinces Sales</h2>
				</CardTitle>
				<CardDescription>
					Here are province wise sales distribution in Pakistan till date
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={provinceChartConfig}
					className="[&_.recharts-pie-label-text]:fill-foreground [&_.recharts-pie-label-text]:text-[0.85rem] mx-auto aspect-square max-h-[330px]"
				>
					<PieChart>
						<ChartTooltip
							cursor={true}
							content={<ChartTooltipContent className="bg-background" accessibilityLayer />}
						/>
						<Pie
							dataKey="sales"
							data={salesChartData}
							nameKey="province"
							innerRadius={65}
							label
							strokeWidth={8}
							activeIndex={0}
							// activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
							// 	<Sector {...props} outerRadius={outerRadius + 10} />
							// )}
						/>
						<ChartLegend
							content={<ChartLegendContent nameKey="province" />}
							className="mt-2 -translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col gap-2 text-sm">
				<div className="flex items-center gap-2 leading-none font-medium">
					Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
				</div>
				<div className="text-muted-foreground leading-none">
					Showing total visitors for the last 6 months
				</div>
			</CardFooter>
		</Card>
	);
});
