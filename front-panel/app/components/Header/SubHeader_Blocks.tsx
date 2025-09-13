import { Link } from "react-router";
import { type ComponentPropsWithRef } from "react";
import { cn } from "@ecom/shared/lib/utils";

type BlockSubHeaderPayloadItem = {
	id: string;
	name: string;
	slug: string;
	type: "category" | "collection"; // type can be either category or collection
	image_url?: string;
	sub_items?: {
		id: string;
		name: string;
		slug: string;
	}[]; // (optional) sub_items are the sub-categories
};

/** @description Sub Header component to display categories and collections */
export default function BlocksSubHeader({
	items,
	className,
}: {
	items: BlockSubHeaderPayloadItem[];
	className?: string & ComponentPropsWithRef<"div">["className"];
}) {
	return (
		<div className={cn("py-3", className)}>
			{items.map((item) => {
				return (
					<span key={item.id} className="block py-1">
						<Link
							to={`/${item.type}/${item.slug}`}
							className="hover:underline underline-offset-4 hover:text-primary transition-colors duration-200 ease-in-out"
						>
							{item.name}
						</Link>
					</span>
				);
			})}
		</div>
	);
}
