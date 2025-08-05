import type { SKUsNameListRow, SKUsNamesListResponse } from "~/types/products";
import type { SelectionAreaProps } from "~/components/Coupons/coupons-comp";
import { SKUS_PAGE_SIZE } from "~/components/Coupons/BuyXGetYCard";
import { LineSkeleton } from "~/components/Coupons/Skeletons/LineSkeleton";
import { memo } from "react";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";

export const SKUsSelectionArea = memo(
	({ field, resolvedData }: SelectionAreaProps<SKUsNamesListResponse>) => {
		if (resolvedData == null) return <LineSkeleton lines={SKUS_PAGE_SIZE} />;

		const { skus, error: fetchError } = resolvedData;
		// console.log("SKUS", skus);

		if (skus == null || !skus || !Array.isArray(skus) || skus.length === 0 || fetchError?.ok === false) {
			return (
				<div className="my-9 p-4 pt-6">
					<p className="text-muted-foreground w-fit text-sm mx-auto">No SKUs found</p>
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
				{skus.map((sku: SKUsNameListRow) => (
					<div className="w-full text-left hover:underline underline-offset-4" key={sku.id}>
						<Label className="flex items-center px-2 py-2 cursor-pointer">
							<Checkbox
								checked={(field.value as string[]).includes(sku.id)}
								onCheckedChange={(checked) => handleToggle(sku.id, checked as boolean)}
								className="mr-2"
							/>
							{sku.sku}
						</Label>
					</div>
				))}
			</div>
		);
	},
);
