import { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "~/constants";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { Database } from "~/types/supabase";

export class Service {
	supabase: SupabaseClient<Database>;
	readonly headers: Headers;
	readonly request: Request;

	readonly IMAGES_BUCKET = STORAGE_BUCKETS.images;

	readonly USERS_TABLE = "app_users";
	readonly USER_ROLES_TABLE = "user_roles";

	readonly ATTRIBUTES_TABLE = "attributes";
	readonly PRODUCT_ATTRIBUTES_TABLE = "product_attributes";
	readonly VARIANT_ATTRIBUTES_TABLE = "variant_attributes";

	readonly CATEGORY_TABLE = "category";
	readonly SUB_CATEGORY_TABLE = "sub_category";

	readonly META_DETAILS_TABLE = "meta_details";

	readonly COLLECTION_PRODUCTS_TABLE = "collection_products";
	readonly COLLECTION_TABLE = "collections";

	readonly PRODUCTS_TABLE = "product";
	readonly PRODUCT_VARIANT_TABLE = "product_variant";

	readonly BUY_X_GET_Y_TABLE = "buy_x_get_y_details";
	readonly CONDITION_GROUPS_TABLE = "condition_groups";
	readonly COUPONS_TABLE = "coupons";
	readonly CUSTOMER_CONDITIONS_TABLE = "customer_conditions";
	readonly PRODUCT_CONDITIONS_TABLE = "product_conditions";
	readonly CUSTOMER_EMAILS_TABLE = "customer_emails";

	constructor(request: Request) {
		const { supabase, headers } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.headers = headers;
		this.request = request;
	}
}
