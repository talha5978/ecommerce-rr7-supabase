import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { FP_Featured_Product } from "@ecom/shared/types/products";
import React, { memo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { Heart } from "lucide-react";

interface FeaturedProductCardProps {
	product: FP_Featured_Product;
}

const FeaturedProductCard: React.FC<FeaturedProductCardProps> = memo(({ product, ...props }) => {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className="w-full max-w-xs rounded-md shadow-md overflow-hidden"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			{...props}
		>
			<Link to={`/product/${product.id}`}>
				<div className="relative overflow-hidden">
					<div className="w-full aspect-w-4 aspect-h-3">
						<img
							src={SUPABASE_IMAGE_BUCKET_PATH + product.cover_image}
							alt={product.name}
							className="w-full h-full object-cover"
						/>
					</div>
					<AnimatePresence>
						{isHovered && (
							<motion.div
								className="absolute flex flex-col bottom-0 left-0 right-0 px-4 py-2 items-center justify-center"
								initial={{ y: "100%" }}
								animate={{ y: 0 }}
								exit={{ y: "100%" }}
								transition={{ duration: 0.3 }}
							>
								<div className="flex items-center gap-2">
									<Button size={"sm"}>Add to Cart</Button>
									<div>
										<Button
											variant={"secondary"}
											size={"sm"}
											className="rounded-full hover:*:fill-primary transition-all duration-200 ease-in-out"
										>
											<Heart />
										</Button>
									</div>
								</div>
								<div className="flex gap-2 mt-2">
									{product.available_sizes.length > 0 ? (
										product.available_sizes.map((size, index) => (
											<span
												key={index}
												className="text-xs text-secondary bg-black/80 px-2 py-1 rounded-sm shadow-sm transition-all"
											>
												{size}
											</span>
										))
									) : (
										<span className="text-sm italic">N/A</span>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
				<div className="p-4">
					<h3 className="font-semibold line-clamp-2">{product.name}</h3>
					<p className="text-muted-foreground text-sm font-medium">${product.original_price}</p>
				</div>
			</Link>
		</div>
	);
});

export default FeaturedProductCard;
