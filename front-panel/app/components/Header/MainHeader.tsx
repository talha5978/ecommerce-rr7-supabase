import { Link } from "react-router";
import { Input } from "~/components/ui/input";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import AccountSection from "~/components/Header/AccountSection";

export default function MainHeader() {
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
						<div>
							<Heart className="w-5 h-5 hover:text-destructive transition-colors duration-200 ease-in-out" />
						</div>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						<p>Wishlist</p>
					</TooltipContent>
				</Tooltip>

				{/* Cart */}
				<Tooltip>
					<TooltipTrigger>
						<div>
							<ShoppingBag className="w-5 h-5 hover:text-success transition-colors duration-200 ease-in-out" />
						</div>
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
