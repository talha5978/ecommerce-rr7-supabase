import type { ProductAttribute } from "@ecom/shared/types/attributes";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function sortSizes(attributes: ProductAttribute[]) {
	return [...attributes].sort((a, b) => {
		const aValue = a.value.trim().toUpperCase();
		const bValue = b.value.trim().toUpperCase();

		const aIndex = SIZE_ORDER.indexOf(aValue);
		const bIndex = SIZE_ORDER.indexOf(bValue);

		const aIsAlpha = aIndex !== -1;
		const bIsAlpha = bIndex !== -1;

		if (aIsAlpha && bIsAlpha) {
			return aIndex - bIndex;
		}

		if (aIsAlpha) return -1;
		if (bIsAlpha) return 1;

		return Number(aValue) - Number(bValue);
	});
}

export function sortProductSizes(sizes: string[]) {
	return [...sizes].sort((a, b) => {
		const aValue = a.trim().toUpperCase();
		const bValue = b.trim().toUpperCase();

		const aIndex = SIZE_ORDER.indexOf(aValue);
		const bIndex = SIZE_ORDER.indexOf(bValue);

		const aIsAlpha = aIndex !== -1;
		const bIsAlpha = bIndex !== -1;

		if (aIsAlpha && bIsAlpha) {
			return aIndex - bIndex;
		}

		if (aIsAlpha) return -1;
		if (bIsAlpha) return 1;

		return Number(aValue) - Number(bValue);
	});
}
