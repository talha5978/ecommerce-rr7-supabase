import type { FullCoupon } from "@ecom/shared/types/coupons";
import type {
	ProductAttribute,
	ProductFullDetails,
	ProductVariant,
} from "@ecom/shared/types/product-details";

type Attribute = {
	id: string;
	name: string;
	value: string;
};

/** Only return the automatic coupons with the specific products discounts */
export function filterCoupons(allCoupons: FullCoupon[]): FullCoupon[] {
	return (
		allCoupons
			.filter((c) => c.coupon_type == "automatic")
			.filter((c) => c.discount_type === "fixed_product" || c.discount_type === "percentage_product")
			.filter((c) => c.specific_products != null && c.specific_products?.length > 0) || []
	);
}

export function getCarouselImages(
	data: ProductFullDetails | null,
	selectedVariant: ProductFullDetails["variants"][0] | undefined,
) {
	if (data == null) return [];

	let images = [data.product.cover_image];

	if (selectedVariant?.images) {
		images = [...images, ...selectedVariant.images];
	} else {
		data.variants.forEach((v) => {
			v.images.forEach((img) => {
				images.push(img);
			});
		});
	}

	return images.map((img, index) => ({
		title: data.product.name + " image " + (index + 1),
		url: img,
	}));
}

export function getVariantsColors(data: ProductFullDetails | null) {
	if (data == null) return [];

	const colors: Attribute[] = [];

	for (let i = 0; i < data.variants.length; i++) {
		const variant = data.variants[i];
		for (let j = 0; j < variant.attributes.length; j++) {
			const attribute = variant.attributes[j];
			if (attribute.attribute_type === "color" && !colors.find((c) => c.value === attribute.value)) {
				colors.push({
					id: attribute.id,
					name: attribute.name,
					value: attribute.value,
				});
			}
		}
	}

	return colors;
}

export function getAvailableSizes(data: ProductFullDetails | null, selectedColor: string) {
	if (data == null || !selectedColor) return [];

	const sizesMap = new Map<string, Attribute>();

	data.variants.forEach((variant) => {
		const colorAttr = variant.attributes.find((a) => a.attribute_type === "color");
		const sizeAttr = variant.attributes.find((a) => a.attribute_type === "size");

		if (colorAttr?.value === selectedColor && sizeAttr && !sizesMap.has(sizeAttr.value)) {
			sizesMap.set(sizeAttr.value, {
				id: sizeAttr.id,
				name: sizeAttr.name,
				value: sizeAttr.value,
			});
		}
	});

	return Array.from(sizesMap.values());
}

export function getProductAttributesToShow(attributes: ProductAttribute[]) {
	const groupedAttributes: Record<string, ProductAttribute[]> = attributes.reduce(
		(acc: Record<string, ProductAttribute[]>, attr: ProductAttribute) => {
			if (!acc[attr.attribute_type]) {
				acc[attr.attribute_type] = [];
			}
			acc[attr.attribute_type].push(attr);
			return acc;
		},
		{},
	);

	return groupedAttributes;
}

export function calculateDiscountedPrice(originalPrice: number, coupon: FullCoupon | null): number {
	if (!coupon) return originalPrice;

	switch (coupon.discount_type) {
		case "fixed_order":
		case "fixed_product":
			return Math.max(0, originalPrice - (coupon.discount_value ?? 0));
		case "percentage_order":
		case "percentage_product":
			return originalPrice * (1 - (coupon.discount_value ?? 0) / 100);
		default:
			return originalPrice;
	}
}

export function getApplicableCoupons(
	allCoupons: FullCoupon[],
	data: ProductFullDetails,
	selectedVariant: ProductVariant,
) {
	return allCoupons.filter((coupon) => {
		if (coupon.specific_products && coupon.specific_products.length > 0) {
			return coupon.specific_products.some((product) => product.sku === selectedVariant.sku);
		}

		return true;
	});
}
