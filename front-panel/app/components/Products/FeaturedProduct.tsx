import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import type { FP_Featured_Product } from "@ecom/shared/types/products";
import type { FullCoupon } from "@ecom/shared/types/coupons";
import React, { memo, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { addToFavourites } from "~/utils/manageFavourites";
import {
	calculateDiscountedPrice,
	getApplicableCouponsForFeaturedProduct,
} from "~/utils/product-details-helpers";

interface FeaturedProductCardProps {
	product: FP_Featured_Product;
	allCoupons: FullCoupon[];
}

const formatCurrency = (value: number | string | undefined) => {
	if (value == null || value === "") return "N/A";
	const num = typeof value === "number" ? value : Number(value);
	if (Number.isNaN(num)) return String(value);
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "PKR",
		maximumFractionDigits: 0,
		useGrouping: true,
	}).format(num);
};

const FeaturedProductCard: React.FC<FeaturedProductCardProps> = memo(({ product, allCoupons, ...props }) => {
	const [isHovered, setIsHovered] = useState(false);
	const navigate = useNavigate();

	const applicableCoupon = useMemo(() => {
		const a = getApplicableCouponsForFeaturedProduct(allCoupons, product, null) ?? null;
		return a && a.length > 0 ? a[0] : null;
	}, [allCoupons, product]);

	const discountedPrice = useMemo(() => {
		if (!applicableCoupon) return product.original_price ?? 0;
		return calculateDiscountedPrice(product.original_price ?? 0, applicableCoupon);
	}, [product.original_price, applicableCoupon]);

	const hasDiscount = discountedPrice < (product.original_price ?? 0);
	const hasSizes = product.available_sizes && product.available_sizes.length > 0;

	const handleFavouriteClick = (e: React.MouseEvent) => {
		e.preventDefault();
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
				onClick: () => navigate("/favourites"),
			},
		});
	};

	return (
		<div
			className="group relative w-full overflow-hidden rounded-xs bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			{...props}
		>
			<Link to={`/product/${product.id}/${product.url_key}`} prefetch="intent" className="block">
				<div className="relative aspect-[4/4.3] overflow-hidden bg-muted">
					<img
						src={SUPABASE_IMAGE_BUCKET_PATH + product.cover_image}
						alt={product.name}
						className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-white"
					/>

					{hasDiscount && applicableCoupon && (
						<div className="absolute top-2.5 left-2.5 z-10 bg-red-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm">
							{applicableCoupon.discount_type?.includes("percentage")
								? `${applicableCoupon.discount_value}% off`
								: `Save PKR ${applicableCoupon.discount_value.toLocaleString()}`}
						</div>
					)}

					<AnimatePresence>
						{isHovered && (
							<motion.div
								className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 px-3 pb-3 pt-5"
								style={{
									background:
										"linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.28) 35%, transparent 100%)",
								}}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
							>
								{/* Sizes */}
								{hasSizes && (
									<motion.div
										className="flex flex-wrap gap-1.5"
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 6 }}
										transition={{ duration: 0.2, delay: 0.05 }}
									>
										{product.available_sizes.slice(0, 5).map((size, index) => (
											<span
												key={index}
												className="text-[11px] font-medium tracking-wide text-white px-2 py-0.5 rounded-xs border border-white/40 bg-white/15"
											>
												{size}
											</span>
										))}
									</motion.div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<div className="p-4">
					<h3 className="text-[15px] leading-tight line-clamp-1 mb-2">{product.name}</h3>

					<div className="flex items-baseline gap-2">
						<p className="text-[15px] font-semibold text-foreground leading-none">
							{formatCurrency(discountedPrice)}
						</p>
						{hasDiscount && (
							<p className="text-[12px] text-destructive line-through mt-1">
								{formatCurrency(product.original_price ?? 0)}
							</p>
						)}
					</div>
				</div>
			</Link>

			<button
				onClick={handleFavouriteClick}
				className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:text-destructive"
			>
				<Heart className="w-4 h-4 hover:text-destructive hover:fill-destructive" />
			</button>
		</div>
	);
});

export default FeaturedProductCard;
