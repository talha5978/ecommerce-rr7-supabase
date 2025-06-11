import type { ApiError } from "~/lib/ApiError";
import type { Database } from "~/types/supabase"

export type CategoryRow =  Database["public"]["Tables"]["category"]["Row"];

export type SubCategoryRow =  Database["public"]["Tables"]["sub_category"]["Row"];

export type MetaDetailsRow = Database["public"]["Tables"]["meta_details"]["Row"];

export type FullSubCategoryRow = Omit<SubCategoryRow, "meta_details"> & {
    meta_details: MetaDetailsRow | null;
};

export type FullCategoryRow = Omit<CategoryRow, "meta_details"> & {
    sub_category: FullSubCategoryRow[] | [];
    meta_details: MetaDetailsRow | null;
}

export interface GetAllCategoriesResponse {
    categories: FullCategoryRow[] | null;
    total: number;
    error: ApiError | null;
}

export interface GetSubCategoriesResponse {
    subCategories: FullSubCategoryRow[] | null;
    total: number;
    error: ApiError | null;
}

export interface GetCategoryResponse {
	category: FullCategoryRow | null;
	error: ApiError | null;
};

export type CategoryUpdationPayload = Database["public"]["Tables"]["category"]["Update"];

export interface GetSubCategoryResponse {
	sub_category: FullSubCategoryRow | null;
	error: ApiError | null;
};

export type SubCategoryUpdationPayload = Database["public"]["Tables"]["sub_category"]["Update"];