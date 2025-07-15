import type { ApiError } from "~/utils/ApiError";
import type { Database } from "~/types/supabase"
import type { AttributeType, ProductAttributeRow } from "./attributes";

export type ProductVariantRow =  Database["public"]["Tables"]["product_variant"]["Row"];

export interface GetAllProductVariants {
    product_variants: ProductVariantRow[] | null;
    total: number;
    error: ApiError | null;
}

export type VariantRowForUpdate = {
    createdAt: string | null;
    id: string;
    images: string[];
    is_default: string;
    original_price: string;
    product_id: string;
    reorder_level: string;
    sale_price: string;
    sku: string;
    status: string;
    stock: string;
    weight: string | null;
}

export type SingleProductVariant = VariantRowForUpdate & {
    attributes: ProductAttributeRow[]
}

export interface SingleProductVariantResponse {
    variant: SingleProductVariant | null;
    error: ApiError | null;
}

export type ProductVariantUpdationPayload = Database["public"]["Tables"]["product_variant"]["Update"];

export type PrevVaraintOptAttribs = {
    attribute_type: AttributeType
    id: string
}

export type VariantConstraintsData = {
    is_default_variant_exists: boolean;
    default_variant_id: string | null;
    productName: string | null;
    error: ApiError | null;
}