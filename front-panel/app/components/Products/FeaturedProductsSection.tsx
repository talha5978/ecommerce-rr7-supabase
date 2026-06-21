import type { FullCoupon } from "@ecom/shared/types/coupons";
import type { FP_Featured_Product } from "@ecom/shared/types/products";
import type { loader as rootLoader } from "~/root";
import { memo } from "react";
import { useRouteLoaderData } from "react-router";
import FeaturedProductCard from "~/components/Products/FeaturedProduct";
import { filterCoupons } from "~/utils/product-details-helpers";

const FeaturedProductsSection = memo(function FeaturedProductsSectionFunc({
	products,
}: {
	products: FP_Featured_Product[];
}) {
	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
	const allCoupons: FullCoupon[] = filterCoupons(rootLoaderData?.coupons ?? []) ?? [];

	return (
		<section className="max-container py-4 flex flex-col gap-6">
			<h2 className="md:text-3xl text-2xl font-semibold">Best Picks</h2>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
				{products.map((product: FP_Featured_Product) => (
					<FeaturedProductCard product={product} allCoupons={allCoupons} key={product.id} />
				))}
			</div>
		</section>
	);
});

export default FeaturedProductsSection;
