import { Permission, UserRole } from "@ecom/shared/permissions/permissions.enum";

export const rolePermissions: Record<UserRole, Permission[]> = {
	[UserRole.ADMIN]: [
		Permission.ADD_USERS,
		Permission.REMOVE_USERS,
		Permission.ADD_ADMINS,
		Permission.REMOVE_ADMINS,

		Permission.ACCESS_DASHBOARD,

		Permission.CREATE_PRODUCTS,
		Permission.UPDATE_PRODUCTS,
		Permission.DELETE_PRODUCTS,

		Permission.CREATE_COLLECTIONS,
		Permission.UPDATE_COLLECTIONS,

		Permission.MANAGE_COUPONS,
	],
	[UserRole.EMPLOYEE]: [
		Permission.ADD_USERS,
		Permission.ACCESS_DASHBOARD,
		Permission.CREATE_COLLECTIONS,
		Permission.UPDATE_COLLECTIONS,
	],
	[UserRole.CONSUMER]: [],
};
