import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { NavigationPane } from "~/components/Settings/Navigation";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Permission } from "@ecom/shared/permissions/permissions.enum";
import { protectLoader } from "~/utils/routeGuards";

export const loader = protectLoader({
	permissions: Permission.MANAGE_SETTINGS,
})(async () => {
	return null;
});

export default function SettingsMainPage() {
	return (
		<>
			<MetaDetails
				metaDescription="Manage all the settings according to the store here."
				metaTitle="Settings"
				metaKeywords="Settings, Store settings"
			/>
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
