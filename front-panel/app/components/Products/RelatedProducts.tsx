import type { FullCoupon } from "@ecom/shared/types/coupons";
import type { FP_Featured_Product } from "@ecom/shared/types/products";
import type { loader as rootLoader } from "~/root";
import { memo } from "react";
import { useRouteLoaderData } from "react-router";
import FeaturedProductCard from "~/components/Products/FeaturedProduct";
import { filterCoupons } from "~/utils/product-details-helpers";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const RelatedProducts = memo(function RelatedProductsFunc({ products }: { products: FP_Featured_Product[] }) {
	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
	const allCoupons: FullCoupon[] = filterCoupons(rootLoaderData?.coupons ?? []) ?? [];

	return (
		<section className="py-4 flex flex-col gap-6 mt-10">
			<div>
				<h2 className="text-3xl font-semibold tracking-tight">You May Also Like</h2>
				<p className="text-muted-foreground mt-1">Customers also bought these products</p>
			</div>
			<Carousel
				className="w-full max-w-full"
				plugins={[
					Autoplay({
						delay: 5000,
					}),
				]}
			>
				<CarouselContent>
					{products.map((product: FP_Featured_Product) => (
						<CarouselItem
							key={product.id}
							className="pl-4 min-[550px]:basis-1/2 md:basis-1/4 lg:basis-1/5"
						>
							<FeaturedProductCard product={product} allCoupons={allCoupons} />
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</section>
	);
});

export default RelatedProducts;
