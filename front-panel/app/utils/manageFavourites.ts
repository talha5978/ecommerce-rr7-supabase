import { FAVOURITES_STORAGE_KEY } from "@ecom/shared/constants/constants";
import type { FavouriteItem } from "~/types/favourites";

/**
 * Get all Favourite items from localStorage
 */
export function getFavourites(): FavouriteItem[] {
	try {
		if (window === undefined) return [];
		const fJson = localStorage.getItem(FAVOURITES_STORAGE_KEY);
		return fJson ? (JSON.parse(fJson) as FavouriteItem[]) : [];
	} catch (error) {
		console.error("Error reading favourites from localStorage:", error);
		return [];
	}
}

export function getNumberOfFavourites(): number {
	return getFavourites().length;
}

/**
 * Add item to favourites list
 */
export function addToFavourites(item: FavouriteItem): FavouriteItem[] {
	const currentCart = getFavourites();

	const existingIndex = currentCart.findIndex((i) => i.product_id === item.product_id);

	let newItems: FavouriteItem[];

	if (existingIndex >= 0) {
		return currentCart;
	} else {
		newItems = [...currentCart, item];
	}

	saveFavouriteItems(newItems);
	return newItems;
}

/**
 * Remove item from cart by product id
 */
export function removeFromFavouritesList(product_id: string): FavouriteItem[] {
	const currentItems = getFavourites();
	const newItems = currentItems.filter((item) => item.product_id !== product_id);
	saveFavouriteItems(newItems);
	return newItems;
}

/**
 * Clear entire favourites list
 */
export function clearFavourites(): boolean {
	try {
		localStorage.removeItem(FAVOURITES_STORAGE_KEY);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Save favourites list to localStorage
 */
function saveFavouriteItems(items: FavouriteItem[]) {
	try {
		localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(items));
	} catch (error) {
		console.error("Error saving favourites to localStorage:", error);
	}
}
