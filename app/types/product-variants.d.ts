import type { ApiError } from "~/utils/ApiError";
import type { Database } from "~/types/supabase"
import type { MetaDetailsRow } from "~/types/meta_details";
import { FullSubCategoryRow } from "./category";

export type ProductVariantRow =  Database["public"]["Tables"]["product_variant"]["Row"];

export interface GetAllProductVariants {
    product_variants: ProductVariantRow[] | null;
    total: number;
    error: ApiError | null;
}