import type { Route } from "./+types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { memo } from "react";
import { AdminDashboardService } from "@ecom/shared/services/admin-dashboard.service";
import { useLoaderData } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { DashboardMainChart, ProvincePiChart } from "~/components/Dashboard/charts";
import { TopSellingProductsList } from "~/components/Dashboard/TopSellingProducts";
import { StockThresholdList } from "~/components/Dashboard/StockThresholdList";
import { ReviewsSection } from "~/components/Dashboard/ReviewsSection";
import { TopAnalyticsBar } from "~/components/Dashboard/AnalyticsBar";

export async function loader({ request }: Route.LoaderArgs) {
	const dashboardSvc = new AdminDashboardService(request);
	const mainChartData = await dashboardSvc.getSalesAndOrdersData();
	const lowStocksVariants = await dashboardSvc.getLowStockVariants();
	const topSellingProducts = await dashboardSvc.getTopSellingProducts();
	const provinceData = await dashboardSvc.getProvinceWiseSales();

	return { mainChartData, lowStocksVariants, topSellingProducts, provinceData };
}

export default function Dashboard() {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle="Dashboard | Admin Panel"
				metaDescription="Admin Dashboard"
				metaKeywords="dashboard, home"
			/>
			<div className="space-y-4 [&>.sec2]:grid [&>.sec2]:grid-cols-2 [&>.sec2]:gap-4">
				<h1 hidden>Dashboard</h1>
				<TopAnalyticsBar />
				<DashboardMainChart chartData={loaderData.mainChartData.data ?? []} />
				<div className="sec2">
					<TopSellingProductsList products={loaderData.topSellingProducts.products ?? []} />
					<RecentOrdersList />
				</div>
				<div className="sec2">
					<StockThresholdList products={loaderData.lowStocksVariants.products ?? []} />
					<ProvincePiChart chartData={loaderData.provinceData.data ?? []} />
				</div>
				<ReviewsSection />
			</div>
		</>
	);
}

const RecentOrder = () => {
	return (
		<div className="flex gap-4">
			{/* Show the customer name, email, phone number, order, payment status, total amount, and order date and orders in the form SKU1 x2, SKU2 x3 and 3 more and also take the user to details page */}
		</div>
	);
};

const RecentOrdersList = memo(() => {
	return (
		<Card className="w-full">
			<CardHeader className="border-b py-2">
				<CardTitle>
					<h2>Recent Orders</h2>
				</CardTitle>
				<CardDescription>Here are the most recent orders on your store</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4"></CardContent>
		</Card>
	);
});
