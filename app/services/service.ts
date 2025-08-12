import { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "~/constants";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { Database } from "~/types/supabase";

export interface ServiceBase {
	supabase: SupabaseClient<Database>;
	headers: Headers;
	request: Request;
}

export class Service implements ServiceBase {
	supabase;
	readonly headers;
	readonly request;

	protected readonly IMAGES_BUCKET = STORAGE_BUCKETS.images;

	protected readonly USERS_TABLE = "app_users";
	protected readonly USER_ROLES_TABLE = "user_roles";

	protected readonly ATTRIBUTES_TABLE = "attributes";
	protected readonly PRODUCT_ATTRIBUTES_TABLE = "product_attributes";
	protected readonly VARIANT_ATTRIBUTES_TABLE = "variant_attributes";

	protected readonly CATEGORY_TABLE = "category";
	protected readonly SUB_CATEGORY_TABLE = "sub_category";

	protected readonly META_DETAILS_TABLE = "meta_details";

	protected readonly COLLECTION_PRODUCTS_TABLE = "collection_products";
	protected readonly COLLECTION_TABLE = "collections";

	protected readonly PRODUCTS_TABLE = "product";
	protected readonly PRODUCT_VARIANT_TABLE = "product_variant";

	protected readonly BUY_X_GET_Y_TABLE = "buy_x_get_y_details";
	protected readonly CONDITION_GROUPS_TABLE = "condition_groups";
	protected readonly CONDITION_GROUP_COLLECTIONS_TABLE = "condition_group_collections";
	protected readonly CONDITION_GROUP_SKUS_TABLE = "condition_group_skus";
	protected readonly CONDITION_GROUP_SUB_CATEGORIES_TABLE = "condition_group_sub_categories";
	protected readonly COUPONS_TABLE = "coupons";
	protected readonly CUSTOMER_CONDITIONS_TABLE = "customer_conditions";
	protected readonly PRODUCT_CONDITIONS_TABLE = "product_conditions";
	protected readonly CUSTOMER_EMAILS_TABLE = "customer_emails";

	constructor(request: Request) {
		const { supabase, headers } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.headers = headers;
		this.request = request;
	}
}
