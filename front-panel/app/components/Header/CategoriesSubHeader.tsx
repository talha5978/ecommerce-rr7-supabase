import { Link } from "react-router";
import { memo, type ComponentPropsWithRef } from "react";
import { cn } from "@ecom/shared/lib/utils";
import { FP_HeaderCategory } from "@ecom/shared/types/category";
import { Badge } from "~/components/ui/badge";

const ClearenceLink = () => {
	return (
		<span className="flex gap-2 justify-center items-center">
			<Link
				to={`/clearence`}
				className="hover:underline underline-offset-4 hover:text-primary transition-colors duration-200 ease-in-out self-center"
			>
				Clearence
			</Link>
			<div>
				<Badge variant={"destructive"}>Sale</Badge>
			</div>
		</span>
	);
};

const CategoriesSubHeader = memo(function CategoriesSubHeaderFunc({
	categories,
	className,
}: {
	categories: FP_HeaderCategory[];
	className?: string & ComponentPropsWithRef<"div">["className"];
}) {
	return (
		<div className={cn("flex justify-between gap-3", className)}>
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
			<ClearenceLink />
		</div>
	);
});

export default CategoriesSubHeader;
