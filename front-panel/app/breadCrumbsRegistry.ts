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
};

export default breadcrumbRegistry;
