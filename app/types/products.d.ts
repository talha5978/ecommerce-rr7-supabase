import type { ApiError } from "~/utils/ApiError";
import type { Database } from "~/types/supabase"
import type { MetaDetailsRow } from "~/types/meta_details";
import type { FullSubCategoryRow } from "./category";
import type { ProductAttributeRow } from "./attributes";

export type ProductRow =  Database["public"]["Tables"]["product"]["Row"];

export interface HighLevelProduct {
    id: string;
    name: string;
    cover_image: string;
    is_featured: boolean;
    status: boolean;
    createdAt: string;
    variants_count: number;
    categoryName: string;
    subCategoryName: string;
}

export interface GetAllProductsResponse {
    products: HighLevelProduct[] | null;
    total: number;
    error: ApiError | null;
}

export type FullProduct = Omit<ProductRow & {
    meta_details: MetaDetailsRow | null;
    sub_category: FullSubCategoryRow;
    attributes: ProductAttributeRow[]
}>;

export interface GetSingleProductResponse {
    product: FullProduct | null;
    error: ApiError | null;
}

export type ProductUpdationPayload = Database["public"]["Tables"]["product"]["Update"];

export type ProductNameResponse = {
    productName: string | null;
    error: PostgrestError  | null;
}

export type ProductNameListRow = { id: string, name: string };

export type ProductNamesListResponse = {
    products: ProductNameListRow[] | null;
    total: number;
    error: ApiError | null;
}