import { memo } from "react";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";

export const LineSkeleton = memo(function LineSkeletonsFunc({ lines = 4 }: { lines?: number }) {
	return (
		<div className="w-full">
			{Array.from({ length: lines }, (_, idx) => (
				<div key={idx}>
					<Label className="flex items-center px-2 py-2 cursor-pointer">
						<Skeleton className="h-4 w-4 rounded-sm" />
						<Skeleton className="h-4 min-w-[250px] rounded-sm" />
					</Label>
				</div>
			))}
		</div>
	);
});
