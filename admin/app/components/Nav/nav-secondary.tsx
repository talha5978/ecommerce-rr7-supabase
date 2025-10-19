import { memo, type ComponentPropsWithoutRef } from "react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Link, useRouteLoaderData } from "react-router";
import { secondaryNavItems } from "@ecom/shared/constants/nav-items";
import type { NavSubItem } from "@ecom/shared/types/nav";
import { getAccessibleSecondaryNavItems } from "@ecom/shared/utils/getAccessibleNavItems";
import { PolicyManager } from "@ecom/shared/permissions/policyManager";
import { UserRole } from "@ecom/shared/permissions/permissions.enum";
import { type loader as RootLoader } from "~/root";
import { AdminUser } from "@ecom/shared/types/user";

export const NavSecondary = memo(({ ...props }: ComponentPropsWithoutRef<typeof SidebarGroup>) => {
	const loaderData = useRouteLoaderData<typeof RootLoader>("root");
	const user: AdminUser | null = loaderData?.user ?? null;
	const policy = new PolicyManager((user?.role.role_name as UserRole) ?? "employee");
	const filteredNav = getAccessibleSecondaryNavItems(secondaryNavItems, policy);

	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{filteredNav.map((item: NavSubItem) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild>
								<Link to={item.url} viewTransition>
									<item.icon />
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
});
