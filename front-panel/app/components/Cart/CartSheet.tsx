import { Link, useNavigate, useRouteLoaderData } from "react-router";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import {
	calculateItemFinalPrice,
	clearCart,
	getCart,
	getNumberOfCartItems,
	removeFromCart,
	updateQuantity,
} from "~/utils/manageCart";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { CartItem } from "~/types/cart";
import { filterCoupons } from "~/utils/product-details-helpers";
import { type loader as rootLoader } from "~/root";
import { Button } from "~/components/ui/button";
import { ShoppingBag, Trash2 } from "lucide-react";
import QuantityInput from "~/components/Custom-Inputs/quantity-input-basic";

export default function CartSheet({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
	const navigate = useNavigate();

	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
	const coupons = filterCoupons(rootLoaderData?.coupons ?? []);

	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const items = getCart();
		setCartItems(items);
		console.log(items, cartItems, getNumberOfCartItems());
	}, []);

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
		const st = clearCart();
		if (st) {
			setCartItems([]);
			toast.success("Cart cleared successfully");
		} else {
			toast.error("Failed to clear cart. Please try again later.");
		}
	};

	const itemCount = getNumberOfCartItems();
	// console.log("Cart items: ", cartItems);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent>
				<SheetHeader className="pb-0">
					<SheetTitle>
						<h2 className="text-xl">Your Cart ({itemCount})</h2>
					</SheetTitle>
					<SheetDescription className="flex justify-end">
						<Button size={"sm"} variant={"link"} onClick={handleClearCart} type="button">
							Clear Cart
						</Button>
					</SheetDescription>
				</SheetHeader>
				<div className="px-1">
					{itemCount > 0 ? (
						<ul>
							{cartItems.map((item) => {
								const { finalPrice, hasDiscount } = calculateItemFinalPrice(item, coupons);

								return (
									<li key={item.id}>
										<div className="flex items-center p-4">
											<img
												src={SUPABASE_IMAGE_BUCKET_PATH + "/" + item.image_url}
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
										</div>
										<div className="flex items-center gap-2 ml-4">
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
									</li>
								);
							})}
						</ul>
					) : (
						<div className="flex justify-center items-center flex-col gap-2 min-h-[50vh] ">
							<ShoppingBag className="w-8 h-8 text-muted-foreground" />
							<p className="text-center text-muted-foreground">Your cart is empty.</p>
						</div>
					)}
				</div>
				<SheetFooter className="w-full **:w-full">
					<Link to={"/cart"}>
						<Button type="button" variant={"outline"}>
							See Cart
						</Button>
					</Link>
					<Link to={"/cart/checkout"}>
						<Button type="button" variant={"default"}>
							Checkout
						</Button>
					</Link>
					<Link to={"/"}>
						<Button type="button" variant={"outline"}>
							Continue Shopping
						</Button>
					</Link>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
