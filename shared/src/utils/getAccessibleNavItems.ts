import { type PolicyManager } from "@ecom/shared/permissions/policyManager";
import type { NavSubItem, NavItem } from "@ecom/shared/types/nav";

export function getAccessibleNavItems(navItems: NavItem[], policy: PolicyManager): NavItem[] {
	return navItems
		.map((section: NavItem) => ({
			...section,
			items: section.items.filter((item: NavSubItem) =>
				item.requiredPermission ? policy.hasPermission(item.requiredPermission) : true,
			),
		}))
		.filter((section: NavItem) => section.items.length > 0);
}

export function getAccessibleSecondaryNavItems(navItems: NavSubItem[], policy: PolicyManager): NavSubItem[] {
	return navItems.filter((item: NavSubItem) =>
		item.requiredPermission ? policy.hasPermission(item.requiredPermission) : true,
	);
}
