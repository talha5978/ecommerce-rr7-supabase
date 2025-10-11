import type { AttributeType } from "@ecom/shared/types/attributes";
import type { ApiError } from "@ecom/shared/utils/ApiError";
import { type Database } from "~/types/supabase";

export interface ProductAttribute {
	id: string;
	name: string;
	value: string;
	attribute_type: AttributeType;
}

export interface VariantAttribute extends ProductAttribute {}

export interface ProductVariant {
	id: string;
	sku: string;
	stock: number;
	reorder_level: number;
	original_price: number;
	sale_price: number;
	images: string[];
	is_default: boolean;
	weight: number | null;
	status: boolean;
	created_at: string | null;
	attributes: VariantAttribute[];
}

export interface Collection {
	id: string;
	name: string;
	description: string;
	image_url: string;
	sort_order: number;
	status: boolean;
	created_at: string;
	meta_details: {
		id: string;
		url_key: string;
	};
}

export interface ProductDetails {
	cover_image: string;
	createdAt: string;
	description: string;
	free_shipping: boolean;
	id: string;
	is_featured: boolean;
	meta_details: string | null;
	name: string;
	status: boolean;
	sub_category: string;
	sub_category_id: string;
	sub_category_name: string;
	sub_category_description: string;
	sub_category_sort_order: number;
	sub_category_meta_details_id: string;
	sub_category_created_at: string;
	category_id: string;
	category_name: string;
	category_description: string;
	category_sort_order: number;
	category_meta_details_id: string;
	category_created_at: string;
	meta_details_id: string;
	meta_title: string;
	meta_description: string;
	meta_keywords: string | null;
	url_key: string;
	meta_created_at: string;
}

export interface ProductFullDetails {
	product: ProductDetails;
	variants: ProductVariant[];
	product_attributes: ProductAttribute[];
	collections: Collection[];
	applicable_coupons: []; // Empty array as coupons are no longer fetched
}

export interface GetProductFullDetailsResp {
	product: ProductFullDetails | null;
	error: ApiError | null;
}
