import { memo } from "react";
import ImageCarousel, { type ImageCarousel_BasicProps } from "~/components/Products/ImageCarousel";

const ProductImageCarousel = memo(
	({ images, thumbPosition = "left", ...props }: ImageCarousel_BasicProps) => {
		return (
			<ImageCarousel
				images={images}
				imageFit="contain"
				thumbPosition={thumbPosition}
				aspectRatio="square"
				showImageControls
				{...props}
			/>
		);
	},
);

export default ProductImageCarousel;
