import * as React from "react";
import {
	IconHelp,
	IconSettings,
} from "@tabler/icons-react";

import { NavItem, NavMain } from "~/components/Nav/nav-main";
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
import { Archive, Box, Gift, House, LinkIcon, Megaphone, ShoppingBagIcon, TableProperties, Tag, Users } from "lucide-react";
import LogoutButton from "../Auth/logout-button";

const mainNavItems = [
	{
		title: "Quick Links",
		items: [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: <House />,
			},
			{
				title: "New Product",
				url: "/products/dfadfasdfadfa",
				icon: <Archive />,
			},
			{
				title: "New Coupon",
				url: "/coupons/fasdfadfafasdf",
				icon: <Gift />,
			},
		],
	},
	{
		title: "Catalog",
		items: [
			{
				title: "Products",
				url: "/products",
				icon: <Archive />,
			},
			{
				title: "Categories",
				url: "/categories",
				icon: <LinkIcon />,
			},
			{
				title: "Collections",
				url: "/collections",
				icon: <Tag />,
			},
			{
				title: "Attributes",
				url: "/attributes",
				icon: <TableProperties />,
			},
		],
	},
	{
		title: "Sales",
		items: [
			{
				title: "Orders",
				url: "/orders",
				icon: <Box />,
			},
			{
				title: "Customers",
				url: "/customers",
				icon: <Users />,
			},
		],
	},
	{
		title: "Promotions",
		items: [
			{
				title: "Coupons",
				url: "/coupons",
				icon: <Gift />,
			},

			{
				title: "Announcements",
				url: "/announcements",
				icon: <Megaphone />,
			},
		],
	},
];

const secondaryNavItems = [
	{
		title: "Settings",
		url: "#",
		icon: IconSettings,
	},
	{
		title: "Get Help",
		url: "#",
		icon: IconHelp,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
							<Link to="/dashboard" prefetch="intent">
								<ShoppingBagIcon className="!size-5" />
								<span className="text-base font-semibold">Ecom. Admin</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={mainNavItems as NavItem[]} />
			</SidebarContent>
			<SidebarFooter>
				<NavSecondary items={secondaryNavItems} className="mt-auto" />
				<LogoutButton />
			</SidebarFooter>
		</Sidebar>
	);
}
