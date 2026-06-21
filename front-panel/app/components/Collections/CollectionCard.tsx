import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import type { FP_HomeCollection } from "@ecom/shared/types/collections";
import { ArrowRight } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router";

interface HomeCollectionCardProps {
	collection: FP_HomeCollection;
}

const HomeCollectionCard: React.FC<HomeCollectionCardProps> = memo(({ collection }) => {
	return (
		<div className="group relative w-full h-[380px] overflow-hidden rounded-xs bg-card border border-border shadow-sm hover:shadow-md transition-all duration-500">
			<Link
				to={`/collection/${collection.id}/${collection.url}`}
				prefetch="none"
				viewTransition
				className="block h-full"
			>
				{/* Image */}
				<div className="absolute inset-0">
					<img
						src={SUPABASE_IMAGE_BUCKET_PATH + collection.image_url}
						alt={collection.name}
						className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
				</div>

				{/* Content */}
				<div className="absolute bottom-0 left-0 right-0 p-8 text-white">
					<div className="space-y-3">
						<h3 className="text-2xl md:text-3xl font-semibold tracking-tighter leading-none drop-shadow-md">
							{collection.name}
						</h3>

						{collection.description && (
							<p className="text-white/90 text-[15px] line-clamp-2 pr-8 drop-shadow-sm">
								{collection.description}
							</p>
						)}

						<div className="inline-flex items-center gap-2 text-sm font-medium pt-3 border-t border-white/30 group-hover:border-white/50 transition-colors">
							Shop Now
							<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
						</div>
					</div>
				</div>

				{/* Subtle shine effect */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-30 transition-opacity duration-700" />
			</Link>
		</div>
	);
});

export default HomeCollectionCard;
