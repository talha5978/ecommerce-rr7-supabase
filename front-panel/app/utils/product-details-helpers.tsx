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

export function matchesConditionGroup(
	variantId: string,
	product: any,
	collections: any[],
	groupConditions: {
		type: string;
		operator: string;
		value_decimal: string | null;
		value_ids: string[] | null;
	}[],
): boolean {
	// Assuming AND logic within group conditions
	return groupConditions.every((cond) => {
		switch (cond.type) {
			case "sku":
				return matchesOperator(variantId, cond.operator, cond.value_ids ?? []);
			case "category":
				return matchesOperator(product.category_id, cond.operator, cond.value_ids ?? []);
			case "collection":
				const productCollectionIds = collections.map((c) => c.id);
				return (
					cond.value_ids?.some((id) => matchesOperator(id, cond.operator, productCollectionIds)) ??
					false
				);
			case "price":
				// Price not applicable for variant matching here; handle separately if needed
				return false;
			default:
				return false;
		}
	});
}

export function matchesOperator(value: any, operator: string, compare: string[]): boolean {
	switch (operator) {
		case "in":
			return Array.isArray(compare) ? compare.includes(value) : false;
		case "not_in":
			return Array.isArray(compare) ? !compare.includes(value) : true;
		case "equal":
			return value === compare[0]; // For single value
		case "not_equal":
			return value !== compare[0];
		case "greater":
			return value > parseFloat(compare[0]);
		case "greater_or_equal":
			return value >= parseFloat(compare[0]);
		case "smaller":
			return value < parseFloat(compare[0]);
		case "smaller_or_equal":
			return value <= parseFloat(compare[0]);
		default:
			return false;
	}
}

export function getApplicableCoupons(
	allCoupons: FullCoupon[],
	data: ProductFullDetails,
	selectedVariant: ProductVariant,
) {
	return allCoupons.filter((coupon) => {
		// Add more checks (customer_conditions, etc.)
		return true;
	});
}
