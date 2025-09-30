import type { ApiError } from "@ecom/shared/utils/ApiError";
import type { Database } from "@ecom/shared/types/supabase";
import type { MetaDetailsRow } from "@ecom/shared/types/meta_details";

export interface HighLevelCollection {
	id: string;
	name: string;
	image_url: string;
	status: boolean;
	url_key: string;
	products_count: number;
	createdAt: string;
}

export interface GetHighLevelCollectionsResp {
	collections: HighLevelCollection[] | null;
	total: number;
	error: ApiError | null;
}

export type CollectionSelectionType = "null" | "category_based" | "product_based";
export interface CollectionCategoryListRow {
	id: string;
	category_name: string;
	sub_category: {
		id: string;
		sub_category_name: string;
		parent_id: string;
	}[];
}

export type CollectionDataProduct = {
	id: string;
	name: string;
	createdAt?: string; // Optional, as it’s used for sorting but not returned in the final response
};

export type CollectionDataSubCategory = {
	id: string;
	sub_category_name: string;
	parent_id: string;
	product_count: number;
	products: CollectionDataProduct[];
	createdAt?: string; // Optional, as it’s used for sorting but not returned in the final response
};

export type CollectionDataCategory = {
	id: string;
	category_name: string;
	sub_categories: CollectionDataSubCategory[];
	createdAt?: string; // Optional, as it’s used for sorting but not returned in the final response
};

// collection data that we are fetching on create and update collection page
export interface CollectionDataItemsResponse {
	categories: CollectionDataCategory[];
	totalCategories: number;
	totalProducts: number;
	error: ApiError | null;
}

// Product selected in collection mutation
export type SelectedProduct = { id: string; name: string };

type Collection_Row = Database["public"]["Tables"]["collections"]["Row"];

export type FullCollection = Omit<Collection_Row, "meta_details"> & {
	meta_details: MetaDetailsRow | null;
	products: SelectedProduct[];
};

export type GetFullCollection = {
	collection: FullCollection | null;
	error: ApiError | null;
};

export type CollectionNameListRow = { id: string; name: string };

export type CollectionsNamesListResponse = {
	collections: CollectionNameListRow[] | null;
	total: number;
	error: ApiError | null;
};

// Front panel collections
export type FP_HomeCollection = {
	description: string;
	id: string;
	image_url: string;
	url: string;
};

export type FP_HomeCollectionsResp = {
	collections: FP_HomeCollection[] | null;
	error: ApiError | null;
};
