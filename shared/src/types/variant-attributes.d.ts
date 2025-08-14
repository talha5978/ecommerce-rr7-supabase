import type { ApiError } from "@ecom/shared/utils/ApiError";
import type { Database } from "@ecom/shared/types/supabase";

export type VariantAttributeInput = Database["public"]["Tables"]["variant_attributes"]["Insert"];
export type VariantAttributeCreateResponse = {
	error: null | ApiError;
};

export type VariantAttributesRow = Database["public"]["Tables"]["variant_attributes"]["Row"];
export type GetVariantAttributesResponse = {
	data: VariantAttributesRow[] | null;
	error: null | ApiError;
};
