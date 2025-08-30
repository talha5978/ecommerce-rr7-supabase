import { ComponentProps } from "react";
import { NavMain } from "~/components/Nav/nav-main";
import { NavSecondary } from "~/components/Nav/nav-secondary";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Link } from "react-router";
import { ShoppingBagIcon } from "lucide-react";
import LogoutButton from "~/components/Auth/logout-button";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
							<Link to="/" prefetch="intent" viewTransition>
								<ShoppingBagIcon className="!size-5" />
								<span className="text-base font-semibold">Ecom. Admin</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain />
			</SidebarContent>
			<SidebarFooter>
				<NavSecondary className="mt-auto" />
				<LogoutButton />
			</SidebarFooter>
		</Sidebar>
	);
}
