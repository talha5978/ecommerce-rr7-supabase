import { NavLink, useLocation, useResolvedPath } from "react-router";
import { settingsNavItems } from "@ecom/shared/constants/nav-items";
import { memo } from "react";
import type { SettingsNavItem } from "@ecom/shared/types/nav";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";

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

export const NavigationPane = () => {
	return (
		<section className="bg-sidebar text-sidebar-foreground flex h-full flex-col py-2 rounded-lg settings-nav-width">
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
