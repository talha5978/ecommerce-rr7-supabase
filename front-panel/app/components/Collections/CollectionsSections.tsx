import type { FP_HomeCollection } from "@ecom/shared/types/collections";
import { memo } from "react";
import HomeCollectionCard from "~/components/Collections/CollectionCard";

const CollectionsSection = memo(function CollectionsSectionFunc({
	collections,
}: {
	collections: FP_HomeCollection[];
}) {
	return (
		<section className="max-container py-4 flex flex-col gap-4">
			<h2 className="text-2xl font-semibold">Collections</h2>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{collections.map((collection: FP_HomeCollection) => (
					<HomeCollectionCard collection={collection} key={collection.id} />
				))}
			</div>
		</section>
	);
});

export default CollectionsSection;
