import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import React, { memo } from "react";
import { Link } from "react-router";
import type { FP_HomeCollection } from "@ecom/shared/types/collections";

interface HomeCollectionCardProps {
	collection: FP_HomeCollection;
}

const HomeCollectionCard: React.FC<HomeCollectionCardProps> = memo(({ collection, ...props }) => {
	return (
		<div className="w-full rounded-md shadow-md overflow-hidden" {...props}>
			<Link to={`/collection/${collection.id}`}>
				<div className="relative overflow-hidden">
					<div className="w-full aspect-w-6 aspect-h-3">
						<img
							src={SUPABASE_IMAGE_BUCKET_PATH + collection.image_url}
							alt={collection.description}
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="absolute flex flex-col bottom-0 left-0 px-4 py-2">
						<p className="text-sm bg-black/70 text-white">{collection.description}</p>
					</div>
				</div>
			</Link>
		</div>
	);
});

export default HomeCollectionCard;
