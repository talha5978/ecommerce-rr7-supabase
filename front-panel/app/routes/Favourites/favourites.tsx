import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Breadcrumbs } from "~/components/SEO/Breadcrumbs";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
	clearFavourites,
	getFavourites,
	getNumberOfFavourites,
	removeFromFavouritesList,
} from "~/utils/manageFavourites";
import type { FavouriteItem } from "~/types/favourites";

export const loader = () => {
	return null;
};
export default function FavouritesPage() {
	const [favourites, setFavouriteItems] = useState<FavouriteItem[]>([]);

	useEffect(() => {
		const items = getFavourites();
		setFavouriteItems(items);
	}, []);

	useEffect(() => {
		const handleStorageChange = () => {
			const items = getFavourites();
			setFavouriteItems(items);
		};

		if (window !== undefined) {
			window.addEventListener("storage", handleStorageChange);
			return () => window.removeEventListener("storage", handleStorageChange);
		}
	}, []);

	// const handleRemoveItem = (itemId: string) => {
	// 	const updatedItems = removeFromFavouritesList(itemId);
	// 	setFavouriteItems(updatedItems);
	// };

	const handleClearFavourites = () => {
		const st = clearFavourites();
		if (st) {
			setFavouriteItems([]);
			toast.success("Favourite list cleared successfully");
		} else {
			toast.error("Failed to clear favourite list. Please try again later.");
		}
	};

	const itemCount = getNumberOfFavourites();

	if (favourites.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
				<h2 className="text-2xl font-semibold mb-2">You have no favourite items</h2>
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

	return (
		<>
			<section>
				<div className="flex flex-col gap-5 ">
					<section className="max-container py-4 flex flex-col gap-4">
						<Breadcrumbs />
						<div className="flex justify-between items-center">
							<h1 className="text-2xl font-bold">Favourites ({itemCount})</h1>
							<Button onClick={handleClearFavourites} variant="ghost" size="sm">
								Clear Favourites
							</Button>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
							{favourites.map((item) => {
								return (
									<div className="w-full max-w-xs rounded-md shadow-md overflow-hidden">
										<Link
											to={`/products/${item.product_id}/${item.url_key}`}
											prefetch="intent"
										>
											<div className="w-full aspect-w-4 aspect-h-3 relative">
												<img
													src={SUPABASE_IMAGE_BUCKET_PATH + item.image_url}
													alt={item.product_name}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="p-4">
												<h3 className="font-semibold line-clamp-2">
													{item.product_name}
												</h3>
												<p className="text-muted-foreground text-sm font-medium">
													PKR {item.original_price}
												</p>
											</div>
										</Link>
									</div>
								);
							})}
						</div>
					</section>
				</div>
			</section>
		</>
	);
}
