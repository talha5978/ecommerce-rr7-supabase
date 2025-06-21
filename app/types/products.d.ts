import type { ApiError } from "~/utils/ApiError";
import type { Database } from "~/types/supabase"
import type { MetaDetailsRow } from "~/types/meta_details";
import { FullSubCategoryRow } from "./category";

export type ProductRow =  Database["public"]["Tables"]["product"]["Row"];

export type AttributeUpdationPayload =  Database["public"]["Tables"]["product_attributes"]["Update"];

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

export type ProductVariantRow =  Database["public"]["Tables"]["product_variant"]["Row"];

export type FullProduct = Omit<ProductRow & {
    meta_details: MetaDetailsRow | null;
    sub_category: FullSubCategoryRow;
    product_variants: ProductVariantRow[];
}>;

export interface GetSingleProductResponse {
    product: FullProduct | null;
    error: ApiError | null;
}

export type ProductUpdationPayload = Database["public"]["Tables"]["product"]["Update"];