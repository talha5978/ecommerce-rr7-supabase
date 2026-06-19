import type { HomeHeroSection } from "@ecom/shared/types/hero-sections";
import { memo } from "react";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { Link } from "react-router";
import AutoPlay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";

const HeroSectionContainer = memo(function HeroSectionContainerFunc({ data }: { data: HomeHeroSection[] }) {
	if (!data || data.length === 0) return null;

	return (
		<div className="relative max-container w-full">
			<Carousel
				className="w-full"
				opts={{ loop: true, duration: 30, dragFree: false }}
				plugins={[AutoPlay({ active: true, delay: 5000 }), Fade({ active: true })]}
			>
				<CarouselContent>
					{data.map((hero) => (
						<CarouselItem key={hero.id}>
							{/* MOBILE */}
							<div className="md:hidden px-4">
								<div className="aspect-[4/5] sm:aspect-[5/6] rounded-2xl overflow-hidden">
									<Link to={hero.url || "#"} className="block w-full h-full">
										<img
											src={
												SUPABASE_IMAGE_BUCKET_PATH + (hero.image_mobile || hero.image)
											}
											alt="Hero Banner"
											className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
										/>
									</Link>
								</div>
							</div>

							{/* DESKTOP*/}
							<div className="hidden md:block">
								<div className="w-full">
									<div className="aspect-[16/9] max-h-[620px] w-full overflow-hidden">
										<Link to={hero.url || "#"} className="block w-full h-full">
											<img
												src={SUPABASE_IMAGE_BUCKET_PATH + hero.image}
												alt="Hero Banner"
												className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
											/>
										</Link>
									</div>
								</div>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</div>
	);
});

export default HeroSectionContainer;
