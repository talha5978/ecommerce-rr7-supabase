import { type Permission } from "@ecom/shared/permissions/permissions.enum";

export interface NavSubItem {
	title: string;
	url: string;
	icon: JSX.Element;
	requiredPermission?: Permission;
}

export interface NavItem {
	title: string;
	items: NavSubItem[];
}

export type SettingsNavItem = {
	label: string;
	path: string;
	icon: JSX.Element;
	requiredPermission?: Permission;
};
