import type { FP_HomeCollection } from "@ecom/shared/types/collections";
import { memo } from "react";
import HomeCollectionCard from "~/components/Collections/CollectionCard";

const CollectionsSection = memo(function CollectionsSectionFunc({
	collections,
}: {
	collections: FP_HomeCollection[];
}) {
	return (
		<section className="max-container py-8">
			<div className="mb-6">
				<h2 className="md:text-3xl text-2xl font-semibold tracking-tight">Collections</h2>
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
