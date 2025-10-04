import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { NavLink, Outlet, useLocation, useResolvedPath } from "react-router";
import { settingsNavItems } from "@ecom/shared/constants/nav-items";
import { memo } from "react";
import type { SettingsNavItem } from "@ecom/shared/types/nav";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "~/components/ui/sidebar";

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

const NavigationPane = () => {
	return (
		<section className="bg-sidebar text-sidebar-foreground flex h-full flex-col py-2 rounded-lg sm:max-w-[var(--sidebar-width)] max-w-[--sidebar-width]">
			<SidebarGroup>
				<SidebarGroupContent className="flex flex-col gap-2">
					<SidebarMenu>
						{settingsNavItems.map((item) => (
							<SidebarMenuItem key={item.label}>
								<NavigationItem icon={item.icon} label={item.label} path={item.path} />
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</section>
	);
};

const NavigationItem = memo(({ path, icon, label }: SettingsNavItem) => {
	const location = useLocation();
	const resolved = useResolvedPath(path);

	const isActive = location.pathname === resolved.pathname;

	return (
		<SidebarMenuButton
			key={label}
			className={isActive ? "pointer-events-none" : ""}
			tooltip={label}
			asChild
		>
			<NavLink
				key={label}
				to={path}
				className={isActive ? "bg-sidebar-accent" : ""}
				prefetch="intent"
				viewTransition
			>
				{icon && <>{icon}</>}
				<span>{label}</span>
			</NavLink>
		</SidebarMenuButton>
	);
});
