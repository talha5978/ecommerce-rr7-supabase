import { queryOptions } from "@tanstack/react-query";
import { CollectionsService } from "~/services/collections.service";
import { CollectionDataItemsResponse, GetHighLevelCollectionsResp } from "~/types/collections";

interface collectionsQueryArgs {
    request: Request;
    q: string;
    pageIndex?: number;
    pageSize?: number;
}

export type CollectionDataItemsArgs = {
	q?: string;
	categoryPageIndex?: number;
	productPageIndex?: number;
}

type collectionsDataItemsArgs = {
    request: Request;
} & CollectionDataItemsArgs;

export const collectionsQuery = ({ request, q, pageIndex, pageSize }: collectionsQueryArgs) => {
	return queryOptions<GetHighLevelCollectionsResp>({
		queryKey: ["products", q, pageIndex, pageSize],
		queryFn: async () => {
			const prodService = new CollectionsService(request);
			const result = await prodService.getHighLevelCollections(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const collectionDataItemsQuery = ({
	request,
	q,
	categoryPageIndex,
	productPageIndex,
}: collectionsDataItemsArgs) => {
	return queryOptions<CollectionDataItemsResponse>({
		queryKey: ["collectionDataItems", q, categoryPageIndex, productPageIndex],
		queryFn: async () => {
			const collectionsSvc = new CollectionsService(request);
			const result = await collectionsSvc.getCollectionDataItems({
				q,
				categoryPageIndex,
				productPageIndex,
			});
			return result;
		},
	});
};