import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { defaults, TABLE_NAMES } from "~/constants";
import {
	CollectionDataCategory,
	CollectionDataItemsResponse,
	CollectionDataSubCategory,
	FullCollection,
	GetFullCollection,
	GetHighLevelCollectionsResp,
	HighLevelCollection,
} from "~/types/collections";
import { CollectionDataItemsArgs } from "~/queries/collections.q";
import { CollectionActionData, CollectionUpdateActionData } from "~/schemas/collections.schema";
import { MediaService } from "./media.service";
import { stringToBooleanConverter } from "~/lib/utils";
import { CollectionFilers } from "~/schemas/collections-filter.schema";

export class CollectionsService {
	private supabase: SupabaseClient<Database>;
	private readonly request: Request;
	private readonly PRODUCTS_TABLE = TABLE_NAMES.product;
	private readonly CATEGORY_TABLE = TABLE_NAMES.category;
	private readonly SUB_CATEGORY_TABLE = TABLE_NAMES.sub_category;
	private readonly VARIANTS_TABLE = TABLE_NAMES.product_variant;
	private readonly COLLECTION_PRODUCTS_TABLE = TABLE_NAMES.collection_products;
	private readonly COLLECTION_TABLE = TABLE_NAMES.collection;

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.request = request;
	}

	/** Fetch collections for index page */
	async getHighLevelCollections(
		q = "",
		pageIndex = defaults.DEFAULT_COLLECTIONS_PAGE - 1,
		pageSize = defaults.DEFAULT_COLLECTIONS_PAGE_SIZE,
		filters: CollectionFilers = {}
	): Promise<GetHighLevelCollectionsResp> {
		try {
			const { data, error: queryError } = await this.supabase.rpc("get_high_level_collections", {
				p_search_term: q,
				p_page: pageIndex,
				p_page_size: pageSize,
				p_sort_by: filters.sortBy || defaults.defaultCollectionSortByFilter,
				p_sort_direction: filters.sortType || "desc",
			});

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}
			
			return {
				collections:
					data?.map((item) => {
						return {
							id: item.id,
							name: item.name,
							image_url: item.image_url,
							status: item.status,
							createdAt: item.created_at,
							url_key: item.url_key,
							products_count: item.products_count
						} as HighLevelCollection;
					}) ?? [],
				total: data![0].total_count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { collections: [], total: 0, error: err };
			}
			return {
				collections: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Fetch collection data for create and update collection page */
	/** IT FETCHES
	 * --> ALL THE CATEGORIES THAT HAVE AT LEAST ONE SUB CATEGORY
	 * --> ALL THE PRODUCTS FOR EACH SUB CATEGORY
	 * 		--> THAT IS ACTIVE
	 * 		--> THAT HAVE AT LEAST ONE ACTIVE VARIANT
	 * */
	async getCollectionDataItems({
		q = "",
		categoryPageIndex = 0,
		productPageIndex = 0,
	}: CollectionDataItemsArgs): Promise<CollectionDataItemsResponse> {
		// Calculate range for categories
		const categoryPageSize = defaults.DEFAULT_COLLECTIONS_CATEGORY_PAGE_SIZE; // 1
		const productPageSize = defaults.DEFAULT_COLLECTIONS_PRODUCTS_PAGE_SIZE; // Likely 10

		// Calculate range for categories
		const categoryFrom = categoryPageIndex * categoryPageSize;
		const categoryTo = categoryFrom + categoryPageSize - 1;

		// Calculate range for products
		const productFrom = productPageIndex * productPageSize;
		const productTo = productFrom + productPageSize - 1;

		try {
			// Build the query starting from PRODUCTS_TABLE
			let query = this.supabase
				.from(this.PRODUCTS_TABLE)
				.select(
					`
						id,
						name,
						status,
						createdAt,
						${this.VARIANTS_TABLE}!inner(id, status),
						${this.SUB_CATEGORY_TABLE}!inner(
							id,
							sub_category_name,
							parent_id,
							createdAt,
							${this.CATEGORY_TABLE}!inner(
								id,
								category_name,
								createdAt
							)
						)
					`,
					{ count: "exact" }
				)
				.eq("status", true) // Filter active products
				.eq(`${this.VARIANTS_TABLE}.status`, true); // Filter products with active variants

			// Apply search filter to product name if provided
			if (q.length > 0) {
				query = query.ilike("name", `%${q}%`);
			}

			const { data: productsList, error: queryError, count: totalProducts } = await query;

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			// console.log(productsList);

			// Process the flat product list into the hierarchical structure
			const categoryMap = new Map<string, CollectionDataCategory>();
			const subCategoryMap = new Map<string, CollectionDataSubCategory>();

			productsList?.forEach((product) => {
				const subCategoryData = product[this.SUB_CATEGORY_TABLE];
				const categoryData = subCategoryData[this.CATEGORY_TABLE];

				const categoryId = categoryData.id;
				let category = categoryMap.get(categoryId);
				if (!category) {
					category = {
						id: categoryId,
						category_name: categoryData.category_name,
						sub_categories: [],
						createdAt: categoryData.createdAt, // Preserve for sorting
					};
					categoryMap.set(categoryId, category);
				}

				const subCategoryId = subCategoryData.id;
				let subCategory = subCategoryMap.get(subCategoryId);
				if (!subCategory) {
					subCategory = {
						id: subCategoryId,
						sub_category_name: subCategoryData.sub_category_name,
						parent_id: subCategoryData.parent_id ?? categoryId,
						product_count: 0,
						products: [],
						createdAt: subCategoryData.createdAt, // Preserve for sorting
					};
					subCategoryMap.set(subCategoryId, subCategory);
					category.sub_categories.push(subCategory);
				}

				subCategory.products.push({
					id: product.id,
					name: product.name,
					createdAt: product.createdAt, // Preserve for sorting
				});
				subCategory.product_count += 1;
			});

			// Convert map to array and sort categories by createdAt
			const categoriesList = Array.from(categoryMap.values()).sort((a, b) => {
				if (a.createdAt && b.createdAt) {
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				} else {
					return 0; // or some other default value
				}
			});

			// Apply category pagination
			const categories = categoriesList
				.slice(categoryFrom, categoryTo + 1)
				.map((category) => {
					// Process subcategories
					category.sub_categories = category.sub_categories.map((subCategory) => {
						// Sort and paginate products
						const paginatedProducts = subCategory.products
							.sort((a, b) => {
								if (a.createdAt && b.createdAt) {
									return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
								} else {
									return 0; // or some other default value
								}
							})
							.slice(productFrom, productTo + 1)
							.map((product) => ({
								id: product.id,
								name: product.name,
							}));

						return {
							id: subCategory.id,
							sub_category_name: subCategory.sub_category_name,
							parent_id: subCategory.parent_id,
							product_count: subCategory.products.length, // Total before pagination
							products: paginatedProducts,
						};
					});
					return category;
				})
				.filter((category) => category.sub_categories.length > 0); // Only include categories with subcategories

			return {
				categories,
				totalCategories: categoryMap.size, // Total unique categories with matching products
				totalProducts: totalProducts ?? 0, // Total matching products across all categories
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { categories: [], totalCategories: 0, totalProducts: 0, error: err };
			}
			return {
				categories: [],
				totalCategories: 0,
				totalProducts: 0,
				error: new ApiError("Unknown error", 500, [err.message]),
			};
		}
	}

	/** Create collection */
	async createCollection(input: CollectionActionData): Promise<void> {
		const { description, image, meta_details, name, product_ids, sort_order, status } = input;
		const mediaSvc = new MediaService(this.request);
		let uploaded_img_url = "";

		try {
			if (image && image.size > 0) {
				const { data } = await mediaSvc.uploadImage(image);

				uploaded_img_url = data?.path ?? "";

				if (!uploaded_img_url || uploaded_img_url == "") {
					throw new ApiError("Failed to upload image", 500, []);
				}
			}

			const { error } = await this.supabase
				.rpc("create_collection", {
					p_name: name,
					p_description: description,
					p_image_url: uploaded_img_url,
					p_url_key: meta_details.url_key,
					p_meta_title: meta_details.meta_title,
					p_meta_description: meta_details.meta_description,
					p_meta_keywords: meta_details.meta_keywords || "",
					p_sort_order: Number(sort_order),
					p_status: stringToBooleanConverter(status),
					p_product_ids: product_ids
				});

			if (error) {
				throw new ApiError(`${error.message}`, 500, [
					error.details || [],
				]);
			}
		} catch (error) {
			if (uploaded_img_url) {
				await mediaSvc.deleteImage(uploaded_img_url);
			}
			throw error instanceof ApiError ? error : new ApiError("Failed to create collection", 500, []);
		}
	}

	/** Get full collection (for updation) */
	async getFullCollection(collection_id: string): Promise<GetFullCollection> {
		try {
			const { data, error: queryError } = await this.supabase
				.from("collections")
				.select(`
					*,
					meta_details(*),
					${this.COLLECTION_PRODUCTS_TABLE}!${this.COLLECTION_PRODUCTS_TABLE}_collection_id_fkey(${this.PRODUCTS_TABLE}(id, name))
				`)
				.eq("id", collection_id)
				.single();
			
			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}
			
			return {
				collection: {
					...data,
					products: data?.collection_products?.map((item) => ({
						id: item.product.id,
						name: item.product.name
					}))
				} as FullCollection | null,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { collection: null, error: err };
			}
			return {
				collection: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Update collection */
	async updateCollection(collection_id: string, input: CollectionUpdateActionData): Promise<{ error: ApiError | null }> {
		const {
			added_product_ids,
			removed_product_ids,
			image, // New image to be uploaded
			meta_details,
			name,
			description,
			sort_order,
			status,
			removed_image
		} = input;

		if (typeof image === "string") {
			throw new ApiError("Inavalid image input provided.", 400, []);
		}
		
		let newImagePath: string | null = null;
		const mediaSvc = new MediaService(this.request);

		try {
			// Fetch required current collection data
			const { data: collectionData, error: fetchError } = await this.supabase
				.from(this.COLLECTION_TABLE)
				.select("image_url, meta_details")
				.eq("id", collection_id)
				.single();

			if (fetchError) {
				throw new ApiError(fetchError.message, Number(fetchError.code) ?? 500, [fetchError.details]);
			}

			// Get collection image url and meta details
			const metaDetailsId = collectionData.meta_details;

			if (image && image.size > 0) {
				if (!removed_image) {
					throw new ApiError("Inavalid image input provided.", 400, []);
				}

				const { data } = await mediaSvc.uploadImage(image);

				if (!data?.path || data?.path == "") {
					throw new ApiError("Failed to upload image", 500, []);
				}

				newImagePath = data.path;
			}

			// Prepare data for Supabase function
			const updateData: any = {
				p_collection_id: collection_id,
				p_name: input.name ?? null,
				p_description: input.description ?? null,
				p_image_url: newImagePath || (typeof input.image === "string" ? input.image : null),
				p_sort_order: input.sort_order ? parseInt(input.sort_order, 10) : null,
				p_status: input.status ? input.status === "true" : null,
				p_meta_details_id: metaDetailsId,
				p_url_key: input.meta_details?.url_key ?? null,
				p_meta_title: input.meta_details?.meta_title ?? null,
				p_meta_description: input.meta_details?.meta_description ?? null,
				p_meta_keywords: input.meta_details?.meta_keywords ? input.meta_details.meta_keywords : null,
				p_added_product_ids: input.added_product_ids ?? [],
				p_removed_product_ids: input.removed_product_ids ?? [],
			};

			// Call Supabase function to update atomically
			const { error: updateError } = await this.supabase.rpc("update_collection", updateData);
			console.log(updateData, updateError);
			let error: null | ApiError = null;

			if (updateError) {
				// Clean up uploaded image on failure
				if (newImagePath) {
					await mediaSvc.deleteImage(newImagePath);
				}
				
				error = new ApiError(`Failed to update collection: ${updateError.message}`, 500, [
					updateError.details,
				]);
			}

			// Delete old image if a new one was uploaded
			if (newImagePath && collectionData.image_url && collectionData.image_url !== newImagePath) {
				await mediaSvc.deleteImage(collectionData.image_url);
			}

			return { error };
		} catch (err: any) {
			// Clean up uploaded image on unexpected error
			if (newImagePath) {
				await mediaSvc.deleteImage(newImagePath);
			}
			return { error: new ApiError(err.message, 500, [err]) };
		}
	}
}
