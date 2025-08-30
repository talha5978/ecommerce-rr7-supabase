import { memo, type ComponentPropsWithoutRef } from "react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Link } from "react-router";
import { secondaryNavItems } from "@ecom/shared/constants/nav-items";
import type { NavSubItem } from "@ecom/shared/types/nav";

export const NavSecondary = memo(({ ...props }: ComponentPropsWithoutRef<typeof SidebarGroup>) => {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{secondaryNavItems.map((item: NavSubItem) => (
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
