import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import Header from "~/components/Header/Header";
import HeroSection from "~/components/Hero/HeroSection";
import FeaturedProductsSection from "~/components/Products/FeaturedProductsSection";
import { get_FP_headerCategories } from "~/queries/categories.q";
import { getAllFPHeroSections } from "~/queries/hero-sections.q";
import { get_FP_featuredProducts } from "~/queries/products.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const header_categories = await queryClient.fetchQuery(get_FP_headerCategories({ request }));
	const featured_products = await queryClient.fetchQuery(get_FP_featuredProducts({ request }));
	const hero_sections = await queryClient.fetchQuery(getAllFPHeroSections({ request }));
	console.log(hero_sections);

	return { header_categories, featured_products, hero_sections };
};

export default function HomePage() {
	const { header_categories, featured_products, hero_sections } = useLoaderData<typeof loader>();

	return (
		<>
			<Header categories={header_categories.categories ?? []} />
			<HeroSection data={hero_sections.hero_sections ?? []} />
			<FeaturedProductsSection products={featured_products.products ?? []} />
		</>
	);
}
