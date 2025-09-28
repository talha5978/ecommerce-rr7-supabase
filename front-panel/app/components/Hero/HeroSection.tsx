import type { PureThing } from "@ecom/shared/types/hero-sections";
import { memo } from "react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "~/components/ui/carousel";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";

const HeroSectionContainer = memo(function HeroSectionContainerFunc({ data }: { data: PureThing[] }) {
	return (
		<Carousel
			className="max-container"
		>
			<CarouselContent>
				{Array.from({ length: data.length }).map((_, index) => (
					<CarouselItem key={index} className="flex items-center justify-center">
						<img
							src={SUPABASE_IMAGE_BUCKET_PATH + data[index].image}
							alt=""
							className="object-cover w-full max-h-[390px] rounded-2xl"
						/>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
});

export default HeroSectionContainer;