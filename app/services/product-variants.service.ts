import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { GetAllProductVariants } from "~/types/products";
import { defaults } from "~/constants";
import { ProductActionData } from "~/schemas/product.schema";
import { MetaDetailsService } from "~/services/meta-details.service";
import { MediaService } from "~/services/media.service";

export class ProductVariantsService {
	private supabase: SupabaseClient<Database>;
	private readonly request: Request;
	private readonly TABLE = "product_variant";

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.request = request;
	}

	/** Fetch products variants for a product */
	async getAllProductVariants(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE,
		productId: string
	): Promise<GetAllProductVariants> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.TABLE)
				.select("*", { count: "exact" })
				.order("createdAt", { ascending: false })
				.range(from, to)
				.eq("product_id", productId);

			if (q.length > 0) {
				query = query.ilike("name", `%${q}%`);
			}

			const { data, error: queryError, count } = await query;

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				product_variants: data ?? [],
				total: count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { product_variants: [], total: 0, error: err };
			}
			return {
				product_variants: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Create Product Variant Row */
	// async createProductVaraint(productId:string, input: ProductActionData): Promise<void> {
	// 	const {
	// 		cover_image,
	// 		description,
	// 		name,
	// 		meta_details,
	// 		free_shipping,
	// 		is_featured,
	// 		status,
	// 		sub_category,
	// 	} = input;

	// 	const metaDetailsService = new MetaDetailsService(this.request);
	// 	const metaDetailsId = await metaDetailsService.createMetaDetails(meta_details);

	// 	const mediaSvc = new MediaService(this.request);

	// 	let cover_public_url = "";

	// 	if (cover_image && cover_image.size > 0) {
	// 		const { data } = await mediaSvc.uploadImage(cover_image);
	// 		cover_public_url = data?.path ?? "";
	// 		if (!cover_public_url || cover_public_url == "") {
	// 			throw new ApiError("Failed to upload image", 500, []);
	// 		}
	// 	}

	// 	const { error: prodError } = await this.supabase
	// 		.from(this.TABLE)
	// 		.insert({
	// 			cover_image: cover_public_url,
	// 			description,
	// 			name,
	// 			meta_details: metaDetailsId,
	// 			free_shipping: Boolean(free_shipping),
	// 			is_featured: Boolean(is_featured),
	// 			status: Boolean(status),
	// 			sub_category: sub_category
	// 		});

	// 	if (prodError) {
	// 		await metaDetailsService.deleteMetaDetails(metaDetailsId);
	// 		await mediaSvc.deleteImage(cover_public_url);
	// 		throw new ApiError(`Failed to create category: ${prodError.message}`, 500, [
	// 			prodError.details,
	// 		]);
	// 	}
	// }
}

