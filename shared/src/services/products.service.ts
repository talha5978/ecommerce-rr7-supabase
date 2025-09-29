import type {
	FP_Featured_Product,
	FP_Featured_Products_Response,
	FullProduct,
	GetAllProductsResponse,
	GetSingleProductResponse,
	ProductNameResponse,
	ProductNamesListResponse,
	ProductUpdationPayload,
	SKUsNamesListResponse,
} from "@ecom/shared/types/products";
import { Service } from "@ecom/shared/services/service";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { COUPONS_SKUS_PAGE_SIZE, defaults } from "@ecom/shared/constants/constants";
import type { ProductFilters } from "@ecom/shared/schemas/products-filter.schema";
import type { ProductActionData, ProductUpdateActionData } from "@ecom/shared/schemas/product.schema";
import { MetaDetailsService } from "@ecom/shared/services/meta-details.service";
import { MediaService } from "@ecom/shared/services/media.service";
import { stringToBooleanConverter } from "@ecom/shared/lib/utils";
import { ProductRAttributesService } from "@ecom/shared/services/product-r-attributes.service";
import type { ProductAttributeRow } from "@ecom/shared/types/attributes";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { UseMiddleware } from "@ecom/shared//decorators/useMiddleware";
import { requireAllPermissions } from "@ecom/shared//middlewares/permissions.middleware";
import { Permission } from "@ecom/shared//permissions/permissions.enum";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<ProductsService>(verifyUser))
export class ProductsService extends Service {
	/** Fetch product name to show on varaint creation and updation page as a disabled field! */
	async getProductName(product_id: string): Promise<ProductNameResponse> {
		const { data: fetchedProduct, error: productError } = await this.supabase
			.from(this.PRODUCTS_TABLE)
			.select(`name`)
			.eq("id", product_id)
			.single();

		return {
			productName: fetchedProduct?.name ?? null,
			error: productError ?? null,
		};
	}

	/** Fetch product names list to show in the dialoge on all product units page */
	async getProductNamesList(): Promise<ProductNamesListResponse> {
		try {
			const maxProductsAssumed = 100;

			const {
				data,
				error: fetchError,
				count: ProductCount,
			} = await this.supabase
				.from(this.PRODUCTS_TABLE)
				.select("id, name", { count: "exact" })
				.limit(maxProductsAssumed);

			let error: null | ApiError = null;

			if (fetchError || data == null) {
				error = new ApiError(fetchError.message, 500, [fetchError.details]);
			}

			return {
				products: data ?? null,
				total: ProductCount ?? 0,
				error: error ?? null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					products: null,
					total: 0,
					error: err,
				};
			}
			return {
				products: null,
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Fetch all skus names list (abi to bs coupons k leye use ho rha hai bad ka pta ni) */
	async getSKUsNamesList(pageIndex: number = 0, searchQuery?: string): Promise<SKUsNamesListResponse> {
		try {
			let query = this.supabase.from(this.PRODUCT_VARIANT_TABLE).select("id, sku", { count: "exact" });

			if (searchQuery) {
				query = query.ilike("sku", `%${searchQuery}%`);
			}

			query = query.order("createdAt", { ascending: false });

			const smallPageSize = COUPONS_SKUS_PAGE_SIZE;
			const from = pageIndex * smallPageSize;
			const to = from + smallPageSize - 1;

			query = query.range(from, to);

			const { data, error: fetchError, count } = await query;

			let error: null | ApiError = null;

			if (fetchError || data == null) {
				error = new ApiError(fetchError.message, 500, [fetchError.details]);
			}

			return {
				skus: data ?? null,
				total: count ?? 0,
				error: error ?? null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					skus: null,
					total: 0,
					error: err,
				};
			}
			return {
				skus: null,
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Fetch products types for index page */
	async getAllProducts(
		q = "",
		pageIndex = defaults.DEFAULT_PRODUCTS_PAGE - 1,
		pageSize = defaults.DEFAULT_PRODUCTS_PAGE_SIZE,
		filters: ProductFilters = {},
	): Promise<GetAllProductsResponse> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.PRODUCTS_TABLE)
				.select(
					`
					name, id, cover_image, is_featured, status, createdAt,
					sub_category!inner(
						sub_category_name, ${this.CATEGORY_TABLE}(category_name)
					),
					${this.PRODUCT_VARIANT_TABLE}(id)
				`,
					{ count: "exact" },
				)
				.order(filters.sortBy || defaults.defaultProductSortByFilter, {
					ascending: filters.sortType === "asc",
				});

			// Apply filters
			if (filters.status != undefined) {
				query = query.eq("status", filters.status);
			}
			if (filters.is_featured != undefined) {
				query = query.eq("is_featured", filters.is_featured);
			}
			if (filters.free_shipping != undefined) {
				query = query.eq("free_shipping", filters.free_shipping);
			}
			if (filters.category && filters.category.length > 0) {
				query = query.in("sub_category.parent_id", filters.category);
			}
			if (filters.sub_category && filters.sub_category.length > 0) {
				query = query.in("sub_category", filters.sub_category);
			}
			if (filters.createdAt) {
				query = query
					.gte("createdAt", filters.createdAt.from.toISOString())
					.lte("createdAt", filters.createdAt.to.toISOString());
			}

			// Apply search
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
				products:
					data?.map((product) => {
						return {
							...product,
							variants_count: product[this.PRODUCT_VARIANT_TABLE].length ?? 0,
							categoryName: product.sub_category?.category?.category_name || "",
							subCategoryName: product.sub_category?.sub_category_name || "",
						};
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

	/** DELETE A PRODUCT FOR ROLLBACK!! */
	async delProdcutForRollback(productId: string) {
		return await this.supabase.from(this.PRODUCTS_TABLE).delete().eq("id", productId);
	}

	/** Create Product Row and its meta details */
	@UseMiddleware(requireAllPermissions([Permission.CREATE_PRODUCTS]))
	async createProduct(input: ProductActionData): Promise<void> {
		const {
			cover_image,
			description,
			name,
			meta_details,
			free_shipping,
			is_featured,
			status,
			sub_category,
			optional_attributes,
		} = input;

		const metaDetailsService = await this.createSubService(MetaDetailsService);
		const metaDetailsId = await metaDetailsService.createMetaDetails(meta_details);

		const mediaSvc = await this.createSubService(MediaService);

		let cover_public_url = "";

		if (cover_image && cover_image.size > 0) {
			const { data } = await mediaSvc.uploadImage(cover_image);
			cover_public_url = data?.path ?? "";
			if (!cover_public_url || cover_public_url == "") {
				await metaDetailsService.deleteMetaDetails(metaDetailsId);
				throw new ApiError("Failed to upload image", 500, []);
			}
		}

		const { error: prodError, data } = await this.supabase
			.from(this.PRODUCTS_TABLE)
			.insert({
				cover_image: cover_public_url,
				description,
				name,
				meta_details: metaDetailsId,
				free_shipping: stringToBooleanConverter(free_shipping),
				is_featured: stringToBooleanConverter(is_featured),
				status: stringToBooleanConverter(status),
				sub_category: sub_category,
			})
			.select("id")
			.single();

		async function rollback() {
			await metaDetailsService.deleteMetaDetails(metaDetailsId);
			await mediaSvc.deleteImage(cover_public_url);
		}

		if (prodError) {
			rollback();
			throw new ApiError(`Failed to create product: ${prodError.message}`, 500, [prodError.details]);
		}

		if (optional_attributes && Array.isArray(optional_attributes) && optional_attributes.length > 0) {
			const productsRattribsSvc = await this.createSubService(ProductRAttributesService);

			const finalAttributes = optional_attributes.map((attribute_id) => {
				return {
					attribute_id: attribute_id,
					product_id: data.id,
				};
			});

			const { error: attribInsertError } =
				await productsRattribsSvc.createBulkProductAttributes(finalAttributes);

			if (attribInsertError) {
				rollback();
				await this.delProdcutForRollback(data.id);
				throw new ApiError(`Failed to create product attributes: ${attribInsertError.message}`, 500, [
					attribInsertError.details,
				]);
			}
		}
	}

	/** Get full single product details including its meta details */
	@UseMiddleware(requireAllPermissions([Permission.UPDATE_PRODUCTS]))
	async getFullSingleProduct(productId: string): Promise<GetSingleProductResponse> {
		try {
			let { data, error: queryError } = await this.supabase
				.from(this.PRODUCTS_TABLE)
				.select(
					`
					*,
					meta_details(*),
					${this.PRODUCT_ATTRIBUTES_TABLE}(${this.ATTRIBUTES_TABLE}(*))	
				`,
				)
				.eq("id", productId)
				.single();

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			let extracted_attributes: ProductAttributeRow[] = [];
			const attributes = data?.[this.PRODUCT_ATTRIBUTES_TABLE] || [];

			attributes.map((variant_attrib_row) => {
				let i = variant_attrib_row.attributes;

				return extracted_attributes.push({
					attribute_type: i.attribute_type,
					value: i.value,
					id: i.id,
					name: i.name,
				});
			});

			return {
				product: {
					...{ ...data, product_attributes: undefined },
					attributes: extracted_attributes,
				} as FullProduct | null,
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
	@UseMiddleware(requireAllPermissions([Permission.UPDATE_PRODUCTS]))
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
			added_attributes,
			removed_attributes,
		} = input;

		const { data: prodData, error: fetchError } = await this.supabase
			.from(this.PRODUCTS_TABLE)
			.select("meta_details, cover_image")
			.eq("id", productId)
			.single();

		const metaDetailsId = prodData?.meta_details;
		if (fetchError || !prodData || !metaDetailsId) {
			throw new ApiError(`Product not found`, 404, []);
		}

		const variantAttributesSvc = await this.createSubService(ProductRAttributesService);

		// Delete removed attributes
		if (Array.isArray(removed_attributes) && removed_attributes.length > 0) {
			await variantAttributesSvc.deleteBulkProductRAttributes({
				product_id: productId,
				attributes_ids: removed_attributes,
			});
		}

		// Insert added attributes
		if (Array.isArray(added_attributes) && added_attributes.length > 0) {
			const finalAttributes_toAdd = added_attributes.map((attribute_id) => {
				return {
					product_id: productId,
					attribute_id: attribute_id,
				};
			});

			const { error: prodVarAttributeError } =
				await variantAttributesSvc.createBulkProductAttributes(finalAttributes_toAdd);

			if (prodVarAttributeError) {
				throw new ApiError(`Failed to update product: ${prodVarAttributeError.message}`, 500, [
					prodVarAttributeError.details,
				]);
			}
		}

		const currentStoredImg = prodData.cover_image;
		let newImagePath: string | null = null;

		if (!currentStoredImg) {
			throw new ApiError(`Product image not found`, 404, []);
		}

		const mediaSvc = await this.createSubService(MediaService);
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
				.from(this.PRODUCTS_TABLE)
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
			const metaDetailsService = await this.createSubService(MetaDetailsService);
			await metaDetailsService.updateMetaDetails({ meta_details, metaDetailsId });
		}
	}
}

@UseClassMiddleware(loggerMiddleware)
export class FP_ProductsService extends Service {
	async getFeaturedProducts(pageIndex: number = 0): Promise<FP_Featured_Products_Response> {
		try {
			let query = this.supabase
				.from("product")
				.select(
					`
          id,
          name,
          cover_image,
          product_variant (
            id,
            product_id,
            original_price
          ),
          product_attributes (
            attribute_id
          )
        `,
					{ count: "exact" },
				)
				.eq("is_featured", true);

			const smallPageSize = 10;
			const from = pageIndex * smallPageSize;
			const to = from + smallPageSize - 1;

			query = query.range(from, to).order("createdAt", { ascending: false });

			const { data, error: fetchError } = await query;

			let error: null | ApiError = null;
			let products: FP_Featured_Product[] | null = null;

			if (fetchError || data == null) {
				error = new ApiError(fetchError.message, 500, [fetchError.details]);
			} else {
				products = await Promise.all(
					data.map(async (product) => {
						// Collect all variant IDs for the product
						const variantIds = product.product_variant.map((v) => v.id);

						// Fetch all variant attributes
						const { data: variantAttrData, error: variantAttrError } = await this.supabase
							.from("variant_attributes")
							.select("attribute_id")
							.in("variant_id", variantIds);

						if (variantAttrError || !variantAttrData) {
							return {
								id: product.id,
								name: product.name,
								cover_image: product.cover_image,
								available_sizes: [],
								original_price: product.product_variant[0]?.original_price ?? 0,
							};
						}

						const sizeAttributeIds = variantAttrData.map((v) => v.attribute_id);
						const { data: sizeData, error: sizeError } = await this.supabase
							.from("attributes")
							.select("value")
							.in("id", sizeAttributeIds)
							.eq("attribute_type", "size");

						if (sizeError || !sizeData) {
							return {
								id: product.id,
								name: product.name,
								cover_image: product.cover_image,
								available_sizes: [],
								original_price: product.product_variant[0]?.original_price ?? 0,
							};
						}

						return {
							id: product.id,
							name: product.name,
							cover_image: product.cover_image,
							available_sizes: sizeData.map((s) => s.value),
							original_price: product.product_variant[0]?.original_price ?? 0,
						};
					}),
				);
			}

			return {
				products,
				error: error ?? null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					products: null,
					error: err,
				};
			}
			return {
				products: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}
}
