export type SearchEntry = {
	id: string;
	label: string;
	keywords?: string[];
	url: string;
    action?: () => void;
    entry_type?: "action" | "page";
};

export const searchRegistry: SearchEntry[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		keywords: ["home", "main", "overview"],
		url: "/",
        entry_type: "page"
	},

	// Categories
	{
		id: "categories",
		label: "Categories",
		keywords: ["category", "manage categories", "list"],
		url: "/categories",
        entry_type: "page"
	},
	{
		id: "create-category",
		label: "Create Category",
		keywords: ["new category", "add category"],
		url: "/categories/create",
        entry_type: "page"
	},
	// Products
	{
		id: "products",
		label: "Products",
		keywords: ["items", "catalog", "inventory"],
		url: "/products",
        entry_type: "page"
	},
	{
		id: "create-product",
		label: "Create Product",
		keywords: ["new product", "add product"],
		url: "/products/create",
        entry_type: "page"
	},
	{
		id: "update-product",
		label: "Update Product",
		keywords: ["edit product"],
		url: "/products/:productId/update",
        entry_type: "page"
	},
	{
		id: "all-product-units",
		label: "All Product Units",
		keywords: ["units", "measurements"],
		url: "/all-product-units",
        entry_type: "page"
	},

	// Product Attributes
	{
		id: "product-attributes",
		label: "Product Attributes",
		keywords: ["attributes", "features"],
		url: "/product-attributes",
        entry_type: "page"
	},
	{
		id: "create-attribute-main",
		label: "Create Product Attribute",
		keywords: ["new attribute"],
		url: "/product-attributes/create",
        entry_type: "page"
	},

	// Collections
	{
		id: "collections",
		label: "Collections",
		keywords: ["group", "bundle", "set"],
		url: "/collections",
        entry_type: "page"
	},
	{
		id: "create-collection",
		label: "Create Collection",
		keywords: ["new collection"],
		url: "/collections/create",
        entry_type: "page"
	},

	// Coupons
	{
		id: "coupons",
		label: "Coupons",
		keywords: ["discount", "voucher", "promo"],
		url: "/coupons",
        entry_type: "page"
	},
	{
		id: "create-manual-coupon",
		label: "Create Manual Coupon",
		keywords: ["new manual coupon", "add manual coupon"],
		url: "/coupons/create/manual",
        entry_type: "page"
	},
    {
		id: "create-auto-coupon",
		label: "Create Automatic Coupon",
		keywords: ["new automatic coupon", "add automatic coupon"],
		url: "/coupons/create/automatic",
        entry_type: "page"
	},
];
