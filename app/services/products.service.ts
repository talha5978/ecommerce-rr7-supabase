import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { FullProduct, GetAllProductsResponse, GetSingleProductResponse, ProductUpdationPayload } from "~/types/products";
import { defaults } from "~/constants";
import { ProductActionData, ProductUpdateActionData } from "~/schemas/product.schema";
import { MetaDetailsService } from "~/services/meta-details.service";
import { MediaService } from "~/services/media.service";
import { stringToBooleanConverter } from "~/lib/utils";

export class ProductsService {
	private supabase: SupabaseClient<Database>;
	private readonly request: Request;
	private readonly PRODUCT_TABLE = "product";
	private readonly VARIANT_TABLE = "product_variant";
	private readonly CATEGORIES_TABLE = "category";

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.request = request;
	}

	/** Returns true only if input is "true" otherwise false */
	stringToBooleanConverter(s: string) : boolean {
		if (s !== "true" && s !== "false") {
			throw new ApiError(`Invalid boolean value: ${s}`, 400, []);
		}

		return s === "true";
	}

	/** Fetch products types for index page */
	async getAllProducts(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_PRODUCTS_PAGE_SIZE
	): Promise<GetAllProductsResponse> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.PRODUCT_TABLE)
				.select(`
					name, id, cover_image, is_featured, status, createdAt,
					sub_category(
						sub_category_name, ${this.CATEGORIES_TABLE}(category_name)
					),
					${this.VARIANT_TABLE}(id)
				`, { count: "exact" })
				.order("createdAt", { ascending: false })
				.range(from, to);

			if (q.length > 0) {
				query = query.ilike("name", `%${q}%`);
			}

			const { data, error: queryError, count } = await query;

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				products: data?.map((product) => {
					return {
						...product,
						variants_count: product[this.VARIANT_TABLE].length ?? 0,
						categoryName: product.sub_category?.category?.category_name || "",
						subCategoryName: product.sub_category?.sub_category_name || "",
					}
				}) ?? [],
				total: count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { products: [], total: 0, error: err };
			}
			return {
				products: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Create Product Row and its meta details */
	async createProductWithMeta(input: ProductActionData): Promise<void> {
		const {
			cover_image,
			description,
			name,
			meta_details,
			free_shipping,
			is_featured,
			status,
			sub_category,
		} = input;

		const metaDetailsService = new MetaDetailsService(this.request);
		const metaDetailsId = await metaDetailsService.createMetaDetails(meta_details);

		const mediaSvc = new MediaService(this.request);

		let cover_public_url = "";

		if (cover_image && cover_image.size > 0) {
			const { data } = await mediaSvc.uploadImage(cover_image);
			cover_public_url = data?.path ?? "";
			if (!cover_public_url || cover_public_url == "") {
				await metaDetailsService.deleteMetaDetails(metaDetailsId);
				throw new ApiError("Failed to upload image", 500, []);
			}
		}

		const { error: prodError } = await this.supabase.from(this.PRODUCT_TABLE).insert({
			cover_image: cover_public_url,
			description,
			name,
			meta_details: metaDetailsId,
			free_shipping: stringToBooleanConverter(free_shipping),
			is_featured: stringToBooleanConverter(is_featured),
			status: stringToBooleanConverter(status),
			sub_category: sub_category,
		});

		if (prodError) {
			await metaDetailsService.deleteMetaDetails(metaDetailsId);
			await mediaSvc.deleteImage(cover_public_url);
			throw new ApiError(`Failed to create category: ${prodError.message}`, 500, [prodError.details]);
		}
	}

	/** Get full single product details including its meta details and variants */
	async getFullSingleProduct(productId: string): Promise<GetSingleProductResponse> {
		try {
			const { data, error: queryError } = await this.supabase
				.from(this.PRODUCT_TABLE)
				.select(`*, meta_details(*), ${this.VARIANT_TABLE}(*)`)
				.eq("id", productId)
				.single();

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				product: (data as FullProduct | null) ?? null,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { product: null, error: err };
			}
			return {
				product: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Update Product Row */
	async updateProduct(input: ProductUpdateActionData, productId: string): Promise<void> {
		const {
			cover_image,
			description,
			name,
			meta_details,
			free_shipping,
			is_featured,
			status,
			sub_category,
		} = input;

		const { data: prodData, error: fetchError } = await this.supabase
			.from(this.PRODUCT_TABLE)
			.select("meta_details, cover_image")
			.eq("id", productId)
			.single();

		const metaDetailsId = prodData?.meta_details;
		if (fetchError || !prodData || !metaDetailsId) {
			throw new ApiError(`Product not found`, 404, []);
		}

		const currentStoredImg = prodData.cover_image;
		let newImagePath: string | null = null;

		if (!currentStoredImg) {
			throw new ApiError(`Product image not found`, 404, []);
		}

		const mediaSvc = new MediaService(this.request);
		if (typeof cover_image === "string") {
			throw new ApiError("Please upload new image instead of image url", 400, []);
		}

		if (cover_image && cover_image.size > 0) {
			const { data } = await mediaSvc.uploadImage(cover_image);

			if (!data?.path || data?.path == "") {
				throw new ApiError("Failed to upload image", 500, []);
			}

			newImagePath = data.path;
		}

		const prodUpdate: Partial<ProductUpdationPayload> = {};
		if (name) prodUpdate.name = name;
		if (description !== undefined) prodUpdate.description = description;
		if (free_shipping !== undefined) prodUpdate.free_shipping = stringToBooleanConverter(free_shipping);
		if (status !== undefined) prodUpdate.status = stringToBooleanConverter(status);
		if (is_featured !== undefined) prodUpdate.is_featured = stringToBooleanConverter(is_featured);
		if (sub_category !== undefined) prodUpdate.sub_category = sub_category;
		if (newImagePath != null) prodUpdate.cover_image = newImagePath;

		if (Object.keys(prodUpdate).length > 0) {
			const { error: prodUpdateError } = await this.supabase
				.from(this.PRODUCT_TABLE)
				.update(prodUpdate)
				.eq("id", productId);

			if (prodUpdateError) {
				throw new ApiError(`Failed to update product details: ${prodUpdateError.message}`, 500, []);
			}
		}

		if (newImagePath != null) {
			await mediaSvc.deleteImage(currentStoredImg);
		}

		if (meta_details) {
			const metaDetailsService = new MetaDetailsService(this.request);
			await metaDetailsService.updateMetaDetails({ meta_details, metaDetailsId });
		}
	}
}

