import { memo } from "react";
import { NavLink, useLocation, useResolvedPath, useRouteLoaderData } from "react-router";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubItem,
} from "~/components/ui/sidebar";
import type { NavSubItem } from "@ecom/shared/types/nav";
import { mainNavItems } from "@ecom/shared/constants/nav-items";
import { PolicyManager } from "@ecom/shared/permissions/policyManager";
import { getAccessibleNavItems } from "@ecom/shared/utils/getAccessibleNavItems";
import { type loader as RootLoader } from "~/root";
import { UserRole } from "@ecom/shared/permissions/permissions.enum";
import type { AdminUser } from "@ecom/shared/types/user";

const SubItem = memo(({ url, icon, title }: NavSubItem) => {
	const location = useLocation();
	const resolved = useResolvedPath(url);

	const isActive = location.pathname === resolved.pathname;

	return (
		<SidebarMenuSubItem key={title} className={isActive ? "pointer-events-none" : ""}>
			<SidebarMenuButton tooltip={title} asChild>
				<NavLink
					to={url}
					className={isActive ? "bg-sidebar-accent" : ""}
					prefetch="intent"
					viewTransition
				>
					{icon && <>{icon}</>}
					<span>{title}</span>
				</NavLink>
			</SidebarMenuButton>
		</SidebarMenuSubItem>
	);
});

export function NavMain() {
	const loaderData = useRouteLoaderData<typeof RootLoader>("root");
	const user: AdminUser | null = loaderData?.user ?? null;

	let navItems = mainNavItems;

	if (user) {
		const policy = new PolicyManager(user.role.role_name as UserRole);
		const filteredNav = getAccessibleNavItems(mainNavItems, policy);
		navItems = filteredNav;
	}

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{navItems.map((item) => (
						<SidebarMenuItem key={item.title}>
							<span className="font-medium text-muted-foreground">{item.title}</span>
							<SidebarMenuSub className="mt-1">
								{Array.isArray(item.items) &&
									item.items?.map((subItem, index) => (
										<SubItem
											key={(subItem.title + index).toString()}
											url={subItem.url}
											icon={subItem.icon}
											title={subItem.title}
										/>
									))}
							</SidebarMenuSub>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
