import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { defaults, TABLE_NAMES } from "~/constants";
import { CollectionDataCategory, CollectionDataItemsResponse, CollectionDataSubCategory, GetHighLevelCollectionsResp, HighLevelCollection } from "~/types/collections";
import { CollectionDataItemsArgs } from "~/queries/collections.q";

export class CollectionsService {
	private supabase: SupabaseClient<Database>;
	private readonly request: Request;
	private readonly COLLECTION_TABLE = TABLE_NAMES.collection;
	private readonly PRODUCTS_TABLE = TABLE_NAMES.product;
	private readonly META_TABLE = TABLE_NAMES.meta_details;
	private readonly CATEGORY_TABLE = TABLE_NAMES.category;
	private readonly SUB_CATEGORY_TABLE = TABLE_NAMES.sub_category;
	private readonly VARIANTS_TABLE = TABLE_NAMES.product_variant;

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.request = request;
	}

	/** Fetch collections for index page */
	async getHighLevelCollections(
		q = "",
		pageIndex = defaults.DEFAULT_COLLECTIONS_PAGE - 1,
		pageSize = defaults.DEFAULT_COLLECTIONS_PAGE_SIZE
	): Promise<GetHighLevelCollectionsResp> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.COLLECTION_TABLE)
				.select(
					`
					id, name, image_url, status, createdAt,
					${this.PRODUCTS_TABLE}(count),
					${this.META_TABLE}(url_key)
				`,
					{ count: "exact" }
				)
				.order("createdAt", { ascending: false });

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
				collections:
					data?.map((item) => {
						return {
							id: item.id,
							name: item.name,
							image_url: item.image_url,
							status: item.status,
							createdAt: item.createdAt,
							url_key: item.meta_details.url_key,
							products_count: item.product[0].count ?? 0,
						} as HighLevelCollection;
					}) ?? [],
				total: count ?? 0,
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

			console.log(productsList);

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
}