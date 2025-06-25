import type { AttributeType } from "./types/attributes";

class DefaultValues {
    readonly DEFAULT_CATEGORY_PAGE = 1;
    readonly DEFAULT_CATEGORY_PAGE_SIZE = 10;

    readonly DEFAULT_SUB_CATEGORY_PAGE = 1;
    readonly DEFAULT_SUB_CATEGORY_PAGE_SIZE = 10;

    readonly DEFAULT_PRODUCTS_PAGE = 1;
    readonly DEFAULT_PRODUCTS_PAGE_SIZE = 10;

    readonly DEFAULT_PRODUCTS_VARIANTS_PAGE = 1;
    readonly DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE = 20;

    readonly META_KEYWORDS_VALUE = 25;
}

export const defaults = new DefaultValues();

export const product_attributes_enum: AttributeType[] = ["color", "size", "material", "style", "brand"];

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export const REQUIRED_VARIANT_ATTRIBS = ["color", "size"];
export const OPTIONAL_PRODUCT_ATTRIBS = ["material", "style", "brand"];

export const DISABLED_DEFAULT_VARIANT_MESSAGE = "You cannot change this as other variant is currently set to default.";

export const TABLE_NAMES = {
	attributes: "attributes",
	product: "product",
	product_attributes: "product_attributes",
	product_variant: "product_variant",
	variant_attributes: "variant_attributes",
	meta_details: "meta_details",
	category: "category",
	sub_category: "sub_category",
};

export const STORAGE_BUCKETS = {
    images: "images",
}


export const SUPABASE_IMAGE_BUCKET_PATH = `https://xbpbnydexqzhespljrqi.supabase.co/storage/v1/object/public/${STORAGE_BUCKETS.images}/`;