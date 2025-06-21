import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { GetAllProductVariants } from "~/types/product-variants";
import { defaults } from "~/constants";
import { MediaService } from "~/services/media.service";
import { DuplicateVariantActionData, ProductVariantActionData } from "~/schemas/product-variants.schema";
import { stringToBooleanConverter } from "~/lib/utils";
import { VariantsAttributesService } from "./variant-attributes.service";
import { VariantAttributesRow } from "~/types/variant-attributes";

export class ProductVariantsService {
	private supabase: SupabaseClient<Database>;
	private readonly TABLE = "product_variant";
	private readonly request: Request;

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
	async createProductVaraint(productId:string, input: ProductVariantActionData): Promise<void> {
		const {
			images,
			attributes,
			is_default,
			original_price,
			reorder_level,
			sale_price,
			sku,
			status,
			stock,
			weight
		} = input;

		const mediaSvc = new MediaService(this.request);

		let images_arr: string[] = [];

		const imageUploadPromises = images.map(async (image) => {
			if (image.size > 0) {
				const { data } = await mediaSvc.uploadImage(image);
				console.log(data);

				const path = data?.path ?? "";
				if (!path || path == "") {
					if (images_arr.length > 0) {
						images_arr.map(async (img) => {
							await mediaSvc.deleteImage(img);
						});
					}
					throw new ApiError("Failed to upload image", 500, []);
				}
				images_arr.push(path);
			}
		});

		await Promise.all(imageUploadPromises);

		if (images_arr.length == 0) {
			console.log("No images in array");
			throw new ApiError("Failed to upload image", 500, []);
		}
		
		function delImages() {
			images_arr.map(async (img) => {
				await mediaSvc.deleteImage(img);
			});

			return;
		}

		const { error: variantError, data } = await this.supabase
			.from(this.TABLE)
			.insert({
				product_id: productId as string,
				images: images_arr as string[],
				is_default: stringToBooleanConverter(is_default),
				original_price: Number(original_price),
				sale_price: Number(sale_price),
				reorder_level: Number(reorder_level),
				sku: sku,
				status: stringToBooleanConverter(status),
				stock: Number(stock),
				weight: Number(weight)
			})
			.select("id")
			.single();

		if (variantError) {
			delImages();
			throw new ApiError(`Failed to create product variant: ${variantError.message}`, 500, [
				variantError.details,
			]);
		}

		const variantAttributesSvc = new VariantsAttributesService(this.request);

		attributes.map(async (attribute_id) => {
			const { error: prodVarAttributeError } = await variantAttributesSvc.createVariantAttributes({
				variant_id: data?.id as string,
				attribute_id
			});

			if (prodVarAttributeError) {
				delImages();
				throw new ApiError(`Failed to create product variant: ${prodVarAttributeError.message}`, 500, [
					prodVarAttributeError.details,
				]);
			}
		});
	}

	/** Duplicate a product Variant Row */
	async createProductVaraintDuplicate(input: DuplicateVariantActionData): Promise<void> {
		const {
			images,
			is_default,
			original_price,
			reorder_level,
			sale_price,
			sku,
			stock,
			weight,
			product_id
		} = input;

		if (images.length == 0) {
			console.log("No images found");
			throw new ApiError("Failed to upload image", 500, []);
		}

		const variantAttributesSvc = new VariantsAttributesService(this.request);
		let attributes: VariantAttributesRow[] = [];

		const { data: fetchedAttributes, error: attributesError } = await variantAttributesSvc.getVariantAttributes(
			product_id as string
		);

		if (fetchedAttributes == null && attributesError) {
			throw new ApiError(`Failed to get product variant attributes: ${attributesError.message}`, 500, [
				attributesError.details,
			])
		}

		attributes = fetchedAttributes || [];

		const { error: variantError, data } = await this.supabase
			.from(this.TABLE)
			.insert({
				product_id,
				images: images as string[],
				is_default: stringToBooleanConverter(is_default),
				original_price,
				sale_price,
				reorder_level,
				sku: `${sku} (Copied)`,
				// status set to false by default so that does not reflect in store front !!imediately
				status: false,
				stock,
				weight
			})
			.select("id")
			.single();

		if (variantError) {
			throw new ApiError(`Failed to create product variant: ${variantError.message}`, 500, [
				variantError.details,
			]);
		}

		for(const row of attributes) {
			const { error: prodVarAttributeError } = await variantAttributesSvc
				.createVariantAttributes({
					variant_id: data?.id || row.variant_id as string,
					attribute_id: row.attribute_id
				});

			if (prodVarAttributeError) {
				throw new ApiError(
					`Failed to create product variant: ${prodVarAttributeError.message}`,
					500,
					[prodVarAttributeError.details]
				);
			}
		};
	}
}

