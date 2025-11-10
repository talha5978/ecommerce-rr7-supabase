export interface BreadcrumbItem {
	label: string;
	href: string;
}

type BreadcrumbGenerator = (params?: Record<string, string>) => BreadcrumbItem[];

const breadcrumbRegistry: Record<string, BreadcrumbGenerator> = {
	"/product/:productId/:metaUrl": (params) => [
		{ label: "Home", href: "/" },
		{
			label: params?.name ?? `Product ${params?.id}`,
			href: `/product/${params?.id}/${params?.metaUrl}`,
		},
	],
	"/cart": () => [
		{ label: "Home", href: "/" },
		{ label: "Cart", href: "/cart" },
	],
	"/cart/checkout": () => [
		{ label: "Home", href: "/" },
		{ label: "Cart", href: "/cart" },
		{ label: "Checkout", href: "/cart/checkout" },
	],
	"/favourites": () => [
		{ label: "Home", href: "/" },
		{ label: "Favourites", href: "/favourites" },
	],
};

export default breadcrumbRegistry;
