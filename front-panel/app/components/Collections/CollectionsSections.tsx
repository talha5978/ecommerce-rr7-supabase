import type { FP_HomeCollection } from "@ecom/shared/types/collections";
import { ArrowRight } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router";
import HomeCollectionCard from "~/components/Collections/CollectionCard";

const CollectionsSection = memo(function CollectionsSectionFunc({
	collections,
}: {
	collections: FP_HomeCollection[];
}) {
	return (
		<section className="max-container py-8">
			<div className="flex items-end justify-between mb-6">
				<h2 className="text-3xl font-semibold tracking-tight">Collections</h2>
				<Link
					to="/collections"
					viewTransition
					prefetch="intent"
					className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
				>
					<span>View All</span>
					<ArrowRight className="w-4 h-4" />
				</Link>
			</div>

			<div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
				{collections.map((collection) => (
					<div key={collection.id} className="w-[280px] sm:w-[340px] flex-shrink-0 snap-start">
						<HomeCollectionCard collection={collection} />
					</div>
				))}
			</div>
		</section>
	);
});

export default CollectionsSection;
