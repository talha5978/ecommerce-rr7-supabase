import { type SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "@ecom/shared/constants/constants";
import { createSupabaseServerClient } from "@ecom/shared/lib/supabase/supabase.server";
import { type Database } from "@ecom/shared/types/supabase";
import { UserRole } from "@ecom/shared/permissions/permissions.enum";
import { ApiError } from "@ecom/shared/utils/ApiError";

type ServiceBaseCurrentUser = {
	id: string;
	email: string;
	role: UserRole;
};

export interface ServiceBase {
	supabase: SupabaseClient<Database>;
	headers: Headers;
	request: Request;
	currentUser?: ServiceBaseCurrentUser | null | undefined;
}

export class Service implements ServiceBase {
	supabase;
	readonly headers;
	readonly request;
	currentUser?: ServiceBaseCurrentUser | null | undefined = null;

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

	protected readonly COUPONS_TABLE = "coupons";
	protected readonly SPECIFIC_COUPON_PRODUCTS_TABLE = "specific_coupon_products";
	protected readonly CUSTOMER_CONDITIONS_TABLE = "customer_conditions";
	protected readonly PRODUCT_CONDITIONS_TABLE = "product_conditions";
	protected readonly CUSTOMER_EMAILS_TABLE = "customer_emails";

	protected readonly HERO_SECTIONS_TABLE = "hero_sections";

	protected readonly STORE_SETTINGS_TABLE = "store_settings";

	constructor(request: Request, opts?: { supabase?: SupabaseClient<Database>; headers?: Headers }) {
		if (opts?.supabase && opts?.headers) {
			this.supabase = opts.supabase;
			this.headers = opts.headers;
		} else {
			const result = createSupabaseServerClient(request);
			this.supabase = result.supabase;
			this.headers = result.headers;
		}
		this.request = request;
	}

	/**
	 * Convenience method that instantiates child service classes with the same
	 * supabase instance + headers so we only ever have one client per request.
	 * @alert This method only works for classes that extend [Service] class
	 */
	protected async createSubService<
		T extends new (
			request: Request,
			opts?: { supabase?: SupabaseClient<Database>; headers?: Headers },
			...rest: any[]
		) => Service,
	>(
		ServiceClass: T,
		...extraArgs: ConstructorParameters<T> extends [any, any, ...infer R] ? R : any[]
	): Promise<InstanceType<T>> {
		if (!this.supabase || !this.headers) {
			throw new ApiError(
				"createSubService: parent service has no supabase or headers available",
				400,
				[],
			);
		}

		if (!Service.prototype.isPrototypeOf(ServiceClass.prototype)) {
			throw new ApiError(`createSubService: ${ServiceClass.name} class must extend Service`, 400, []);
		}

		const anyServiceClass = ServiceClass as any;

		if (typeof anyServiceClass.fromParent === "function") {
			const maybePromise = anyServiceClass.fromParent(this, ...extraArgs);
			const resolved = await Promise.resolve(maybePromise);
			return resolved as InstanceType<T>;
		}

		const maybeInstance = new ServiceClass(
			this.request,
			{ supabase: this.supabase, headers: this.headers },
			...extraArgs,
		);

		const instance = await Promise.resolve(maybeInstance);

		return instance as InstanceType<T>;
	}
}
