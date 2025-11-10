import { Link } from "react-router";
import { Input } from "~/components/ui/input";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import AccountSection from "~/components/Header/AccountSection";
import { getNumberOfCartItems } from "~/utils/manageCart";
import { getNumberOfFavourites } from "~/utils/manageFavourites";

export default function MainHeader() {
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

			{/* Search Bar */}
			<div className="flex-1 max-w-[25rem] mx-4">
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
