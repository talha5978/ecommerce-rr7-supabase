import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import CollectionsSection from "~/components/Collections/CollectionsSections";
import HeroSection from "~/components/Hero/HeroSection";
import FeaturedProductsSection from "~/components/Products/FeaturedProductsSection";
import { getAllFPCollections } from "~/queries/collections.q";
import { getAllFPHeroSections } from "~/queries/hero-sections.q";
import { get_FP_featuredProducts } from "~/queries/products.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const featured_products_resp = await queryClient.fetchQuery(get_FP_featuredProducts({ request }));
	const hero_sections_resp = await queryClient.fetchQuery(getAllFPHeroSections({ request }));
	const collections_resp = await queryClient.fetchQuery(getAllFPCollections({ request }));

	return {
		featured_products: featured_products_resp.products ?? [],
		hero_sections: hero_sections_resp.hero_sections ?? [],
		collections: collections_resp.collections ?? [],
	};
};

export default function HomePage() {
	const { featured_products, hero_sections, collections } = useLoaderData<typeof loader>();

	return (
		<>
			<HeroSection data={hero_sections} />
			<CollectionsSection collections={collections} />
			<FeaturedProductsSection products={featured_products} />
		</>
	);
}
