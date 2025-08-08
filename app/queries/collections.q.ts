import { queryOptions } from "@tanstack/react-query";
import type { Groups } from "~/components/Coupons/coupons-comp";
import { CollectionFilers } from "~/schemas/collections-filter.schema";
import { CollectionsService } from "~/services/collections.service";
import {
	CollectionDataItemsResponse,
	CollectionsNamesListResponse,
	GetFullCollection,
	GetHighLevelCollectionsResp,
} from "~/types/collections";

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

type collectionsNameQueryArgs = {
	request: Request;
	pageIndex?: number;
	searchQuery?: string;
	autoRun?: boolean;
	group: Groups;
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

export const collectionsNameQuery = ({
	request,
	pageIndex,
	searchQuery,
	autoRun,
	group,
}: collectionsNameQueryArgs) => {
	return queryOptions<CollectionsNamesListResponse>({
		queryKey: [`${group}_collectionNames`, pageIndex, searchQuery],
		queryFn: async () => {
			const collectionSvc = new CollectionsService(request);
			const result = await collectionSvc.getCollectionsNamesList(pageIndex, searchQuery);
			return result;
		},
		enabled: !!autoRun,
	});
};
