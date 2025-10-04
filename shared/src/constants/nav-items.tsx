import { IconHelp, IconSettings } from "@tabler/icons-react";
import {
	Archive,
	Bell,
	Box,
	Boxes,
	CreditCard,
	Gift,
	House,
	LinkIcon,
	Megaphone,
	RectangleHorizontal,
	ShoppingCart,
	TableProperties,
	Tag,
	Truck,
	Users,
} from "lucide-react";
import type { NavItem, NavSubItem, SettingsNavItem } from "@ecom/shared/types/nav";
import { Permission } from "@ecom/shared/permissions/permissions.enum";

export const mainNavItems: NavItem[] = [
	{
		title: "Quick Links",
		items: [
			{
				title: "Dashboard",
				url: "/",
				icon: <House />,
			},
			{
				title: "New Product",
				url: "/products/create",
				icon: <Archive />,
				requiredPermission: Permission.CREATE_PRODUCTS,
			},
			{
				title: "New Collection",
				url: "/collections/create",
				icon: <Tag />,
				requiredPermission: Permission.CREATE_COLLECTIONS,
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
				title: "All Units",
				url: "/all-product-units",
				icon: <Boxes />,
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
				title: "Product Attributes",
				url: "/product-attributes",
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
		title: "Promotion",
		items: [
			{
				title: "Coupons",
				url: "/coupons",
				icon: <Gift />,
				requiredPermission: Permission.MANAGE_COUPONS,
			},
			{
				title: "Announcements",
				url: "/announcements",
				icon: <Megaphone />,
			},
		],
	},
	{
		title: "Content",
		items: [
			{
				title: "Hero Sections",
				url: "/hero-sections",
				icon: <RectangleHorizontal />,
			},
		],
	},
];

export const secondaryNavItems: NavSubItem[] = [
	{
		title: "Settings",
		url: "/settings",
		icon: IconSettings,
	},
	{
		title: "Get Help",
		url: "#",
		icon: IconHelp,
	},
];

export const settingsNavItems: SettingsNavItem[] = [
	{
		label: "Store Details",
		path: "/settings/store-details",
		icon: <House />,
	},
	{
		label: "Payments",
		path: "/settings/abcd",
		icon: <CreditCard />,
	},
	{
		label: "Checkouts",
		path: "/settings/gfh",
		icon: <ShoppingCart />,
	},
	{
		label: "Shipping and Dilivery",
		path: "/settings/fds",
		icon: <Truck />,
	},
	{
		label: "Notifications",
		path: "/settings/afdsgd",
		icon: <Bell />,
	},
];
