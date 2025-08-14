import type { ApiError } from "@ecom/shared/utils/ApiError";
import type { Database } from "@ecom/shared/types/supabase";
import type { MetaDetailsRow } from "@ecom/shared/types/meta_details";
import type { FullSubCategoryRow } from "@ecom/shared/types/category";
import type { ProductAttributeRow } from "@ecom/shared/types/attributes";

export type ProductRow = Database["public"]["Tables"]["product"]["Row"];

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

export type FullProduct = Omit<
	ProductRow & {
		meta_details: MetaDetailsRow | null;
		sub_category: FullSubCategoryRow;
		attributes: ProductAttributeRow[];
	}
>;

export interface GetSingleProductResponse {
	product: FullProduct | null;
	error: ApiError | null;
}

export type ProductUpdationPayload = Database["public"]["Tables"]["product"]["Update"];

export type ProductNameResponse = {
	productName: string | null;
	error: PostgrestError | null;
};

export type ProductNameListRow = { id: string; name: string };

export type ProductNamesListResponse = {
	products: ProductNameListRow[] | null;
	total: number;
	error: ApiError | null;
};

export type SKUsNameListRow = { id: string; sku: string };

export type SKUsNamesListResponse = {
	skus: SKUsNameListRow[] | null;
	total: number;
	error: ApiError | null;
};
