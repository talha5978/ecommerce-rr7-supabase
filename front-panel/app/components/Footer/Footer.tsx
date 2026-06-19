import { Link } from "react-router";
import type { FP_HeaderCategory } from "@ecom/shared/types/category";

export default function Footer({ categories }: { categories: FP_HeaderCategory[] }) {
	const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

	return (
		<footer className="bg-card border-t border-border mt-auto">
			<div className="max-container px-4 py-16">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-10">
					{/* Left Section - Logo & Punchline */}
					<div className="md:col-span-5">
						<Link to="/" className="inline-block mb-4">
							<img src="/LOGO.png" alt="Voguewalk" className="h-10 w-auto" />
						</Link>
						<p className="text-muted-foreground text-lg leading-relaxed max-w-md">
							Discover premium fashion that defines your style. Quality clothing, crafted for
							those who appreciate elegance.
						</p>
						<p className="text-sm text-muted-foreground mt-6">
							© {new Date().getFullYear()} Voguewalk. All rights reserved.
						</p>
					</div>

					{/* Quick Links */}
					<div className="md:col-span-3">
						<h3 className="font-semibold text-lg mb-5">Quick Links</h3>
						<ul className="space-y-3 text-muted-foreground">
							<li>
								<Link to="/" className="hover:text-foreground transition-colors">
									Home
								</Link>
							</li>
							<li>
								<Link to="/search" className="hover:text-foreground transition-colors">
									All Products
								</Link>
							</li>
							<li>
								<Link to="/collections" className="hover:text-foreground transition-colors">
									Collections
								</Link>
							</li>
							<li>
								<Link to="/about" className="hover:text-foreground transition-colors">
									About Us
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal & Support */}
					<div className="md:col-span-2">
						<h3 className="font-semibold text-lg mb-5">Support</h3>
						<ul className="space-y-3 text-muted-foreground">
							<li>
								<Link to="/contact" className="hover:text-foreground transition-colors">
									Contact Us
								</Link>
							</li>
							<li>
								<Link
									to="/privacy-policy"
									className="hover:text-foreground transition-colors"
								>
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link
									to="/terms-conditions"
									className="hover:text-foreground transition-colors"
								>
									Terms & Conditions
								</Link>
							</li>
							<li>
								<Link to="/shipping" className="hover:text-foreground transition-colors">
									Shipping Policy
								</Link>
							</li>
						</ul>
					</div>

					{/* Categories */}
					<div className="md:col-span-2">
						<h3 className="font-semibold text-lg mb-5">Categories</h3>
						<ul className="space-y-3 text-muted-foreground">
							{sortedCategories.slice(0, 6).map((category) => (
								<li key={category.id}>
									<Link
										to={`/search?categories=${category.id}`}
										className="hover:text-foreground transition-colors"
									>
										{category.category_name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
					<p>Made with passion for fashion • Voguewalk Pakistan</p>
				</div>
			</div>
		</footer>
	);
}
