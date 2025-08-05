import type { ApiError } from "~/utils/ApiError";
import type { Database } from "~/types/supabase";
import type { MetaDetailsRow } from "~/types/meta_details";

export type CategoryRow = Database["public"]["Tables"]["category"]["Row"];

export type SubCategoryRow = Database["public"]["Tables"]["sub_category"]["Row"];

export type FullSubCategoryRow = Omit<SubCategoryRow, "meta_details"> & {
	meta_details: MetaDetailsRow | null;
};

export type FullCategoryRow = Omit<CategoryRow, "meta_details"> & {
	sub_category: FullSubCategoryRow[] | [];
	meta_details: MetaDetailsRow | null;
};

export type HighLevelCategory = {
	id: string;
	category_name: string;
	sub_category_count: number;
	createdAt: string;
	url_key: string | null;
};

export interface GetHighLevelCategoriesResponse {
	categories: HighLevelCategory[] | null;
	total: number;
	error: ApiError | null;
}

export interface SubCategoryListRow {
	id: string;
	sub_category_name: string;
	parent_id: string;
	products_count?: number;
}

export interface CategoryListRow {
	id: string;
	category_name: string;
	sub_category: SubCategoryListRow[];
}

export interface GetAllCategoriesResponse {
	categories: CategoryListRow[] | null;
	total: number;
	error: ApiError | null;
}

export type HighLevelSubCategory = {
	id: string;
	sub_category_name: string;
	description: string;
	createdAt: string;
	url_key: string | null;
	products_count: number;
};

export interface GetHighLevelSubCategoriesResponse {
	subCategories: HighLevelSubCategory[] | null;
	total: number;
	error: ApiError | null;
}

export interface GetCategoryResponse {
	category: FullCategoryRow | null;
	error: ApiError | null;
}

export type CategoryUpdationPayload = Database["public"]["Tables"]["category"]["Update"];

export interface GetSubCategoryResponse {
	sub_category: FullSubCategoryRow | null;
	error: ApiError | null;
}

export type SubCategoryUpdationPayload = Database["public"]["Tables"]["sub_category"]["Update"];
