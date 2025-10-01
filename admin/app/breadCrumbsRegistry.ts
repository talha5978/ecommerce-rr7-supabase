export interface BreadcrumbItem {
	label: string;
	href: string;
}

type BreadcrumbGenerator = (params?: Record<string, string>) => BreadcrumbItem[];

const breadcrumbRegistry: Record<string, BreadcrumbGenerator> = {
	"/": () => [{ label: "Home", href: "/" }],

	"/all-product-units": () => [
		{ label: "Home", href: "/" },
		{ label: "All Product Units", href: "/all-product-units" },
	],

	"/products": () => [
		{ label: "Home", href: "/" },
		{ label: "Products", href: "/products" },
	],

	"/products/create": () => [
		{ label: "Home", href: "/" },
		{ label: "Products", href: "/products" },
		{ label: "Create Product", href: "/products/create" },
	],

	"/products/:productId/update": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Products", href: "/products" },
		{
			label: params?.name ?? `Product ${params?.id}`,
			href: `/products/${params?.id}/update`,
		},
	],

	"/products/:productId/variants": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Products", href: "/products" },
		{
			label: params?.name ?? `Product Variants`,
			href: `/products/${params?.id}/variants`,
		},
	],

	"/products/:productId/variants/create": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Products", href: "/products" },
		{
			label: `Product Variants`,
			href: `/products/${params?.productId}/variants`,
		},
		{
			label: "Create Variant",
			href: `/products/${params?.productId}/variants/create`,
		},
	],

	"/products/:productId/variants/:variantId/update": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Products", href: "/products" },
		{
			label: `Product Variants`,
			href: `/products/${params?.productId}/variants`,
		},
		{
			label: params?.name ?? `Variant ${params?.variantId}`,
			href: `/products/${params?.productId}/variants/${params?.variantId}/update`,
		},
	],

	"/categories": () => [
		{ label: "Home", href: "/" },
		{ label: "Categories", href: "/categories" },
	],

	"/categories/create": () => [
		{ label: "Home", href: "/" },
		{ label: "Categories", href: "/categories" },
		{ label: "Create Category", href: "/categories/create" },
	],

	"/categories/:categoryId/update": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Categories", href: "/categories" },
		{
			label: params?.name ?? `Category ${params?.id}`,
			href: `/categories/${params?.id}/update`,
		},
	],

	"/categories/:categoryId/sub-categories": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Categories", href: "/categories" },
		{
			label: "Sub Categories",
			href: `/categories/${params?.id}/sub-categories`,
		},
	],

	"/categories/:categoryId/sub-categories/create": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Categories", href: "/categories" },
		{
			label: "Sub Categories",
			href: `/categories/${params?.id}/sub-categories`,
		},
		{ label: "Create", href: `/categories/${params?.id}/sub-categories/create` },
	],

	"/categories/:categoryId/sub-categories/:subCategoryId/update": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Categories", href: "/categories" },
		{
			label: "Sub Categories",
			href: `/categories/${params?.parentId}/sub-categories`,
		},
		{
			label: params?.name ?? `Sub category ${params?.subId}`,
			href: `/categories/${params?.parentId}/sub-categories/${params?.subId}/update`,
		},
	],

	"/collections": () => [
		{ label: "Home", href: "/" },
		{ label: "Collections", href: "/collections" },
	],

	"/collections/create": () => [
		{ label: "Home", href: "/" },
		{ label: "Collections", href: "/collections" },
		{ label: "Create Collection", href: "/collections/create" },
	],

	"/collections/:collectionId/update": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Collections", href: "/collections" },
		{
			label: params?.name ?? `Collection ${params?.id}`,
			href: `/collections/${params?.id}/update`,
		},
	],

	"/product-attributes": () => [
		{ label: "Home", href: "/" },
		{ label: "Product Attributes", href: "/product-attributes" },
	],

	"/product-attributes/:attributeType/values": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Product Attributes", href: "/product-attributes" },
		{
			label: params?.name ?? `Product Attributes ${params?.id}`,
			href: `/product-attributes/${params?.attrib_type}/values`,
		},
	],

	"/coupons": () => [
		{ label: "Home", href: "/" },
		{ label: "Coupons", href: "/coupons" },
	],

	"/coupons/create/:couponType": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Coupons", href: "/coupons" },
		{
			label: `Create ${
				params?.couponType
					? params?.couponType.charAt(0).toUpperCase() + params?.couponType.slice(1)
					: ""
			} Coupon`,
			href: `/coupons/create/${params?.couponType}`,
		},
	],

	"/coupons/coupon/:couponId": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Coupons", href: "/coupons" },
		{
			label: params?.couponCode ?? `Product ${params?.couponId}`,
			href: `/coupons/coupon/${params?.couponId}`,
		},
	],

	"/hero-sections": () => [
		{ label: "Home", href: "/" },
		{ label: "Hero Sections", href: "/hero-sections" },
	],

	"/hero-sections/create": () => [
		{ label: "Home", href: "/" },
		{ label: "Hero Sections", href: "/hero-sections" },
		{ label: "Create Hero Section", href: "/hero-sections/create" },
	],

	"/hero-sections/:hero_section_id/update": (params) => [
		{ label: "Home", href: "/" },
		{ label: "Hero Sections", href: "/hero-sections" },
		{
			label: `Update Hero Section #${params?.id}`,
			href: `/hero-sections/${params?.id}/update`,
		},
	],
};

export default breadcrumbRegistry;
