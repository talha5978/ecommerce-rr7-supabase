
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

export const product_attributes_enum = ["color", "size", "material", "style", "brand"];

export const SUPABASE_IMAGE_BUCKET_PATH = "https://xbpbnydexqzhespljrqi.supabase.co/storage/v1/object/public/product-images/";

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"];