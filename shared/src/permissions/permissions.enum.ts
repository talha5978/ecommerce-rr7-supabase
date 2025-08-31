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

	CREATE_ATTRIBUTES = "create_attributes",
	UPDATE_ATTRIBUTES = "update_attributes",
	DELETE_ATTRIBUTES = "delete_attributes",

	CREATE_PRODUCT_R_ATTRIBUTES = "create_product_related_attributes",
	DELETE_PRODUCT_R_ATTRIBUTES = "delete_product_related_attributes",

	CREATE_PRODUCT_VARIANTS = "create_product_variants",
	UPDATE_PRODUCT_VARIANTS = "update_product_variants",
	DELETE_PRODUCT_VARIANTS = "delete_product_variants",

	CREATE_META_DETAILS = "create_meta_details",
	UPDATE_META_DETAILS = "update_meta_details",
	DELETE_META_DETAILS = "delete_meta_details",

	CREATE_CATEGORIES = "create_sub_categories",
	UPDATE_CATEGORIES = "update_sub_categories",
	DELETE_CATEGORIES = "delete_sub_categories",

	CREATE_SUB_CATEGORIES = "create_categories",
	UPDATE_SUB_CATEGORIES = "update_categories",
	DELETE_SUB_CATEGORIES = "delete_categories",

	CREATE_COLLECTIONS = "create_collections",
	UPDATE_COLLECTIONS = "update_collections",
	DELETE_COLLECTIONS = "delete_collections",

	UPLOAD_IMAGES = "upload_images",
	DELETE_IMAGES = "delete_images",

	MANAGE_COUPONS = "manage_coupons",

	// Non-Service related permissions
	ACCESS_DASHBOARD = "access_dashboard",
}
