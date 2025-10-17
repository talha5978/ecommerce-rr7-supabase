import { defaults, type FilterOp, REQUIRED_VARIANT_ATTRIBS } from "@ecom/shared/constants/constants";
import { Service } from "./service";
import { defaultOp, ProductVariantsFilters } from "@ecom/shared/schemas/product-variants-filter.schema";
import type {
	GetAllProductVariants,
	ProductVariantUpdationPayload,
	SingleProductVariantResponse,
	VariantConstraintsData,
	VariantsForCouponsResp,
} from "@ecom/shared/types/product-variants";
import { applyFilterOps } from "@ecom/shared/utils/applyFilterOps";
import { ApiError } from "@ecom/shared/utils/ApiError";
import {
	DuplicateVariantActionData,
	ProductVariantActionData,
	ProductVariantUpdateActionData,
} from "@ecom/shared/schemas/product-variants.schema";
import { MediaService } from "./media.service";
import { bolleanToStringConverter, stringToBooleanConverter } from "@ecom/shared/lib/utils";
import { VariantsAttributesService } from "./variant-attributes.service";
import { VariantAttributeInput } from "@ecom/shared/types/variant-attributes";
import { ProductsService } from "./products.service";
import { ProductAttributeRow } from "@ecom/shared/types/attributes";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { UseMiddleware } from "@ecom/shared//decorators/useMiddleware";
import { requireAllPermissions } from "@ecom/shared//middlewares/permissions.middleware";
import { Permission } from "@ecom/shared//permissions/permissions.enum";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<ProductVariantsService>(verifyUser))
export class ProductVariantsService extends Service {
	/** Fetch products variants for a product */
	async getProductVariants(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE,
		productId: string,
		filters: ProductVariantsFilters = {},
	): Promise<GetAllProductVariants> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.PRODUCT_VARIANT_TABLE)
				.select("*", { count: "exact" })
				.eq("product_id", productId)
				.order(filters.sortBy || defaults.defaultProductVaraintsSortByFilter, {
					ascending: filters.sortType === "asc",
				});

			// DRY numeric ops
			const numericFields: Array<[keyof ProductVariantsFilters, keyof ProductVariantsFilters]> = [
				["original_price", "original_price_op"],
				["sale_price", "sale_price_op"],
				["reorder_level", "reorder_level_op"],
			];

			for (const [colKey, opKey] of numericFields) {
				const columnName = colKey as string;
				const op = ((filters as ProductVariantsFilters)[opKey] as FilterOp) || defaultOp;
				const value = (filters as ProductVariantsFilters)[colKey] as number | undefined;
				query = applyFilterOps(query, columnName, op, value);
			}

			if (filters.stock && filters.stock.length > 0) {
				if (filters.stock[0] !== 0) {
					query = query.gte("stock", filters.stock[0]);
				}
				if (filters.stock[1] !== defaults.MAX_STOCK_FILTER_DEFAULT_VAL) {
					query = query.lte("stock", filters.stock[1]);
				}
			}

			if (filters.status != undefined) {
				query = query.eq("status", filters.status);
			}

			if (filters.createdAt) {
				query = query
					.gte("createdAt", filters.createdAt.from.toISOString())
					.lte("createdAt", filters.createdAt.to.toISOString());
			}

			if (q.length > 0) {
				query = query.ilike("name", `%${q}%`);
			}

			query = query.range(from, to);

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

	/** Fetch all product variant units for all units page! (Not based on a single product) */
	async getAllProductUnits(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE,
	): Promise<GetAllProductVariants> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.PRODUCT_VARIANT_TABLE)
				.select("*", { count: "exact" })
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

	async delProductVariantForRollback(varaintId: string) {
		return await this.supabase.from(this.PRODUCT_VARIANT_TABLE).delete().eq("id", varaintId);
	}

	/** Create Product Variant Row */
	@UseMiddleware(requireAllPermissions([Permission.CREATE_PRODUCT_VARIANTS]))
	async createProductVaraint(productId: string, input: ProductVariantActionData): Promise<void> {
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
			weight,
		} = input;

		if (attributes.length !== REQUIRED_VARIANT_ATTRIBS.length) {
			throw new ApiError("Failed to create product variant", 500, []);
		}

		const mediaSvc = await this.createSubService(MediaService);

		let images_arr: string[] = [];

		const imageUploadPromises = images.map(async (image) => {
			if (image.size > 0) {
				const { data } = await mediaSvc.uploadImage(image);
				// console.log(data);

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
			// console.log("No images in array");
			throw new ApiError("Failed to upload image", 500, []);
		}

		function delImages() {
			images_arr.map(async (img) => {
				await mediaSvc.deleteImage(img);
			});

			return;
		}

		const { error: variantError, data } = await this.supabase
			.from(this.PRODUCT_VARIANT_TABLE)
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
				weight: weight == "" ? null : Number(weight),
			})
			.select("id")
			.single();

		if (variantError) {
			delImages();
			throw new ApiError(`Failed to create product variant: ${variantError.message}`, 500, [
				variantError.details,
			]);
		}

		const variantAttributesSvc = await this.createSubService(VariantsAttributesService);

		const finalAttributes = attributes.map((attribute_id) => {
			return {
				attribute_id: attribute_id,
				variant_id: data.id,
			};
		});

		const { error: prodVarAttributeError } =
			await variantAttributesSvc.createBulkVariantAttributes(finalAttributes);

		if (prodVarAttributeError) {
			await this.delProductVariantForRollback(data.id);
			delImages();
			throw new ApiError(`Failed to create product variant: ${prodVarAttributeError.message}`, 500, [
				prodVarAttributeError.details,
			]);
		}
	}

	/** Duplicate a product Variant Row */
	@UseMiddleware(requireAllPermissions([Permission.CREATE_PRODUCT_VARIANTS]))
	async createProductVaraintDuplicate(input: DuplicateVariantActionData): Promise<void> {
		const {
			images,
			original_price,
			reorder_level,
			sale_price,
			sku,
			stock,
			weight,
			product_id,
			id: current_variant_id,
		} = input;

		if (images.length == 0) {
			// console.log("No images found");
			throw new ApiError("Failed to upload image", 500, []);
		}

		const variantAttributesSvc = await this.createSubService(VariantsAttributesService);
		let attributes: VariantAttributeInput[] = [];

		const { data: fetchedAttributes, error: attributesError } =
			await variantAttributesSvc.getVariantAttributes(current_variant_id as string);

		if (!fetchedAttributes && attributesError) {
			throw new ApiError(`Failed to get product variant attributes: ${attributesError.message}`, 500, [
				attributesError.details,
			]);
		}
		// console.log(fetchedAttributes);

		if (fetchedAttributes == null && attributesError) {
			throw new ApiError(`Failed to get product variant attributes: ${attributesError.message}`, 500, [
				attributesError.details,
			]);
		}
		const { error: variantError, data } = await this.supabase
			.from(this.PRODUCT_VARIANT_TABLE)
			.insert({
				product_id,
				images: images as string[],
				// always set is_default to false
				is_default: false,
				original_price,
				sale_price,
				reorder_level,
				sku: `${sku} (Copied)`,
				// status set to false by default so that does not reflect in store front !!imediately
				status: false,
				stock,
				weight: weight == 0 ? null : weight,
			})
			.select("id")
			.single();

		if (variantError && !data) {
			throw new ApiError(`Failed to duplicate product variant: ${variantError.message}`, 500, [
				variantError.details,
			]);
		}

		attributes =
			fetchedAttributes?.map((row) => {
				return {
					attribute_id: row.attribute_id,
					variant_id: data?.id as string,
				};
			}) || [];
		// console.log(data.id, attributes);

		const { error: prodVarAttributeError } =
			await variantAttributesSvc.createBulkVariantAttributes(attributes);

		if (prodVarAttributeError) {
			await this.delProductVariantForRollback(data.id);
			throw new ApiError(`Failed to duplicate product variant: ${prodVarAttributeError.message}`, 500, [
				prodVarAttributeError.details,
			]);
		}
	}

	/** Get constraints like if we already have a variant which is set to default for variant creation page and updation page */
	@UseMiddleware(
		requireAllPermissions([Permission.CREATE_PRODUCT_VARIANTS, Permission.UPDATE_PRODUCT_VARIANTS]),
	)
	async getConstaintsForVariantMutations(product_id: string): Promise<VariantConstraintsData> {
		try {
			const { data, error: defaultFetchError } = await this.supabase
				.from(this.PRODUCT_VARIANT_TABLE)
				.select(`id`)
				.eq("product_id", product_id)
				.eq("is_default", true)
				.single();

			let error: null | ApiError = null;

			if (defaultFetchError || data == null) {
				error = new ApiError(defaultFetchError.message, 500, [defaultFetchError.details]);
			}

			const productSvc = await this.createSubService(ProductsService);
			const { productName, error: productNameError } = await productSvc.getProductName(product_id);

			if (productNameError || productName == null) {
				error = new ApiError(productNameError.message, 500, [productNameError.details]);
			}

			return {
				is_default_variant_exists: data == null ? false : true || false,
				default_variant_id: data == null ? null : data.id,
				productName: productName == null ? null : productName,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					is_default_variant_exists: false,
					default_variant_id: null,
					productName: null,
					error: err,
				};
			}
			return {
				is_default_variant_exists: false,
				default_variant_id: null,
				productName: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Get a product variant (for update) */
	@UseMiddleware(requireAllPermissions([Permission.UPDATE_PRODUCT_VARIANTS]))
	async getVariantData(variant_id: string): Promise<SingleProductVariantResponse> {
		try {
			const { data, error: dbError } = await this.supabase
				.from(this.PRODUCT_VARIANT_TABLE)
				.select(
					`
					*, ${this.VARIANT_ATTRIBUTES_TABLE}(${this.ATTRIBUTES_TABLE}(*))
				`,
				)
				.eq("id", variant_id)
				.single();

			let error: null | ApiError = null;
			if (dbError || data == null) {
				error = new ApiError(dbError.message, 500, [dbError.details]);
			}

			let extracted_attributes: ProductAttributeRow[] = [];
			const attributes = data?.[this.VARIANT_ATTRIBUTES_TABLE] || [];

			attributes.map((variant_attrib_row) => {
				let i = variant_attrib_row.attributes;

				return extracted_attributes.push({
					attribute_type: i.attribute_type,
					value: i.value,
					id: i.id,
					name: i.name,
				});
			});
			// console.log(extracted_attributes);

			return {
				variant: {
					id: data?.id as string,
					product_id: data?.product_id as string,
					images: data?.images as string[],
					is_default: bolleanToStringConverter(data!.is_default || false) as string,
					original_price: data?.original_price.toString() as string,
					sale_price: data?.sale_price.toString() as string,
					reorder_level: data?.reorder_level.toString() as string,
					sku: data?.sku as string,
					status: bolleanToStringConverter(data!.status) as string,
					stock: data?.stock.toString() as string,
					weight: data?.weight == null ? "" : (data?.weight.toString() as string),
					attributes: extracted_attributes,
					createdAt: data?.createdAt ?? (null as string | null),
				},
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { variant: null, error: err };
			}
			return {
				variant: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Update a product variant */
	@UseMiddleware(requireAllPermissions([Permission.UPDATE_PRODUCT_VARIANTS]))
	async updateProductVaraint(variant_id: string, input: ProductVariantUpdateActionData): Promise<void> {
		const {
			images,
			removed_images,
			added_attributes,
			removed_attributes,
			is_default,
			original_price,
			reorder_level,
			sale_price,
			sku,
			status,
			stock,
			weight,
		} = input;
		// console.log("Added attributes", added_attributes);

		const variantAttributesSvc = await this.createSubService(VariantsAttributesService);

		// Delete removed attributes
		if (Array.isArray(removed_attributes) && removed_attributes.length > 0) {
			await variantAttributesSvc.deleteBulkVariantAttributes({
				variant_id,
				attributes_ids: removed_attributes,
			});
		}

		// Insert added attributes
		if (Array.isArray(added_attributes) && added_attributes.length > 0) {
			const finalAttributes_toAdd = added_attributes.map((attribute_id) => {
				return {
					variant_id,
					attribute_id: attribute_id,
				};
			});
			const { error: prodVarAttributeError } =
				await variantAttributesSvc.createBulkVariantAttributes(finalAttributes_toAdd);

			if (prodVarAttributeError) {
				throw new ApiError(
					`Failed to update product variant: ${prodVarAttributeError.message}`,
					500,
					[prodVarAttributeError.details],
				);
			}
		}

		let images_arr: string[] = [];
		const mediaSvc = await this.createSubService(MediaService);

		function delUploadedImages() {
			images_arr.map(async (img) => {
				await mediaSvc.deleteImage(img);
			});
		}
		// console.log("Input in the service func. ::: \n");
		// console.log(input);

		// return;
		// handle new images
		const hasImages = images && Array.isArray(images) && images.length > 0;
		let existingImages: string[] = [];

		// Conditionaly fetch the images first to update the image array
		const { data, error: imageFetchError } = await this.supabase
			.from(this.PRODUCT_VARIANT_TABLE)
			.select("images")
			.eq("id", variant_id)
			.single();

		if (imageFetchError) {
			throw new ApiError(`Failed to update product variant: ${imageFetchError.message}`, 500, [
				imageFetchError.details,
			]);
		}

		existingImages.push(...(data?.images as string[]));

		if (hasImages) {
			const imageUploadPromises = images.map(async (image) => {
				if (image.size > 0) {
					const { data } = await mediaSvc.uploadImage(image);
					// console.log(data);

					const path = data?.path ?? "";
					if (!path || path == "") {
						if (images_arr.length > 0) {
							delUploadedImages();
						}
						throw new ApiError("Failed to upload image", 500, []);
					}
					images_arr.push(path);
				}
			});

			await Promise.all(imageUploadPromises);
		}

		if (hasImages && images_arr.length == 0) {
			// console.log("No images in array");
			throw new ApiError("Failed to upload image", 500, []);
		}

		// delete removed images
		if (removed_images && Array.isArray(removed_images) && removed_images.length > 0) {
			removed_images.map(async (img) => {
				await mediaSvc.deleteImage(img);
			});

			existingImages = existingImages.filter((img) => !removed_images.includes(img));
		}

		const prodUpdate: Partial<ProductVariantUpdationPayload> = {};
		if (sku) prodUpdate.sku = sku;
		if (is_default) prodUpdate.is_default = stringToBooleanConverter(is_default);
		if (original_price) prodUpdate.original_price = Number(original_price);
		if (reorder_level) prodUpdate.reorder_level = Number(reorder_level);
		if (sale_price) prodUpdate.sale_price = Number(sale_price);
		if (status) prodUpdate.status = stringToBooleanConverter(status);
		if (stock) prodUpdate.stock = Number(stock);
		if (weight || weight == "") {
			prodUpdate.weight = weight == "" ? null : Number(weight);
		}

		if (images_arr.length > 0) {
			prodUpdate.images = [...existingImages, ...images_arr];
		} else if (removed_images && Array.isArray(removed_images) && removed_images.length > 0) {
			prodUpdate.images = existingImages;
		}

		const { error } = await this.supabase
			.from(this.PRODUCT_VARIANT_TABLE)
			.update(prodUpdate)
			.eq("id", variant_id);

		if (error) {
			throw new ApiError(`Failed to update product variant: ${error.message}`, 500, [error.details]);
		}
	}

	/** Get id, value and image of the skus for coupons discount type section */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_COUPONS]))
	async getSkusForCouponDiscountType(): Promise<VariantsForCouponsResp> {
		const { data, error: dbError } = await this.supabase
			.from(this.PRODUCT_VARIANT_TABLE)
			.select(
				`
					id, sku, ${this.PRODUCTS_TABLE}(cover_image)
				`,
			)
			.eq("status", true)
			.order("createdAt", { ascending: false });

		let error: ApiError | null = null;

		if (dbError) {
			error = new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		return {
			skus:
				data?.map((item) => {
					return {
						id: item.id,
						value: item.sku,
						cover_image: item[this.PRODUCTS_TABLE]?.cover_image,
					};
				}) ?? [],
			error: error ?? null,
		};
	}
}
