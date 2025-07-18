import { z } from "zod";
import { collectionSortByEnums, sortTypeEnums } from "~/constants";

export const CollectionFilterFormSchema = z.object({
	q: z.string().optional(),
	page: z.string().optional(),
	size: z.string().optional(),
	sortBy: z.enum(collectionSortByEnums).optional(),
	sortType: z.enum(sortTypeEnums).optional(),
});

export type CollectionsFilterFormData = z.infer<typeof CollectionFilterFormSchema>;

export interface CollectionFilers {
	sortBy?: CollectionsFilterFormData["sortBy"];
	sortType?: CollectionsFilterFormData["sortType"];
}