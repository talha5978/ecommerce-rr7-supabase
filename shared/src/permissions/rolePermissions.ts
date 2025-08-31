import { Permission, UserRole } from "@ecom/shared/permissions/permissions.enum";

export const rolePermissions: Record<UserRole, Permission[]> = {
	[UserRole.ADMIN]: [
		Permission.ADD_USERS,
		Permission.REMOVE_USERS,
		Permission.ADD_ADMINS,
		Permission.REMOVE_ADMINS,

		Permission.CREATE_META_DETAILS,
		Permission.UPDATE_META_DETAILS,
		Permission.DELETE_META_DETAILS,

		Permission.UPLOAD_IMAGES,
		Permission.DELETE_IMAGES,

		Permission.CREATE_PRODUCTS,
		Permission.UPDATE_PRODUCTS,
		Permission.DELETE_PRODUCTS,

		Permission.CREATE_CATEGORIES,
		Permission.UPDATE_CATEGORIES,
		Permission.DELETE_CATEGORIES,

		Permission.CREATE_SUB_CATEGORIES,
		Permission.UPDATE_SUB_CATEGORIES,
		Permission.DELETE_SUB_CATEGORIES,

		Permission.CREATE_PRODUCT_R_ATTRIBUTES,
		Permission.DELETE_PRODUCT_R_ATTRIBUTES,

		Permission.CREATE_PRODUCT_VARIANTS,
		Permission.UPDATE_PRODUCT_VARIANTS,
		Permission.DELETE_PRODUCT_VARIANTS,

		Permission.CREATE_COLLECTIONS,
		Permission.UPDATE_COLLECTIONS,
		Permission.DELETE_COLLECTIONS,

		Permission.MANAGE_COUPONS,
	],
	[UserRole.EMPLOYEE]: [
		Permission.ADD_USERS,
		Permission.CREATE_COLLECTIONS,
		Permission.UPDATE_COLLECTIONS,
		Permission.UPLOAD_IMAGES,
		Permission.DELETE_IMAGES,
	],
	[UserRole.CONSUMER]: [],
};
