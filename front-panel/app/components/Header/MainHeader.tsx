import { Link } from "react-router";
import { Input } from "~/components/ui/input";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import AccountSection from "~/components/Header/AccountSection";
import { getNumberOfCartItems } from "~/utils/manageCart";
import { getNumberOfFavourites } from "~/utils/manageFavourites";
import type { FP_HeaderCategory } from "@ecom/shared/types/category";

export default function MainHeader({ categories }: { categories: FP_HeaderCategory[] }) {
	const cart_count = getNumberOfCartItems();
	const favourite_count = getNumberOfFavourites();

	return (
		<div className="container mx-auto px-4 pt-5 pb-4 flex items-center justify-between">
			{/* Logo */}
			<Link to={"/"}>
				<span>
					<img
						src={"/LOGO.png"}
						alt="VOUGEWALK Logo"
						className="bg-transparent mix-blend-multiply h-auto"
					/>
				</span>
			</Link>

			{/* Categories section */}
			<div className="flex justify-center flex-1">
				<ul className="flex gap-3 *:block *:py-1">
					{categories
						.sort((a, b) => a.sort_order - b.sort_order)
						.map((category) => {
							return (
								<li key={category.id}>
									<Link
										to={`/search?categories=${category.id}`}
										className="hover:underline underline-offset-4 hover:text-primary transition-colors duration-200 ease-in-out"
										prefetch="intent"
										aria-label={category.category_name}
										title={category.category_name}
										viewTransition
									>
										{category.category_name}
									</Link>
								</li>
							);
						})}
				</ul>
			</div>

			{/* Search Bar */}
			<div className="max-w-[27rem] mx-4">
				<div className="relative">
					<Search
						className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
						width={18}
					/>
					<Input
						type="search"
						id="search"
						placeholder="Search products..."
						className="w-full pl-8 py-4"
					/>
				</div>
			</div>

			{/* Account and Cart and Wishlist */}
			<div className="flex items-center space-x-4">
				{/* Wishlist */}
				<Tooltip>
					<TooltipTrigger>
						<Link to={"/favourites"}>
							<div className="relative">
								<Heart className="w-5 h-5 hover:text-destructive transition-colors duration-200 ease-in-out" />
								{favourite_count > 0 && (
									<span className="absolute -top-1.5 -right-2 bg-destructive text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
										{favourite_count}
									</span>
								)}
							</div>
						</Link>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						<p>Wishlist</p>
					</TooltipContent>
				</Tooltip>

				{/* Cart */}
				<Tooltip>
					<TooltipTrigger>
						<Link to={"/cart"}>
							<div className="relative">
								<ShoppingBag className="w-5 h-5 hover:text-success transition-colors duration-200 ease-in-out" />
								{cart_count > 0 && (
									<span className="absolute -top-1.5 -right-2 bg-success text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
										{cart_count}
									</span>
								)}
							</div>
						</Link>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						<p>Cart</p>
					</TooltipContent>
				</Tooltip>

				{/* Account section */}
				<AccountSection />
			</div>
		</div>
	);
}
