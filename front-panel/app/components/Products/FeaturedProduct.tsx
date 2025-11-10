import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import type { FP_Featured_Product } from "@ecom/shared/types/products";
import React, { memo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { addToFavourites } from "~/utils/manageFavourites";

interface FeaturedProductCardProps {
	product: FP_Featured_Product;
}

const FeaturedProductCard: React.FC<FeaturedProductCardProps> = memo(({ product, ...props }) => {
	const [isHovered, setIsHovered] = useState(false);
	const navigate = useNavigate();

	const handleFavouriteClick = () => {
		addToFavourites({
			image_url: product.cover_image,
			original_price: product.original_price ?? 0,
			product_id: product.id,
			product_name: product.name,
			url_key: product.url_key,
		});

		toast.success("Added to favourites", {
			action: {
				label: "View Favourites",
				onClick: () => {
					navigate("/favourites");
				},
			},
		});
	};

	return (
		<div
			className="w-full max-w-xs rounded-md shadow-md overflow-hidden relative"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			{...props}
		>
			<Link to={`/product/${product.id}/${product.url_key}`} prefetch="intent">
				<div className="overflow-hidden">
					<div className="w-full aspect-w-4 aspect-h-3 relative">
						<img
							src={SUPABASE_IMAGE_BUCKET_PATH + product.cover_image}
							alt={product.name}
							className="w-full h-full object-cover"
						/>
					</div>
				</div>
				<div className="p-4">
					<h3 className="font-semibold line-clamp-2">{product.name}</h3>
					<p className="text-muted-foreground text-sm font-medium">PKR {product.original_price}</p>
				</div>
			</Link>
			<AnimatePresence>
				{isHovered && (
					<motion.div
						className="absolute flex flex-col bottom-20 left-0 right-0 px-4 py-2 items-center justify-center"
						initial={{ y: "0%", opacity: 0 }}
						animate={{ y: "0%", opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.35, ease: "easeInOut" }}
					>
						<div className="flex items-center gap-2">
							<Button size={"sm"}>Add to Cart</Button>
							<div>
								<Button
									variant={"secondary"}
									size={"sm"}
									className="rounded-full hover:*:fill-primary transition-all duration-200 ease-in-out"
									onClick={handleFavouriteClick}
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
	);
});

export default FeaturedProductCard;
