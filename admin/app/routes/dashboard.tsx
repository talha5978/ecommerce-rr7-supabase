import type { Route } from "./+types/dashboard";
import { AdminDashboardService } from "@ecom/shared/services/admin-dashboard.service";
import { useLoaderData } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { DashboardMainChart, ProvincePiChart } from "~/components/Dashboard/charts";
import { TopSellingProductsList } from "~/components/Dashboard/TopSellingProducts";
import { StockThresholdList } from "~/components/Dashboard/StockThresholdList";
import { ReviewsSection } from "~/components/Dashboard/ReviewsSection";
import { TopAnalyticsBar } from "~/components/Dashboard/AnalyticsBar";
import { RecentOrdersList } from "~/components/Dashboard/RecentOrders";

export async function loader({ request }: Route.LoaderArgs) {
	const dashboardSvc = new AdminDashboardService(request);
	const mainChartData = await dashboardSvc.getSalesAndOrdersData();
	const lowStocksVariants = await dashboardSvc.getLowStockVariants();
	const topSellingProducts = await dashboardSvc.getTopSellingProducts();
	const provinceData = await dashboardSvc.getProvinceWiseSales();
	const recentOrders = await dashboardSvc.getRecentOrders();

	return { mainChartData, lowStocksVariants, topSellingProducts, provinceData, recentOrders };
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
					<RecentOrdersList orders={loaderData.recentOrders ?? []} />
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
