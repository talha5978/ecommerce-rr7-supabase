import type { ApiError } from "~/utils/ApiError";
import type { Database } from "./supabase";

export type VariantAttributeInput = Database["public"]["Tables"]["variant_attributes"]["Insert"];
export type VariantAttributeCreateResponse = {
    error: null | ApiError
}

export type VariantAttributesRow = Database["public"]["Tables"]["variant_attributes"]["Row"];
export type GetVariantAttributesResponse = {
    data: VariantAttributesRow[] | null,
    error: null | ApiError
}