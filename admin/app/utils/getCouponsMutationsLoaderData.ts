import type { Groups, TypesToSelect } from "@ecom/shared/types/coupons-comp";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { categoriesQuery } from "~/queries/categories.q";
import { collectionsNameQuery } from "~/queries/collections.q";
import { skuNamesQuery } from "~/queries/products.q";
import { groups, typeToParamMap } from "./couponsConstants";
import type { GetAllCategoriesResponse } from "@ecom/shared/types/category";
import type { SKUsNamesListResponse } from "@ecom/shared/types/products";
import type { CollectionsNamesListResponse } from "@ecom/shared/types/collections";

type FetchDataFuncReturn = Promise<
	GetAllCategoriesResponse | SKUsNamesListResponse | CollectionsNamesListResponse
> | null;

type FetchDataFuncProps = {
	group: Groups;
	entityType: TypesToSelect;
	request: Request;
};

type GroupData = {
	categoriesData: Promise<GetAllCategoriesResponse> | null;
	skusData: Promise<SKUsNamesListResponse> | null;
	collectionsData: Promise<CollectionsNamesListResponse> | null;
};

type MappedData = Partial<Record<Groups, GroupData>>;

export const getRelevantData = ({ entityType, group, request }: FetchDataFuncProps): FetchDataFuncReturn => {
	const searchParams = new URL(request.url).searchParams;
	const searchKey = `${group}_${entityType}_search`;
	const pageKey = `${group}_${entityType}_page`;
	const flagKey = `${group}_${typeToParamMap[entityType]}`;
	const searchQuery = searchParams.get(searchKey) || "";
	const page = Number(searchParams.get(pageKey)) || 1;
	const isRequested = searchParams.get(flagKey) === "true";

	// console.log(`Fetching data for ${group} ${entityType} - Flag ${flagKey}: ${searchParams.get(flagKey)}`);

	if (!isRequested) {
		// console.log(`Skipping fetch for ${group} ${entityType} because ${flagKey} is not "true"`);
		return null;
	}

	const pageIndex = Math.max(0, page - 1);
	const trimmedSearchQuery = searchQuery.trim();

	switch (entityType) {
		case "category":
			return queryClient.fetchQuery(
				categoriesQuery({
					request,
					autoRun: true,
					group,
					productCount: true,
					pageIndex,
					searchQuery: trimmedSearchQuery,
				}),
			);
		case "sku":
			return queryClient.fetchQuery(
				skuNamesQuery({
					request,
					autoRun: true,
					group,
					pageIndex,
					searchQuery: trimmedSearchQuery,
				}),
			);
		case "collection":
			return queryClient.fetchQuery(
				collectionsNameQuery({
					request,
					autoRun: true,
					group,
					pageIndex,
					searchQuery: trimmedSearchQuery,
				}),
			);
		default:
			return null;
	}
};

export const getMappedData = ({ request }: { request: Request }): MappedData => {
	const data: MappedData = {};

	for (const group of groups) {
		data[group] = {
			categoriesData: getRelevantData({
				group: group,
				entityType: "category",
				request,
			}) as Promise<GetAllCategoriesResponse> | null,
			skusData: getRelevantData({
				group: group,
				entityType: "sku",
				request,
			}) as Promise<SKUsNamesListResponse> | null,
			collectionsData: getRelevantData({
				group: group,
				entityType: "collection",
				request,
			}) as Promise<CollectionsNamesListResponse> | null,
		};
	}

	return data;
};
