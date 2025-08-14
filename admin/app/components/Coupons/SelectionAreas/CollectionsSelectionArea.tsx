import { memo } from "react";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { LineSkeleton } from "~/components/Coupons/Skeletons/LineSkeleton";
import type { CollectionNameListRow, CollectionsNamesListResponse } from "@ecom/shared/types/collections";
import type { SelectionAreaProps } from "@ecom/shared/types/coupons-comp";
import { COUPONS_COLLECTIONS_PAGE_SIZE } from "@ecom/shared/constants/constants";

export const CollectionsSelectionArea = memo(
	({ field, resolvedData }: SelectionAreaProps<CollectionsNamesListResponse>) => {
		if (resolvedData == null) return <LineSkeleton lines={COUPONS_COLLECTIONS_PAGE_SIZE} />;

		const { collections, error: fetchError } = resolvedData;
		// console.log("SKUS", collections);

		if (
			!collections ||
			!Array.isArray(collections) ||
			collections.length === 0 ||
			fetchError?.ok === false
		) {
			return (
				<div className="my-9 p-4 pt-6">
					<p className="text-muted-foreground w-fit text-sm mx-auto">No collections found</p>
				</div>
			);
		}

		const handleToggle = (id: string, checked: boolean) => {
			const currentIds = Array.isArray(field.value) ? (field.value as string[]) : [];
			if (checked) {
				field.onChange([...currentIds, id]);
			} else {
				field.onChange(currentIds.filter((selectedId: string) => selectedId !== id));
			}
		};

		return (
			<div className="grid gap-2">
				{collections.map((collection: CollectionNameListRow) => (
					<div className="w-full text-left hover:underline underline-offset-4" key={collection.id}>
						<Label className="flex items-center px-2 py-2 cursor-pointer">
							<Checkbox
								checked={(field.value as string[]).includes(collection.id)}
								onCheckedChange={(checked) => handleToggle(collection.id, checked as boolean)}
								className="mr-2"
							/>
							{collection.name}
						</Label>
					</div>
				))}
			</div>
		);
	},
);
