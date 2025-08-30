// This roles enum are hardcoded here we dont have any enum in DB so create these roles in db first or change them here according to requirement
export enum UserRole {
	ADMIN = "admin",
	EMPLOYEE = "employee",
	CONSUMER = "consumer",
}

export enum Permission {
	// Service-related permissions
	ADD_USERS = "add_users",
	REMOVE_USERS = "remove_users",
	ADD_ADMINS = "add_admins",
	REMOVE_ADMINS = "remove_admins",

	CREATE_PRODUCTS = "create_products",
	UPDATE_PRODUCTS = "update_products",
	DELETE_PRODUCTS = "delete_products",

	CREATE_COLLECTIONS = "create_collections",
	UPDATE_COLLECTIONS = "update_collections",
	DELETE_COLLECTIONS = "delete_collections",

	MANAGE_COUPONS = "manage_coupons",

	// Non-Service related permissions
	ACCESS_DASHBOARD = "access_dashboard",
}
