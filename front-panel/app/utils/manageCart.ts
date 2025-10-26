import { CART_STORAGE_KEY } from "@ecom/shared/constants/constants";
import type { FullCoupon } from "@ecom/shared/types/coupons";
import type { TaxRate_FP } from "@ecom/shared/types/taxes";
import type { CartItem } from "~/types/cart";

/**
 * Get all cart items from localStorage
 */
export function getCart(): CartItem[] {
	try {
		if (window === undefined) return [];
		const cartJson = localStorage.getItem(CART_STORAGE_KEY);
		return cartJson ? (JSON.parse(cartJson) as CartItem[]) : [];
	} catch (error) {
		console.error("Error reading cart from localStorage:", error);
		return [];
	}
}

export function getNumberOfCartItems(): number {
	return getCart().length;
}

/**
 * Add item to cart (or update quantity if exists)
 */
export function addToCart(item: Omit<CartItem, "quantity" | "id"> & { quantity?: number }): CartItem[] {
	const currentCart = getCart();
	const quantity = item.quantity ?? 1;

	const existingIndex = currentCart.findIndex(
		(cartItem) =>
			cartItem.variant_id === item.variant_id &&
			cartItem.size === item.size &&
			cartItem.color === item.color,
	);

	let newCart: CartItem[];

	if (existingIndex >= 0) {
		newCart = currentCart.map((cartItem, index) =>
			index === existingIndex
				? {
						...cartItem,
						quantity: cartItem.quantity + quantity,
						applied_coupon_code: item.applied_coupon_code || cartItem.applied_coupon_code,
					}
				: cartItem,
		);
	} else {
		const newItem: CartItem = {
			...item,
			quantity,
			id: `${item.variant_id}-${item.size}-${item.color}-${Date.now()}`,
		};
		newCart = [...currentCart, newItem];
	}

	saveCart(newCart);
	return newCart;
}

/**
 * Remove item from cart by UNIQUE ID
 */
export function removeFromCart(itemId: string): CartItem[] {
	const currentCart = getCart();
	const newCart = currentCart.filter((item) => item.id !== itemId); // ✅ FIXED
	saveCart(newCart);
	return newCart;
}

/**
 * Update item quantity by UNIQUE ID
 */
export function updateQuantity(itemId: string, quantity: number): CartItem[] {
	if (quantity <= 0) {
		return removeFromCart(itemId);
	}

	const currentCart = getCart();
	const newCart = currentCart.map(
		(item) => (item.id === itemId ? { ...item, quantity } : item), // ✅ FIXED
	);

	saveCart(newCart);
	return newCart;
}

/**
 * Clear entire cart
 */
export function clearCart(): void {
	localStorage.removeItem(CART_STORAGE_KEY);
}

/**
 * Check if cart is empty
 */
export function isCartEmpty(): boolean {
	return getCart().length === 0;
}

export interface CartSummary {
	subtotal: string;
	shipping: string;
	tax: string;
	discount: string;
	total: string;
	discountBreakdown: Record<string, string>;
	taxBreakdown: Record<string, string>;
}

/** Real Function to calculate things */
export function calculateCartSummary({
	coupons,
	shippingRate,
	taxRates,
}: {
	coupons: FullCoupon[];
	shippingRate: number;
	taxRates: TaxRate_FP[];
}): CartSummary {
	const cartItems = getCart();

	const subtotal = cartItems.reduce((sum, item) => sum + item.original_price * item.quantity, 0);

	let discount = 0;
	const discountBreakdown: Record<string, string> = {};

	cartItems.forEach((item) => {
		if (item.applied_coupon_code) {
			const coupon = coupons.find((c) => c.code === item.applied_coupon_code);
			if (
				coupon &&
				coupon.discount_value &&
				coupon.specific_products?.some((p) => p.id === item.product_id || p.sku === item.sku)
			) {
				const discountAmount =
					coupon.discount_type === "percentage_product"
						? (item.original_price * coupon.discount_value) / 100
						: coupon.discount_type === "fixed_product"
							? coupon.discount_value
							: 0;

				discount += discountAmount * item.quantity;

				const discountText =
					coupon.discount_type === "percentage_product"
						? `${coupon.discount_value}%`
						: `PKR ${Number((discountAmount * item.quantity).toFixed(2))}`;

				discountBreakdown[item.sku] = discountText;
			}
		}
	});

	// Coupon type must be automatic
	// + type must be on the order level
	// + there must be no specific products (to ensure that the coupon is order level not specific)
	const orderLevelCoupon = coupons.find(
		(c) =>
			(c.discount_type === "fixed_order" || c.discount_type === "percentage_order") &&
			!c.specific_products?.length &&
			c.coupon_type === "automatic",
	);

	if (orderLevelCoupon && orderLevelCoupon.discount_value) {
		if (orderLevelCoupon.discount_type === "fixed_order") {
			discount += orderLevelCoupon.discount_value;
			discountBreakdown[`Coupon - ${orderLevelCoupon.code}`] =
				`PKR ${Number(orderLevelCoupon.discount_value.toFixed(2))}`;
		} else if (orderLevelCoupon.discount_type === "percentage_order") {
			discount += (subtotal * orderLevelCoupon.discount_value) / 100;
			discountBreakdown[`Coupon - ${orderLevelCoupon.code}`] = `${orderLevelCoupon.discount_value}%`;
		}
	}

	const shipping = cartItems.some((item) => item.apply_shipping) ? shippingRate || 0 : 0;

	let tax = 0;
	const taxBreakdown: Record<string, string> = {};

	cartItems.forEach((item) => {
		const applicableTaxes = taxRates.filter((taxRate) =>
			taxRate.application_categories.includes(item.category_id),
		);

		let itemTax = 0;
		const taxDetails: string[] = [];

		applicableTaxes.forEach((taxRate) => {
			const taxAmount = item.original_price * item.quantity * (taxRate.rate / 100);
			itemTax += Number(taxAmount.toFixed(2));
			// taxDetails.push(`${taxRate.name}: ${taxRate.rate}% (PKR ${Number(taxAmount.toFixed(2))})`);
			taxDetails.push(`${taxRate.name} (${taxRate.rate}%)`);
		});

		tax += itemTax;
		if (taxDetails.length > 0) {
			taxBreakdown[item.sku] = taxDetails.join(", ");
		}
	});

	const total = subtotal + shipping + tax - discount;

	return {
		subtotal: subtotal.toFixed(2),
		shipping: shipping.toFixed(2),
		tax: tax.toFixed(2),
		discount: discount.toFixed(2),
		total: total.toFixed(2),
		discountBreakdown,
		taxBreakdown,
	};
}

/**
 * Save cart to localStorage
 */
function saveCart(items: CartItem[]) {
	try {
		localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
	} catch (error) {
		console.error("Error saving cart to localStorage:", error);
	}
}
