

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."address_type_enum" AS ENUM (
    'shipping',
    'billing',
    'both'
);


ALTER TYPE "public"."address_type_enum" OWNER TO "postgres";


COMMENT ON TYPE "public"."address_type_enum" IS 'This enum defines the type of addresses like "shipping", "billing", "both"';



CREATE TYPE "public"."attribute_type_enum" AS ENUM (
    'color',
    'size',
    'material',
    'style',
    'brand'
);


ALTER TYPE "public"."attribute_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."coupon_type_enum" AS ENUM (
    'manual',
    'automatic'
);


ALTER TYPE "public"."coupon_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."customer_type" AS ENUM (
    'admins',
    'employee',
    'all',
    'consumer'
);


ALTER TYPE "public"."customer_type" OWNER TO "postgres";


CREATE TYPE "public"."discount_type" AS ENUM (
    'fixed_order',
    'percentage_order',
    'fixed_product',
    'percentage_product'
);


ALTER TYPE "public"."discount_type" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'paid',
    'shipped',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_methods" AS ENUM (
    'cod',
    'online'
);


ALTER TYPE "public"."payment_methods" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded',
    'partially_refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_buy_x_get_y_details"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.discount_type = 'buy_x_get_y' AND NOT EXISTS (
    SELECT 1 FROM buy_x_get_y_details WHERE coupon_id = NEW.coupon_id
  ) THEN
    RAISE EXCEPTION 'buy_x_get_y coupons must have at least one entry in buy_x_get_y_details';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_buy_x_get_y_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_collection"("p_name" "text", "p_description" "text", "p_image_url" "text", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_sort_order" integer, "p_status" boolean, "p_product_ids" "uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  meta_id uuid;
  collection_id uuid;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Collection name is required';
  END IF;
  IF p_image_url IS NULL OR p_image_url = '' THEN
    RAISE EXCEPTION 'Image URL is required';
  END IF;
  IF p_url_key IS NULL OR p_url_key = '' THEN
    RAISE EXCEPTION 'URL key is required';
  END IF;
  IF p_meta_title IS NULL OR p_meta_title = '' THEN
    RAISE EXCEPTION 'Meta title is required';
  END IF;
  IF p_meta_description IS NULL OR p_meta_description = '' THEN
    RAISE EXCEPTION 'Meta description is required';
  END IF;

  -- product_ids must not be empty
  IF p_product_ids IS NULL OR array_length(p_product_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Atleast one product is required';
  END IF;

  -- Validate product_ids
  IF p_product_ids IS NOT NULL AND array_length(p_product_ids, 1) > 0 THEN
    PERFORM 1 FROM product WHERE id = ANY(p_product_ids);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'One or more product IDs are invalid';
    END IF;
  END IF;

  -- Insert into meta_details
  INSERT INTO meta_details (
    url_key,
    meta_title,
    meta_description,
    meta_keywords
  )
  VALUES (
    p_url_key,
    p_meta_title,
    p_meta_description,
    p_meta_keywords
  )
  
  RETURNING id INTO meta_id;

  -- Insert into collections
  INSERT INTO collections (
    name,
    description,
    image_url,
    meta_details,
    sort_order,
    status
  )
  VALUES (
    p_name,
    p_description,
    p_image_url,
    meta_id,
    p_sort_order,
    p_status
  )
  RETURNING id INTO collection_id;

  -- Insert into collection_products
  IF p_product_ids IS NOT NULL AND array_length(p_product_ids, 1) > 0 THEN
    INSERT INTO collection_products (collection_id, product_id)
    SELECT collection_id, unnest(p_product_ids);
  END IF;

  RETURN collection_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create collection: %', SQLERRM;
END;$$;


ALTER FUNCTION "public"."create_collection"("p_name" "text", "p_description" "text", "p_image_url" "text", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_sort_order" integer, "p_status" boolean, "p_product_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_category"("p_category_id" "uuid") RETURNS TABLE("success" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    sub_count INTEGER;
BEGIN
    -- Check if category has any sub-categories
    SELECT COUNT(*) INTO sub_count
    FROM sub_category 
    WHERE parent_id = p_category_id;

    IF sub_count > 0 THEN
        RETURN QUERY 
        SELECT FALSE, 'Cannot delete category: It has ' || sub_count || ' sub-category(s) linked to it.'::TEXT;
        RETURN;
    END IF;

    -- Delete the category
    DELETE FROM category 
    WHERE id = p_category_id;

    RETURN QUERY 
    SELECT TRUE, 'Category deleted successfully.'::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY 
    SELECT FALSE, 'Error deleting category: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."delete_category"("p_category_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_sub_category"("p_sub_category_id" "uuid") RETURNS TABLE("success" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    product_count INTEGER;
BEGIN
    -- Check if sub-category has any products
    SELECT COUNT(*) INTO product_count
    FROM product 
    WHERE sub_category = p_sub_category_id;

    IF product_count > 0 THEN
        RETURN QUERY 
        SELECT FALSE, 'Cannot delete sub-category: It has ' || product_count || ' product(s) linked to it.'::TEXT;
        RETURN;
    END IF;

    -- Delete the sub-category
    DELETE FROM sub_category 
    WHERE id = p_sub_category_id;

    RETURN QUERY 
    SELECT TRUE, 'Sub-category deleted successfully.'::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY 
    SELECT FALSE, 'Error deleting sub-category: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."delete_sub_category"("p_sub_category_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_high_level_collections"("p_search_term" "text" DEFAULT ''::"text", "p_page" integer DEFAULT 0, "p_page_size" integer DEFAULT 10, "p_sort_by" "text" DEFAULT 'createdAt'::"text", "p_sort_direction" "text" DEFAULT 'desc'::"text") RETURNS TABLE("id" "uuid", "name" "text", "image_url" "text", "status" boolean, "created_at" timestamp with time zone, "url_key" "text", "products_count" bigint, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH collection_counts AS (
    SELECT
      c.id,
      COUNT(cp.product_id) AS products_count
    FROM collections c
    LEFT JOIN collection_products cp ON c.id = cp.collection_id
    GROUP BY c.id
  ),
  total AS (
    SELECT COUNT(*) AS total_collection_count
    FROM collections c
    WHERE c.name ILIKE '%' || p_search_term || '%'
  )
  SELECT
    c.id,
    c.name,
    c.image_url,
    c.status,
    c."createdAt" AS created_at,
    md.url_key,
    cc.products_count,
    (SELECT total_collection_count FROM total) AS total_count
  FROM collections c
  JOIN meta_details md ON c.meta_details = md.id
  LEFT JOIN collection_counts cc ON c.id = cc.id
  WHERE c.name ILIKE '%' || p_search_term || '%'
  ORDER BY
    CASE WHEN p_sort_by = 'name' AND p_sort_direction = 'asc' THEN c.name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_direction = 'desc' THEN c.name END DESC,
    CASE WHEN p_sort_by = 'createdAt' AND p_sort_direction = 'asc' THEN c."createdAt" END ASC,
    CASE WHEN p_sort_by = 'createdAt' AND p_sort_direction = 'desc' THEN c."createdAt" END DESC,
    CASE WHEN p_sort_by = 'status' AND p_sort_direction = 'asc' THEN c.status END ASC,
    CASE WHEN p_sort_by = 'status' AND p_sort_direction = 'desc' THEN c.status END DESC,
    CASE WHEN p_sort_by = 'products_count' AND p_sort_direction = 'asc' THEN cc.products_count END ASC,
    CASE WHEN p_sort_by = 'products_count' AND p_sort_direction = 'desc' THEN cc.products_count END DESC
  OFFSET (p_page * p_page_size) LIMIT p_page_size;
END;
$$;


ALTER FUNCTION "public"."get_high_level_collections"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_attribute_types"() RETURNS TABLE("attribute_type" "public"."attribute_type_enum", "values_count" bigint)
    LANGUAGE "plpgsql"
    AS $$BEGIN
    RETURN QUERY
    SELECT 
        attributes.attribute_type,
        COUNT(*) AS values_count
    FROM attributes
    GROUP BY attributes.attribute_type
    ORDER BY attributes.attribute_type;
END;$$;


ALTER FUNCTION "public"."get_product_attribute_types"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_full_details"("p_product_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql"
    AS $$WITH
product_data AS (
  SELECT
    p.*,
    sc.id AS sub_category_id,
    sc.sub_category_name, 
    sc.description AS sub_category_description,
    sc.sort_order AS sub_category_sort_order,
    sc.meta_details AS sub_category_meta_details_id,
    sc."createdAt" AS sub_category_created_at,
    c.id AS category_id,
    c.category_name,
    c.description AS category_description,
    c.sort_order AS category_sort_order,
    c.meta_details AS category_meta_details_id,
    c."createdAt" AS category_created_at,
    m.id AS meta_details_id,
    m.meta_title,
    m.meta_description,
    m.meta_keywords,
    m.url_key,
    m."createdAt" AS meta_created_at
  FROM public.product p
  LEFT JOIN public.sub_category sc ON p.sub_category = sc.id
  LEFT JOIN public.category c ON sc.parent_id = c.id
  LEFT JOIN public.meta_details m ON p.meta_details = m.id
  WHERE p.id = p_product_id
),
variants_data AS (
  SELECT
    pv.product_id,
    json_agg(
      json_build_object(
        'id', pv.id,
        'sku', pv.sku,
        'stock', pv.stock,
        'reorder_level', pv.reorder_level,
        'original_price', pv.original_price,
        'sale_price', pv.sale_price,
        'images', pv.images,
        'is_default', pv.is_default,
        'weight', pv.weight,
        'status', pv.status,
        'created_at', pv."createdAt",
        'attributes', (
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'value', a.value,
              'attribute_type', a.attribute_type
            )
          )
          FROM public.variant_attributes va
          JOIN public.attributes a ON va.attribute_id = a.id
          WHERE va.variant_id = pv.id
        )
      )
    ) AS variants
  FROM public.product_variant pv
  WHERE pv.product_id = p_product_id
  GROUP BY pv.product_id
),
product_attributes_data AS (
  SELECT
    pa.product_id,
    json_agg(
      json_build_object(
        'id', a.id,
        'name', a.name,
        'value', a.value,
        'attribute_type', a.attribute_type
      )
    ) AS product_attributes
  FROM public.product_attributes pa
  JOIN public.attributes a ON pa.attribute_id = a.id
  WHERE pa.product_id = p_product_id
  GROUP BY pa.product_id
),
collections_data AS (
  SELECT
    cp.product_id,
    json_agg(
      json_build_object(
        'id', co.id,
        'name', co.name,
        'meta_details', (
          SELECT json_build_object(
            'id', md.id,
            'url_key', md.url_key
          )
          FROM public.meta_details md
          WHERE md.id = co.meta_details
        )
      )
    ) AS collections
  FROM public.collection_products cp
  JOIN public.collections co ON cp.collection_id = co.id
  WHERE cp.product_id = p_product_id
    AND co.status = true
  GROUP BY cp.product_id
)
SELECT json_build_object(
  'product', row_to_json(pd),
  'variants', COALESCE(vd.variants, '[]'::json),
  'product_attributes', COALESCE(pad.product_attributes, '[]'::json),
  'collections', COALESCE(cd.collections, '[]'::json),
  'applicable_coupons', '[]'::json -- Truncated: no coupon logic needed
) AS details
FROM product_data pd
LEFT JOIN variants_data vd ON pd.id = vd.product_id
LEFT JOIN product_attributes_data pad ON pd.id = pad.product_id
LEFT JOIN collections_data cd ON pd.id = cd.product_id;$$;


ALTER FUNCTION "public"."get_product_full_details"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.app_users (
    user_id,
    first_name,
    last_name,
    role,
    status
  )
  VALUES (
    NEW.id,
    '',
    '',
    4, -- Consumer role id by default
    TRUE
  );
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_admin_users"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.admin_users;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."refresh_admin_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_collection"("p_collection_id" "uuid", "p_name" "text", "p_description" "text", "p_image_url" "text", "p_sort_order" integer, "p_status" boolean, "p_meta_details_id" "uuid", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_added_product_ids" "uuid"[], "p_removed_product_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Begin transaction
  BEGIN
    -- Update collections table
    UPDATE collections
    SET
      name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      image_url = COALESCE(p_image_url, image_url),
      sort_order = COALESCE(p_sort_order, sort_order),
      status = COALESCE(p_status, status)
    WHERE id = p_collection_id;

    -- Update meta_details table
    UPDATE meta_details
    SET
      url_key = COALESCE(p_url_key, url_key),
      meta_title = COALESCE(p_meta_title, meta_title),
      meta_description = COALESCE(p_meta_description, meta_description),
      meta_keywords = COALESCE(p_meta_keywords, meta_keywords)
    WHERE id = p_meta_details_id;

    -- Delete removed product IDs
    IF p_removed_product_ids IS NOT NULL AND array_length(p_removed_product_ids, 1) > 0 THEN
      DELETE FROM collection_products
      WHERE collection_id = p_collection_id
      AND product_id = ANY(p_removed_product_ids);
    END IF;

    -- Insert added product IDs
    IF p_added_product_ids IS NOT NULL AND array_length(p_added_product_ids, 1) > 0 THEN
      INSERT INTO collection_products (collection_id, product_id)
      SELECT p_collection_id, product_id
      FROM unnest(p_added_product_ids) AS product_id
      ON CONFLICT (collection_id, product_id) DO NOTHING;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update collection: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION "public"."update_collection"("p_collection_id" "uuid", "p_name" "text", "p_description" "text", "p_image_url" "text", "p_sort_order" integer, "p_status" boolean, "p_meta_details_id" "uuid", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_added_product_ids" "uuid"[], "p_removed_product_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "stripe_wrapper" HANDLER "extensions"."stripe_fdw_handler" VALIDATOR "extensions"."stripe_fdw_validator";



SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "province" "text",
    "city" "text" NOT NULL,
    "address_type" "public"."address_type_enum" NOT NULL,
    "latitude" numeric,
    "longitude" numeric,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "address_name" "text"
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "user_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "phone_number" "text",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "role" bigint NOT NULL,
    "status" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."admin_users" AS
 SELECT "app_users"."user_id"
   FROM "public"."app_users"
  WHERE ("app_users"."role" = 2)
  WITH NO DATA;


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attributes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "attribute_type" "public"."attribute_type_enum" NOT NULL,
    "name" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "public"."attributes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "meta_details" "uuid" NOT NULL
);


ALTER TABLE "public"."category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collection_products" (
    "collection_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL
);


ALTER TABLE "public"."collection_products" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."collections_sort_order_seq"
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."collections_sort_order_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "status" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT "nextval"('"public"."collections_sort_order_seq"'::"regclass") NOT NULL,
    "meta_details" "uuid" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "coupon_id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "status" boolean DEFAULT true NOT NULL,
    "discount_value" numeric(10,2),
    "coupon_type" "public"."coupon_type_enum" DEFAULT 'manual'::"public"."coupon_type_enum" NOT NULL,
    "max_total_uses" integer,
    "one_use_per_customer" boolean DEFAULT false,
    "start_timestamp" timestamp with time zone NOT NULL,
    "end_timestamp" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "discount_type" "public"."discount_type" NOT NULL,
    CONSTRAINT "coupons_code_check" CHECK (((("coupon_type" = 'manual'::"public"."coupon_type_enum") AND ("code" IS NOT NULL)) OR ("coupon_type" = 'automatic'::"public"."coupon_type_enum"))),
    CONSTRAINT "coupons_max_total_uses_check" CHECK ((("max_total_uses" >= 1) OR ("max_total_uses" IS NULL)))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


ALTER TABLE "public"."coupons" ALTER COLUMN "coupon_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."coupons_coupon_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."customer_conditions" (
    "customer_condition_id" bigint NOT NULL,
    "coupon_id" bigint NOT NULL,
    "customer_type" "public"."customer_type",
    "min_purchased_amount" numeric(10,2),
    CONSTRAINT "customer_conditions_min_purchased_amount_check" CHECK ((("min_purchased_amount" >= (0)::numeric) OR ("min_purchased_amount" IS NULL)))
);


ALTER TABLE "public"."customer_conditions" OWNER TO "postgres";


ALTER TABLE "public"."customer_conditions" ALTER COLUMN "customer_condition_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."customer_conditions_customer_condition_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."customer_emails" (
    "email_id" bigint NOT NULL,
    "customer_condition_id" bigint NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."customer_emails" OWNER TO "postgres";


ALTER TABLE "public"."customer_emails" ALTER COLUMN "email_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."customer_emails_email_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."hero_sections" (
    "id" bigint NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "url" "text" NOT NULL,
    "image" "text" NOT NULL,
    "status" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text" NOT NULL,
    "image_mobile" "text"
);


ALTER TABLE "public"."hero_sections" OWNER TO "postgres";


ALTER TABLE "public"."hero_sections" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."hero_sections_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."meta_details" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "url_key" "text" NOT NULL,
    "meta_title" "text" NOT NULL,
    "meta_description" "text" NOT NULL,
    "meta_keywords" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meta_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "price" numeric NOT NULL,
    "sku" "text" NOT NULL,
    "size" "text" NOT NULL,
    "color" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_note" "text",
    "user_id" "uuid" NOT NULL,
    "sub_total" numeric NOT NULL,
    "tax_amount" numeric NOT NULL,
    "shipping" numeric NOT NULL,
    "discount" numeric NOT NULL,
    "total" numeric NOT NULL,
    "status" "public"."order_status" NOT NULL,
    "shipping_address_id" "uuid" NOT NULL,
    "billing_address_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "public"."payment_status" NOT NULL,
    "method" "public"."payment_methods" NOT NULL,
    "payment_intent_id" "text",
    "currency" "text" NOT NULL,
    "refunded_amount" numeric,
    "refund_proofs" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" boolean DEFAULT true NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "free_shipping" boolean DEFAULT false NOT NULL,
    "cover_image" "text" NOT NULL,
    "sub_category" "uuid" NOT NULL,
    "meta_details" "uuid" DEFAULT "gen_random_uuid"(),
    "createdAt" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."product" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_attributes" (
    "id" bigint NOT NULL,
    "product_id" "uuid" NOT NULL,
    "attribute_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_attributes" OWNER TO "postgres";


ALTER TABLE "public"."product_attributes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_attributes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."product_variant" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "sku" "text" NOT NULL,
    "weight" double precision,
    "original_price" numeric DEFAULT 0 NOT NULL,
    "sale_price" numeric DEFAULT 0 NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "reorder_level" integer DEFAULT 0 NOT NULL,
    "status" boolean DEFAULT true NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "createdAt" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text")
);


ALTER TABLE "public"."product_variant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."specific_coupon_products" (
    "id" bigint NOT NULL,
    "coupon_id" bigint NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."specific_coupon_products" OWNER TO "postgres";


ALTER TABLE "public"."specific_coupon_products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."specific_coupon_products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."store_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "store_address" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "phone_1" "text" DEFAULT '+923146023887'::"text" NOT NULL,
    "phone_2" "text" DEFAULT '+923146023887'::"text" NOT NULL,
    "email_1" "text" DEFAULT 'store@domain.com'::"text" NOT NULL,
    "email_2" "text" DEFAULT 'store@domain.com'::"text" NOT NULL,
    "shipping_rate" double precision DEFAULT '250'::double precision NOT NULL
);


ALTER TABLE "public"."store_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sub_category" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sub_category_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "meta_details" "uuid" NOT NULL
);


ALTER TABLE "public"."sub_category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_applications_categories" (
    "id" bigint NOT NULL,
    "tax_rate_id" bigint NOT NULL,
    "category_id" "uuid" NOT NULL
);


ALTER TABLE "public"."tax_applications_categories" OWNER TO "postgres";


ALTER TABLE "public"."tax_applications_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tax_applications_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tax_rates" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "type" bigint NOT NULL,
    "rate" real NOT NULL,
    "status" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tax_rates" OWNER TO "postgres";


ALTER TABLE "public"."tax_rates" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tax_rates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tax_types" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tax_types" OWNER TO "postgres";


ALTER TABLE "public"."tax_types" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tax_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" bigint NOT NULL,
    "role_name" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'This table defines the types of users';



ALTER TABLE "public"."user_roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."variant_attributes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "attribute_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."variant_attributes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_meta_details_key" UNIQUE ("meta_details");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collection_products"
    ADD CONSTRAINT "collection_products_pkey" PRIMARY KEY ("collection_id", "product_id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id");



ALTER TABLE ONLY "public"."customer_conditions"
    ADD CONSTRAINT "customer_conditions_customer_condition_id_key" UNIQUE ("customer_condition_id");



ALTER TABLE ONLY "public"."customer_conditions"
    ADD CONSTRAINT "customer_conditions_pkey" PRIMARY KEY ("customer_condition_id");



ALTER TABLE ONLY "public"."customer_emails"
    ADD CONSTRAINT "customer_emails_pkey" PRIMARY KEY ("email_id");



ALTER TABLE ONLY "public"."hero_sections"
    ADD CONSTRAINT "hero_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meta_details"
    ADD CONSTRAINT "meta_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attributes"
    ADD CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_attributes"
    ADD CONSTRAINT "product_attributes_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variant"
    ADD CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variant"
    ADD CONSTRAINT "product_variant_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."specific_coupon_products"
    ADD CONSTRAINT "specific_coupon_products_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."specific_coupon_products"
    ADD CONSTRAINT "specific_coupon_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sub_category"
    ADD CONSTRAINT "sub_category_meta_details_key" UNIQUE ("meta_details");



ALTER TABLE ONLY "public"."sub_category"
    ADD CONSTRAINT "sub_category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_applications_categories"
    ADD CONSTRAINT "tax_applications_categories_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."tax_applications_categories"
    ADD CONSTRAINT "tax_applications_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_rates"
    ADD CONSTRAINT "tax_rates_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."tax_rates"
    ADD CONSTRAINT "tax_rates_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tax_rates"
    ADD CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_types"
    ADD CONSTRAINT "tax_types_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."tax_types"
    ADD CONSTRAINT "tax_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tax_types"
    ADD CONSTRAINT "tax_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "user_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."variant_attributes"
    ADD CONSTRAINT "variant_attributes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_collection_products_collection_id" ON "public"."collection_products" USING "btree" ("collection_id");



CREATE INDEX "idx_collection_products_product_id" ON "public"."collection_products" USING "btree" ("product_id");



CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");



CREATE INDEX "idx_customer_emails_condition_id" ON "public"."customer_emails" USING "btree" ("customer_condition_id");



CREATE INDEX "idx_meta_details_url_key" ON "public"."meta_details" USING "btree" ("url_key");



CREATE INDEX "idx_product_subcategory" ON "public"."product" USING "btree" ("sub_category");



CREATE INDEX "idx_variant_product" ON "public"."product_variant" USING "btree" ("product_id");



CREATE OR REPLACE TRIGGER "refresh_admin_users_trigger" AFTER INSERT OR DELETE OR UPDATE OF "role" ON "public"."app_users" FOR EACH STATEMENT EXECUTE FUNCTION "public"."refresh_admin_users"();



CREATE OR REPLACE TRIGGER "update_store_settings_updated_at" BEFORE UPDATE ON "public"."store_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("user_id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_meta_details_fkey" FOREIGN KEY ("meta_details") REFERENCES "public"."meta_details"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."collection_products"
    ADD CONSTRAINT "collection_products_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."collection_products"
    ADD CONSTRAINT "collection_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_meta_details_fkey" FOREIGN KEY ("meta_details") REFERENCES "public"."meta_details"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."customer_conditions"
    ADD CONSTRAINT "customer_conditions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("coupon_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_emails"
    ADD CONSTRAINT "customer_emails_customer_condition_id_fkey" FOREIGN KEY ("customer_condition_id") REFERENCES "public"."customer_conditions"("customer_condition_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "public"."addresses"("id") ON UPDATE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."addresses"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_attributes"
    ADD CONSTRAINT "product_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_attributes"
    ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_meta_details_fkey" FOREIGN KEY ("meta_details") REFERENCES "public"."meta_details"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_sub_category_fkey" FOREIGN KEY ("sub_category") REFERENCES "public"."sub_category"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_variant"
    ADD CONSTRAINT "product_variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specific_coupon_products"
    ADD CONSTRAINT "specific_coupon_products_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("coupon_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specific_coupon_products"
    ADD CONSTRAINT "specific_coupon_products_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sub_category"
    ADD CONSTRAINT "sub_category_meta_details_fkey" FOREIGN KEY ("meta_details") REFERENCES "public"."meta_details"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sub_category"
    ADD CONSTRAINT "sub_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_applications_categories"
    ADD CONSTRAINT "tax_applications_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_applications_categories"
    ADD CONSTRAINT "tax_applications_categories_tax_rate_id_fkey" FOREIGN KEY ("tax_rate_id") REFERENCES "public"."tax_rates"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tax_rates"
    ADD CONSTRAINT "tax_rates_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."tax_types"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "users_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."user_roles"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."variant_attributes"
    ADD CONSTRAINT "variant_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."variant_attributes"
    ADD CONSTRAINT "variant_attributes_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete" ON "public"."collection_products" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete" ON "public"."collections" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete" ON "public"."product_attributes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete" ON "public"."product_variant" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete" ON "public"."variant_attributes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete categories" ON "public"."category" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete meta_details" ON "public"."meta_details" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete product" ON "public"."product" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete product attributes" ON "public"."attributes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can delete sub-categories" ON "public"."sub_category" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert" ON "public"."collection_products" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert" ON "public"."collections" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert" ON "public"."product_attributes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert" ON "public"."product_variant" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert" ON "public"."variant_attributes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert categories" ON "public"."category" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert meta_details" ON "public"."meta_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert product" ON "public"."product" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert product attributes" ON "public"."attributes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can insert sub-categories" ON "public"."sub_category" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update" ON "public"."collection_products" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update" ON "public"."collections" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update" ON "public"."product_attributes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update" ON "public"."variant_attributes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update categories" ON "public"."category" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update meta_details" ON "public"."meta_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update product attribbutes" ON "public"."attributes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update sub-categories" ON "public"."sub_category" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Admins can update the product" ON "public"."product" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."user_id" = "auth"."uid"()) AND ("app_users"."role" = 2)))));



CREATE POLICY "Anyone can update" ON "public"."product_variant" FOR UPDATE USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."addresses" FOR SELECT USING (true);



CREATE POLICY "Everyone can read" ON "public"."collection_products" FOR SELECT USING (true);



CREATE POLICY "Everyone can read" ON "public"."collections" FOR SELECT USING (true);



CREATE POLICY "Public can read categories" ON "public"."category" FOR SELECT USING (true);



CREATE POLICY "Public can read from this" ON "public"."product_attributes" FOR SELECT USING (true);



CREATE POLICY "Public can read from this" ON "public"."product_variant" FOR SELECT USING (true);



CREATE POLICY "Public can read from this" ON "public"."variant_attributes" FOR SELECT USING (true);



CREATE POLICY "Public can read meta_details" ON "public"."meta_details" FOR SELECT USING (true);



CREATE POLICY "Public can read product attributes" ON "public"."attributes" FOR SELECT USING (true);



CREATE POLICY "Public can read sub-categories" ON "public"."sub_category" FOR SELECT USING (true);



CREATE POLICY "Public can read the product rows" ON "public"."product" FOR SELECT USING (true);



CREATE POLICY "admin_manage_roles" ON "public"."user_roles" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "admin_users"."user_id"
   FROM "public"."admin_users"))) WITH CHECK (("auth"."uid"() IN ( SELECT "admin_users"."user_id"
   FROM "public"."admin_users")));



ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attributes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meta_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_attributes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variant" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_app_users" ON "public"."app_users" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "admin_users"."user_id"
   FROM "public"."admin_users"))));



CREATE POLICY "read_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."sub_category" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variant_attributes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































































































































GRANT ALL ON FUNCTION "public"."check_buy_x_get_y_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_buy_x_get_y_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_buy_x_get_y_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_collection"("p_name" "text", "p_description" "text", "p_image_url" "text", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_sort_order" integer, "p_status" boolean, "p_product_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_collection"("p_name" "text", "p_description" "text", "p_image_url" "text", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_sort_order" integer, "p_status" boolean, "p_product_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_collection"("p_name" "text", "p_description" "text", "p_image_url" "text", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_sort_order" integer, "p_status" boolean, "p_product_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_category"("p_category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_category"("p_category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_category"("p_category_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_sub_category"("p_sub_category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_sub_category"("p_sub_category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_sub_category"("p_sub_category_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_high_level_collections"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_high_level_collections"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_high_level_collections"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_attribute_types"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_attribute_types"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_attribute_types"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_full_details"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_full_details"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_full_details"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_admin_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_admin_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_admin_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_collection"("p_collection_id" "uuid", "p_name" "text", "p_description" "text", "p_image_url" "text", "p_sort_order" integer, "p_status" boolean, "p_meta_details_id" "uuid", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_added_product_ids" "uuid"[], "p_removed_product_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_collection"("p_collection_id" "uuid", "p_name" "text", "p_description" "text", "p_image_url" "text", "p_sort_order" integer, "p_status" boolean, "p_meta_details_id" "uuid", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_added_product_ids" "uuid"[], "p_removed_product_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_collection"("p_collection_id" "uuid", "p_name" "text", "p_description" "text", "p_image_url" "text", "p_sort_order" integer, "p_status" boolean, "p_meta_details_id" "uuid", "p_url_key" "text", "p_meta_title" "text", "p_meta_description" "text", "p_meta_keywords" "text", "p_added_product_ids" "uuid"[], "p_removed_product_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";





















GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."app_users" TO "anon";
GRANT ALL ON TABLE "public"."app_users" TO "authenticated";
GRANT ALL ON TABLE "public"."app_users" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."attributes" TO "anon";
GRANT ALL ON TABLE "public"."attributes" TO "authenticated";
GRANT ALL ON TABLE "public"."attributes" TO "service_role";



GRANT ALL ON TABLE "public"."category" TO "anon";
GRANT ALL ON TABLE "public"."category" TO "authenticated";
GRANT ALL ON TABLE "public"."category" TO "service_role";



GRANT ALL ON TABLE "public"."collection_products" TO "anon";
GRANT ALL ON TABLE "public"."collection_products" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."collections_sort_order_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."collections_sort_order_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."collections_sort_order_seq" TO "service_role";



GRANT ALL ON TABLE "public"."collections" TO "anon";
GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."coupons_coupon_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."coupons_coupon_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."coupons_coupon_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."customer_conditions" TO "anon";
GRANT ALL ON TABLE "public"."customer_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."customer_conditions_customer_condition_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."customer_conditions_customer_condition_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."customer_conditions_customer_condition_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."customer_emails" TO "anon";
GRANT ALL ON TABLE "public"."customer_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_emails" TO "service_role";



GRANT ALL ON SEQUENCE "public"."customer_emails_email_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."customer_emails_email_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."customer_emails_email_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."hero_sections" TO "anon";
GRANT ALL ON TABLE "public"."hero_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."hero_sections" TO "service_role";



GRANT ALL ON SEQUENCE "public"."hero_sections_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."hero_sections_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."hero_sections_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."meta_details" TO "anon";
GRANT ALL ON TABLE "public"."meta_details" TO "authenticated";
GRANT ALL ON TABLE "public"."meta_details" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."product" TO "anon";
GRANT ALL ON TABLE "public"."product" TO "authenticated";
GRANT ALL ON TABLE "public"."product" TO "service_role";



GRANT ALL ON TABLE "public"."product_attributes" TO "anon";
GRANT ALL ON TABLE "public"."product_attributes" TO "authenticated";
GRANT ALL ON TABLE "public"."product_attributes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_attributes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_attributes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_attributes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_variant" TO "anon";
GRANT ALL ON TABLE "public"."product_variant" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variant" TO "service_role";



GRANT ALL ON TABLE "public"."specific_coupon_products" TO "anon";
GRANT ALL ON TABLE "public"."specific_coupon_products" TO "authenticated";
GRANT ALL ON TABLE "public"."specific_coupon_products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."specific_coupon_products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."specific_coupon_products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."specific_coupon_products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."store_settings" TO "anon";
GRANT ALL ON TABLE "public"."store_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."store_settings" TO "service_role";



GRANT ALL ON TABLE "public"."sub_category" TO "anon";
GRANT ALL ON TABLE "public"."sub_category" TO "authenticated";
GRANT ALL ON TABLE "public"."sub_category" TO "service_role";



GRANT ALL ON TABLE "public"."tax_applications_categories" TO "anon";
GRANT ALL ON TABLE "public"."tax_applications_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_applications_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tax_applications_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tax_applications_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tax_applications_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tax_rates" TO "anon";
GRANT ALL ON TABLE "public"."tax_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_rates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tax_rates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tax_rates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tax_rates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tax_types" TO "anon";
GRANT ALL ON TABLE "public"."tax_types" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tax_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tax_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tax_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."variant_attributes" TO "anon";
GRANT ALL ON TABLE "public"."variant_attributes" TO "authenticated";
GRANT ALL ON TABLE "public"."variant_attributes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























