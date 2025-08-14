import type { ApiError } from "@ecom/shared/utils/ApiError";
import type { Database } from "./supabase";

export type ProductRAttributeInput = Database["public"]["Tables"]["product_attributes"]["Insert"];
export type ProductRAttributeCreateResponse = {
	error: null | ApiError;
};

export type ProductRAttributesRow = Database["public"]["Tables"]["product_attributes"]["Row"];
