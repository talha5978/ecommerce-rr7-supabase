import { motion } from "motion/react";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { ArrowLeft, ArrowRight, Check, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useRouteLoaderData } from "react-router";
import { Breadcrumbs } from "~/components/SEO/Breadcrumbs";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { CartItem } from "~/types/cart";
import { clearCart, getCart, getNumberOfCartItems, removeFromCart, updateQuantity } from "~/utils/manageCart";
import { type loader as rootLoader } from "~/root";
import { filterCoupons } from "~/utils/product-details-helpers";
import type { FullCoupon } from "@ecom/shared/types/coupons";
import { Badge } from "~/components/ui/badge";
import QuantityInput from "~/components/Custom-Inputs/quantity-input-basic";

export const loader = () => {
	return null;
};

function calculateItemFinalPrice(item: CartItem, availableCoupons: FullCoupon[]) {
	let finalPrice = item.original_price;
	let hasDiscount = false;
	let discountAmount = 0;
	let coupon = null;

	if (!item.applied_coupon_code) {
		// console.log("❌ No applied_coupon_code");
		return { finalPrice, hasDiscount, discountAmount, coupon };
	}

	const appliedCoupon = availableCoupons.find((c) => c.code === item.applied_coupon_code);

	if (!appliedCoupon || !appliedCoupon.discount_value) {
		// console.log("❌ Coupon not found or no discount_value");
		return { finalPrice, hasDiscount, discountAmount, coupon };
	}

	if (!appliedCoupon.specific_products || appliedCoupon.specific_products.length === 0) {
		// console.log("❌ No specific_products or empty array");
		return { finalPrice, hasDiscount, discountAmount, coupon };
	}

	const itemMatchesSpecificProduct = appliedCoupon.specific_products.some((specificProduct) => {
		const idMatch = specificProduct.id === item.product_id;
		const skuMatch = specificProduct.sku === item.sku;
		// console.log(`  📦 Checking: ${specificProduct.id} === ${item.product_id} ? ${idMatch} | ${specificProduct.sku} === ${item.sku} ? ${skuMatch}`);
		return idMatch || skuMatch;
	});

	// console.log("🔍 Item matches specific product:", itemMatchesSpecificProduct);

	if (!itemMatchesSpecificProduct) {
		// console.log("❌ Item does NOT match any specific_product");
		return { finalPrice, hasDiscount, discountAmount, coupon };
	}

	// CALCULATE DISCOUNT
	let calculatedDiscount = 0;
	if (appliedCoupon.discount_type === "percentage_product") {
		calculatedDiscount = (item.original_price * (appliedCoupon.discount_value || 0)) / 100;
		// console.log(`💰 Percentage discount: ${(appliedCoupon.discount_value || 0)}% of ${item.original_price} = ${calculatedDiscount}`);
	} else if (appliedCoupon.discount_type === "fixed_product") {
		calculatedDiscount = appliedCoupon.discount_value || 0;
		// console.log(`💰 Fixed discount: PKR ${calculatedDiscount}`);
	} else {
		// console.log(`❌ Unknown discount_type: ${appliedCoupon.discount_type}`);
	}

	discountAmount = calculatedDiscount;

	finalPrice = Math.max(0, item.original_price - discountAmount);
	hasDiscount = discountAmount > 0 && finalPrice < item.original_price;

	coupon = appliedCoupon;

	return { finalPrice, hasDiscount, discountAmount, coupon };
}

export default function CartPage() {
	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
	const coupons = filterCoupons(rootLoaderData?.coupons ?? []);

	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const navigate = useNavigate();

	// Fetch cart on mount and when cart changes
	useEffect(() => {
		const items = getCart();
		setCartItems(items);
	}, []);

	// Listen for storage changes (if multiple tabs)
	useEffect(() => {
		const handleStorageChange = () => {
			const items = getCart();
			setCartItems(items);
		};

		if (window !== undefined) {
			window.addEventListener("storage", handleStorageChange);
			return () => window.removeEventListener("storage", handleStorageChange);
		}
	}, []);

	const handleQuantityChange = (itemId: string, newQuantity: number) => {
		setIsLoading(true);
		const updatedCart = updateQuantity(itemId, newQuantity);
		setCartItems(updatedCart);
		setIsLoading(false);
	};

	const handleRemoveItem = (itemId: string) => {
		setIsLoading(true);
		const updatedCart = removeFromCart(itemId);
		setCartItems(updatedCart);
		setIsLoading(false);
	};

	const handleClearCart = () => {
		clearCart();
		setCartItems([]);
	};

	const itemCount = getNumberOfCartItems();

	const handleProceedToCheckout = () => {
		if (itemCount > 0) {
			navigate("checkout");
		}
	};

	if (cartItems.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
				<h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
				<p className="text-muted-foreground mb-6">Add some items to proceed further</p>
				<Link to={"/"}>
					<Button
						variant="outline"
						type="button"
						className="hover:gap-3 transition-all duration-150"
					>
						<ArrowLeft className="h-4 w-4" />
						Continue Shopping
					</Button>
				</Link>
			</div>
		);
	}
	// console.log(cartItems);

	return (
		<>
			<section>
				<div className="container mx-auto px-4 py-8 mb-14">
					<div className="lg:w-2/3 mx-auto">
						<Breadcrumbs />
						<div className="flex flex-col gap-5 ">
							<div className="flex justify-between items-center">
								<h1 className="text-3xl font-bold">My Cart ({itemCount})</h1>
								<Button onClick={handleClearCart} variant="ghost" size="sm">
									Clear Cart
								</Button>
							</div>
							<div className="space-y-4">
								{cartItems.map((item) => {
									const { finalPrice, hasDiscount } = calculateItemFinalPrice(
										item,
										coupons,
									);
									return (
										<Card key={item.id} className="overflow-hidden">
											<CardContent className="p-0">
												<div className="flex items-center p-4">
													<img
														src={
															SUPABASE_IMAGE_BUCKET_PATH + "/" + item.image_url
														}
														alt={item.product_name}
														className="w-20 h-24 object-cover rounded-lg mr-4"
														loading="lazy"
													/>
													<div className="flex-1 min-w-0">
														<h2 className="font-semibold text-lg truncate">
															{item.product_name}
														</h2>
														<h3 className="text-sm">{item.sku}</h3>
														<p className="text-xs text-muted-foreground mb-1">
															{item.size && `Size: ${item.size} | `}
															{item.color && `Color: ${item.color}`}
															{item.applied_coupon_code && (
																<Badge
																	variant={"outline"}
																	className="ml-2 text-muted-foreground bg-success/20"
																>
																	<Check />
																	{item.applied_coupon_code}
																</Badge>
															)}
														</p>
														<div className="flex items-center gap-2">
															<motion.span
																initial={{ opacity: 0 }}
																animate={{ opacity: 1 }}
															>
																<span className="text-lg font-bold">
																	PKR {finalPrice.toFixed(2)}
																</span>
															</motion.span>
															{hasDiscount && (
																<motion.span
																	initial={{ opacity: 0 }}
																	animate={{ opacity: 1 }}
																>
																	<del className="text-destructive text-sm">
																		PKR {item.original_price.toFixed(2)}
																	</del>
																</motion.span>
															)}
														</div>
													</div>
													<div className="flex items-center gap-2  ml-4">
														<QuantityInput
															quantity={item.quantity}
															min={1}
															max={item.stock}
															step={1}
															disabled={isLoading}
															inputFieldDisabled={true}
															onChange={(newQuantity) =>
																handleQuantityChange(item.id, newQuantity)
															}
														/>
														<Button
															size="sm"
															variant="destructive"
															onClick={() => handleRemoveItem(item.id)}
															disabled={isLoading}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
							<Button
								onClick={handleProceedToCheckout}
								className="w-full hover:gap-3 transition-all duration-150"
								size="lg"
								disabled={isLoading || itemCount === 0}
							>
								Proceed to Checkout
								<ArrowRight className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
