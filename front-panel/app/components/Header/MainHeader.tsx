import { Link } from "react-router";
import { Input } from "~/components/ui/input";
import { Heart, Search, ShoppingBag, Menu } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import AccountSection from "~/components/Header/AccountSection";
import { getNumberOfCartItems } from "~/utils/manageCart";
import { getNumberOfFavourites } from "~/utils/manageFavourites";
import type { FP_HeaderCategory } from "@ecom/shared/types/category";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { useState } from "react";

export default function MainHeader({ categories }: { categories: FP_HeaderCategory[] }) {
	const cart_count = getNumberOfCartItems();
	const favourite_count = getNumberOfFavourites();
	const [open, setOpen] = useState(false);

	const sortedCategories = categories.sort((a, b) => a.sort_order - b.sort_order);

	return (
		<header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
			<div className="container mx-auto px-4 py-4 flex items-center justify-between">
				{/* Logo - Always Visible */}
				<Link to="/" viewTransition prefetch="intent" className="flex-shrink-0">
					<div className="sm:w-36 w-32">
						<img src="/LOGO.png" className="w-full h-fit" alt="VOUGEWALK" />
					</div>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center justify-center flex-1">
					<ul className="flex gap-4 text-md font-medium">
						{sortedCategories.map((category) => (
							<li key={category.id}>
								<Link
									to={`/search?categories=${category.id}`}
									className="hover:text-primary transition-colors duration-200"
									prefetch="intent"
								>
									{category.category_name}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				{/* Desktop Search */}
				<div className="hidden md:block max-w-[28rem] flex-1 mx-6">
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							type="search"
							placeholder="Search products..."
							className="w-full pl-10 py-2 bg-muted/50"
						/>
					</div>
				</div>

				{/* Desktop Icons */}
				<div className="hidden md:flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Link to="/favourites">
								<div className="relative p-2 hover:bg-accent rounded-full transition-colors">
									<Heart className="w-5 h-5" />
									{favourite_count > 0 && (
										<span className="absolute -top-1 -right-1 bg-destructive text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
											{favourite_count}
										</span>
									)}
								</div>
							</Link>
						</TooltipTrigger>
						<TooltipContent>Favourites</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Link to="/cart">
								<div className="relative p-2 hover:bg-accent rounded-full transition-colors">
									<ShoppingBag className="w-5 h-5" />
									{cart_count > 0 && (
										<span className="absolute -top-1 -right-1 bg-success text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
											{cart_count}
										</span>
									)}
								</div>
							</Link>
						</TooltipTrigger>
						<TooltipContent>Cart</TooltipContent>
					</Tooltip>

					<AccountSection />
				</div>

				{/* Mobile Menu Button */}
				<div className="md:hidden flex items-center gap-3">
					<Link to="/cart" className="relative">
						<ShoppingBag className="w-5 h-5" />
						{cart_count > 0 && (
							<span className="absolute -top-1.5 -right-1.5 bg-success text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
								{cart_count}
							</span>
						)}
					</Link>

					<Sheet open={open} onOpenChange={setOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden">
								<Menu className="w-6 h-6" />
							</Button>
						</SheetTrigger>

						<SheetContent side="right" className="w-80 p-6">
							<SheetHeader className="px-0 py-4">
								<SheetTitle className="text-left">Menu</SheetTitle>
							</SheetHeader>

							<div className="flex flex-col h-full gap-6">
								{/* Categories */}
								<div>
									<h3 className="font-semibold mb-4 text-lg">Categories</h3>
									<div className="flex flex-col gap-3">
										{sortedCategories.map((category) => (
											<Link
												key={category.id}
												to={`/search?categories=${category.id}`}
												onClick={() => setOpen(false)}
												className="py-2 px-4 hover:bg-accent border border-border rounded-sm transition-colors"
											>
												{category.category_name}
											</Link>
										))}
									</div>
								</div>

								{/* Actions */}
								<div className="mt-auto space-y-2">
									<Link
										to="/favourites"
										onClick={() => setOpen(false)}
										className="flex items-center gap-3 py-2 px-4 hover:bg-accent border border-border rounded-sm transition-colors"
									>
										<Heart className="w-4 h-4" />
										<span>Wishlist</span>
										{favourite_count > 0 && (
											<span className="ml-auto bg-destructive text-white text-xs px-2 py-1 rounded-full">
												{favourite_count}
											</span>
										)}
									</Link>

									<Link
										to="/cart"
										onClick={() => setOpen(false)}
										className="flex items-center gap-3 py-2 px-4 hover:bg-accent border border-border rounded-sm transition-colors"
									>
										<ShoppingBag className="w-4 h-4" />
										<span>Cart</span>
										{cart_count > 0 && (
											<span className="ml-auto bg-success text-white text-xs px-2 py-1 rounded-full">
												{cart_count}
											</span>
										)}
									</Link>

									<div onClick={() => setOpen(false)}>
										<AccountSection isMobile />
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
