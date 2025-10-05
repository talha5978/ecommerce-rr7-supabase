import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { NavigationPane } from "~/components/Settings/Navigation";

export const loader = () => {
	return null;
};

export default function SettingsMainPage() {
	return (
		<>
			<Breadcrumbs />
			<PageLayout />
		</>
	);
}

const PageLayout = () => {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<NavigationPane />
			<SidebarInset>
				<section className="flex flex-1 flex-col @container/main p-4">
					<Outlet />
				</section>
			</SidebarInset>
		</SidebarProvider>
	);
};
