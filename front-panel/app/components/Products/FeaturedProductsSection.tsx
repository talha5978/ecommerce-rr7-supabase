import { type FP_Featured_Product } from "@ecom/shared/types/products";
import { memo } from "react";
import FeaturedProductCard from "~/components/Products/FeaturedProduct";

const FeaturedProductsSection = memo(function FeaturedProductsSectionFunc({
	products,
}: {
	products: FP_Featured_Product[];
}) {
	return (
		<section className="max-container py-4 flex flex-col gap-4">
			<h2 className="text-2xl font-semibold">Featured</h2>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{products.map((product: FP_Featured_Product) => (
					<FeaturedProductCard product={product} key={product.id}/>
				))}
			</div>
		</section>
	);
});

export default FeaturedProductsSection;
