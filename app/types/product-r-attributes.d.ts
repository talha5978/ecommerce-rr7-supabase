import type { ApiError } from "~/utils/ApiError";
import type { Database } from "./supabase";

export type ProductRAttributeInput = Database["public"]["Tables"]["product_attributes"]["Insert"];
export type ProductRAttributeCreateResponse = {
	error: null | ApiError;
};

export type ProductRAttributesRow = Database["public"]["Tables"]["product_attributes"]["Row"];
export type GetVariantAttributesResponse = {
	data: ProductRAttributesRow[] | null;
	error: null | ApiError;
};
