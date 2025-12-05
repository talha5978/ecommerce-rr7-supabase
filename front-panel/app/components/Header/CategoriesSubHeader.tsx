import { Link } from "react-router";
import { memo } from "react";
import type { FP_HeaderCategory } from "@ecom/shared/types/category";

const CategoriesSubHeader = memo(function CategoriesSubHeaderFunc({
	categories,
}: {
	categories: FP_HeaderCategory[];
}) {
	return (
		<div className="flex justify-center flex-1">
			<ul className="flex gap-3 *:block *:py-1">
				{categories
					.sort((a, b) => a.sort_order - b.sort_order)
					.map((category) => {
						return (
							<li key={category.id}>
								<Link
									to={`/categories/${category.url_key}`}
									className="hover:underline underline-offset-4 hover:text-primary transition-colors duration-200 ease-in-out"
								>
									{category.category_name}
								</Link>
							</li>
						);
					})}
			</ul>
		</div>
	);
});

export default CategoriesSubHeader;
