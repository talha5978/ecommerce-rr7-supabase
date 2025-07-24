import { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS, TABLE_NAMES } from "~/constants";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { Database } from "~/types/supabase";

export class Service {
	supabase: SupabaseClient<Database>;
	readonly headers: Headers;
    readonly request: Request;

    readonly IMAGES_BUCKET = STORAGE_BUCKETS.images;
    
	readonly USERS_TABLE = TABLE_NAMES.users;
	readonly USER_ROLES_TABLE = TABLE_NAMES.user_roles;

	readonly ATTRIBUTES_TABLE = TABLE_NAMES.attributes;
	readonly PRODUCT_ATTRIBUTES_TABLE = TABLE_NAMES.product_attributes;
    readonly VARIANT_ATTRIBUTES_TABLE = TABLE_NAMES.variant_attributes;

	readonly CATEGORY_TABLE = TABLE_NAMES.category;
	readonly SUB_CATEGORY_TABLE = TABLE_NAMES.sub_category;

	readonly META_DETAILS_TABLE = TABLE_NAMES.meta_details;

    readonly COLLECTION_PRODUCTS_TABLE = TABLE_NAMES.collection_products;
    readonly COLLECTION_TABLE = TABLE_NAMES.collection;
    
    readonly PRODUCTS_TABLE = TABLE_NAMES.product;
    readonly PRODUCT_VARIANT_TABLE = TABLE_NAMES.product_variant;

	constructor(request: Request) {
		const { supabase, headers } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.headers = headers;
        this.request = request;
	}
}