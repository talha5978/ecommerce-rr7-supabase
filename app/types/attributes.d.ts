import type { ApiError } from "~/utils/ApiError";
import type { Database } from "~/types/supabase";

export type ProductAttributeRow = Database["public"]["Tables"]["attributes"]["Row"];

export type AttributeUpdationPayload = Database["public"]["Tables"]["attributes"]["Update"];

export type AttributeType = Database["public"]["Enums"]["attribute_type_enum"];

export interface HighLevelProductAttribute {
	attribute_type: string;
	values_count: number;
}

export interface HighLevelProductAttributesResponse {
	product_attributes: HighLevelProductAttribute[] | null;
	error: ApiError | null;
}

export interface ProductAttribute {
	id: string;
	name: string;
	value: string;
}

export interface GroupedProductAttributes {
	[attributeType: AttributeType]: ProductAttribute[];
}

export interface AllProductAttributesResponse {
	product_attributes: GroupedProductAttributes | null;
	error: ApiError | null;
}

export interface ProductAttributesResponse {
	product_attributes: ProductAttribute[] | null;
	total: number;
	error: ApiError | null;
}

export interface SingleProductAttributeResponse {
	product_attribute: ProductAttribute | null;
	error: ApiError | null;
}

export type GetAllProductAttribsInput = "all" | "for-variant" | "for-product";
