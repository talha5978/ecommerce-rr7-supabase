import { queryOptions } from "@tanstack/react-query";
import type {
	CollectionDataItemsResponse,
	GetFullCollection,
	GetHighLevelCollectionsResp,
} from "@ecom/shared/types/collections";
import { CollectionsService } from "@ecom/shared/services/collections.service";
import type { CollectionFilers } from "@ecom/shared/schemas/collections-filter.schema";

interface collectionsQueryArgs {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
	filters?: CollectionFilers;
}

export type CollectionDataItemsArgs = {
	q?: string;
	categoryPageIndex?: number;
	productPageIndex?: number;
};

type collectionsDataItemsArgs = {
	request: Request;
} & CollectionDataItemsArgs;

type fullCollectionQueryArgs = {
	request: Request;
	collection_id: string;
};

export const collectionsQuery = ({ request, q, pageIndex, pageSize, filters }: collectionsQueryArgs) => {
	return queryOptions<GetHighLevelCollectionsResp>({
		queryKey: ["highLvlCollections", q, pageIndex, pageSize, filters],
		queryFn: async () => {
			const prodService = new CollectionsService(request);
			const result = await prodService.getHighLevelCollections(q, pageIndex, pageSize, filters);
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

export const FullCollectionQuery = ({ request, collection_id }: fullCollectionQueryArgs) => {
	return queryOptions<GetFullCollection>({
		queryKey: ["fullCollection", collection_id],
		queryFn: async () => {
			const collectionSvc = new CollectionsService(request);
			const result = await collectionSvc.getFullCollection(collection_id);
			return result;
		},
	});
};
