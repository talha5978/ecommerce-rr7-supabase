import type { ApiError } from "~/lib/ApiError";
import type { Database } from "~/types/supabase"

export type CategoryRow =  Database["public"]["Tables"]["category"]["Row"];

export type SubCategoryRow =  Database["public"]["Tables"]["sub_category"]["Row"]; ;

export type FullCategory = CategoryRow & {
    sub_category: SubCategoryRow[]
}

export interface GetAllCategoriesResponse {
    categories: FullCategory[] | null;
    total: number;
    error: ApiError | null;
}