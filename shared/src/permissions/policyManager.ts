import { Permission, UserRole } from "@ecom/shared/permissions/permissions.enum";
import { rolePermissions } from "@ecom/shared/permissions/rolePermissions";

export class PolicyManager {
	private readonly role;
	constructor(input: UserRole) {
		this.role = input;
	}

	hasPermission(permission: Permission): boolean {
		return rolePermissions[this.role].includes(permission);
	}

	hasAny(...permissions: Permission[]): boolean {
		return permissions.some((p) => this.hasPermission(p));
	}

	hasAll(...permissions: Permission[]): boolean {
		return permissions.every((p) => this.hasPermission(p));
	}
}
