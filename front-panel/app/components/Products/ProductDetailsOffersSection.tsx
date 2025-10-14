import React from "react";
import type {
	FullCoupon,
	FullCouponBuyXGetYEntity,
	FullCouponBuyXGroup,
	FullCouponGetYGroup,
} from "@ecom/shared/types/coupons";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { Link } from "react-router";

interface ProductForOffers {
	id: string;
	sub_category: string;
	collections: string[];
	variants: { id: string }[];
}

const isProductInGroup = (
	product: ProductForOffers,
	group: FullCouponBuyXGroup | FullCouponGetYGroup,
): boolean => {
	const entityIds = group.entities.map((e: FullCouponBuyXGetYEntity) => e.id).map(String);

	if (group.entitiy_type === "sku") {
		return product.variants.some((v) => entityIds.includes(v.id));
	} else if (group.entitiy_type === "collection") {
		return product.collections.some((c) => entityIds.includes(c));
	} else if (group.entitiy_type === "category") {
		return entityIds.includes(product.sub_category);
	}
	return false;
};

const BuyCard: React.FC<{
	group: FullCouponBuyXGroup;
	isCurrent: boolean;
}> = ({ group, isCurrent }) => {
	const minTypeLabel = group.min_value_type === "quantity" ? "items" : "worth";
	const entityNames = group.entities.map((e) => e.name).join(", ");

	return (
		<div>
			<h3 className="text-lg font-semibold">Buy</h3>
			<p>
				Buy {group.min_value} {minTypeLabel} from {group.entitiy_type}: {entityNames}
			</p>
			{/* Optionally render images if available */}
			<div>
				{group.entities.map((entity) =>
					entity.image_url || entity.cover_image || entity.images?.[0] ? (
						<div className="w-full max-w-xs rounded-md shadow-md overflow-hidden" key={entity.id}>
							<div className="absolute top-0 right-0">
								{isCurrent && (
									<span className="bg-green-500 text-white px-2 py-1 rounded-full">
										Current
									</span>
								)}
							</div>
							<Link to={`/product/${entity.id}/${entity.url_key}`} prefetch="intent">
								<div className="relative overflow-hidden">
									<div className="w-full aspect-w-4 aspect-h-3">
										<img
											src={
												SUPABASE_IMAGE_BUCKET_PATH +
												(entity.cover_image || entity.image_url || entity.images?.[0])
											}
											alt={entity.name}
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								<div className="p-4">
									<h3 className="font-semibold line-clamp-2">{entity.name}</h3>
									{entity.original_price && (
										<p className="text-muted-foreground text-sm font-medium">
											${entity.original_price}
										</p>
									)}
								</div>
							</Link>
						</div>
					) : null,
				)}
			</div>
		</div>
	);
};

// GetCard component
const GetCard: React.FC<{
	group: FullCouponGetYGroup;
	isCurrent: boolean;
}> = ({ group, isCurrent }) => {
	const entityNames = group.entities.map((e) => e.name).join(", ");

	return (
		<div>
			<h3 className="text-lg font-semibold">Get</h3>
			<p>
				Get {group.get_quantity} items at {group.discount_percent}% off from {group.entitiy_type}:{" "}
				{entityNames}
			</p>
			{/* Optionally render images if available */}
			<div>
				{group.entities.map((entity) =>
					entity.image_url || entity.cover_image || entity.images?.[0] ? (
						<div className="w-full max-w-xs rounded-md shadow-md overflow-hidden" key={entity.id}>
							<div className="absolute top-0 right-0">
								{isCurrent && (
									<span className="bg-green-500 text-white px-2 py-1 rounded-full">
										Current
									</span>
								)}
							</div>
							<Link to={`/product/${entity.id}/${entity.url_key}`} prefetch="intent">
								<div className="relative overflow-hidden">
									<div className="w-full aspect-w-4 aspect-h-3">
										<img
											src={
												SUPABASE_IMAGE_BUCKET_PATH +
												(entity.cover_image || entity.image_url || entity.images?.[0])
											}
											alt={entity.name}
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								<div className="p-4">
									<h3 className="font-semibold line-clamp-2">{entity.name}</h3>
									{entity.original_price && (
										<p className="text-muted-foreground text-sm font-medium">
											${entity.original_price}
										</p>
									)}
								</div>
							</Link>
						</div>
					) : null,
				)}
			</div>
		</div>
	);
};

// OffersSection component
const OffersSection: React.FC<{ product: ProductForOffers; coupons: FullCoupon[] }> = ({
	product,
	coupons,
}) => {
	const relevantCoupons = coupons.filter((c) => {
		const conditions = c.buy_x_get_y_conditions;
		if (!conditions || !conditions.buy_group || !conditions.get_group) return false;

		return (
			isProductInGroup(product, conditions.buy_group) || isProductInGroup(product, conditions.get_group)
		);
	});

	if (relevantCoupons.length === 0) return null;

	return (
		<section className="flex flex-col">
			<h2 className="text-2xl font-semibold">Offers</h2>
			{relevantCoupons.map((coupon) => {
				const conditions = coupon.buy_x_get_y_conditions!;
				return (
					<div key={coupon.id} className="flex gap-4">
						<BuyCard
							group={conditions.buy_group}
							isCurrent={isProductInGroup(product, conditions.buy_group)}
						/>
						<GetCard
							group={conditions.get_group}
							isCurrent={isProductInGroup(product, conditions.get_group)}
						/>
					</div>
				);
			})}
		</section>
	);
};

export default OffersSection;
