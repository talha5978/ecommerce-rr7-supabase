import { Service } from "@ecom/shared/services/service";
import { MetaDetailsService } from "@ecom/shared/services/meta-details.service";
import type {
	CategoryUpdationPayload,
	FullCategoryRow,
	FullSubCategoryRow,
	GetAllCategoriesResponse,
	GetCategoryResponse,
	GetHighLevelCategoriesResponse,
	GetHighLevelSubCategoriesResponse,
	GetSubCategoryResponse,
	HighLevelCategory,
	SubCategoryUpdationPayload,
} from "@ecom/shared/types/category";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { defaults } from "@ecom/shared/constants/constants";
import type {
	CategoryActionData,
	CategoryUpdateActionData,
	SubCategoryActionData,
	SubCategoryUpdateActionData,
} from "@ecom/shared/schemas/category.schema";

export class CategoryService extends Service {
	/** Fetch categoreies list where each category has at least one sub category (to be used for mutations and other tasks like in product creation page, updation page, theri filters and more...) */
	async getAllCategories({
		pageIndex,
		productCount,
		searchQuery,
	}: {
		pageIndex?: number;
		productCount?: boolean;
		searchQuery?: string;
	}): Promise<GetAllCategoriesResponse> {
		try {
			const productCountExists = productCount !== undefined || productCount !== null;
			let query;

			if (productCountExists) {
				query = this.supabase.from(this.CATEGORY_TABLE).select(
					`
					id, category_name,
					${this.SUB_CATEGORY_TABLE}!inner(
						id, sub_category_name, parent_id,
						${this.PRODUCTS_TABLE}(count)
					)
				`,
					{ count: "exact" },
				);
			} else {
				query = this.supabase.from(this.CATEGORY_TABLE).select(
					`
					id, category_name,
					${this.SUB_CATEGORY_TABLE}!inner(
						id, sub_category_name, parent_id
					)
				`,
					{ count: "exact" },
				);
			}

			if (searchQuery && searchQuery.length > 0) {
				query = query.ilike("category_name", `%${searchQuery}%`);
			}

			if (pageIndex != undefined) {
				// fetch 5 categories at a time in each operation!
				const smallPageSize = 5;
				const from = pageIndex * smallPageSize;
				const to = from + smallPageSize - 1;
				query = query.range(from, to);
			} else if (!pageIndex) {
				query = query.range(0, 50);
			}

			query = query.order("createdAt", { ascending: false });

			const { data: categoriesList, error: queryError, count } = await query;

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				categories:
					categoriesList?.map((category) => {
						return {
							id: category.id,
							category_name: category.category_name,
							sub_category: category.sub_category.map((subCategory) => {
								return {
									id: subCategory.id,
									sub_category_name: subCategory.sub_category_name,
									parent_id: subCategory.parent_id ?? category.id,
									products_count: (subCategory as any)?.product![0]?.count ?? 0,
								};
							}),
						};
					}) ?? [],
				total: count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { categories: [], total: 0, error: err };
			}
			console.log(err);

			return {
				categories: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Fetch and search from all high level categories on the index page of categories. with the given pageIndex and pageSize plus total count */
	async gethighLevelCategories(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_CATEGORY_PAGE_SIZE,
	): Promise<GetHighLevelCategoriesResponse> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.CATEGORY_TABLE)
				.select(
					`
					id, category_name, createdAt,
					${this.SUB_CATEGORY_TABLE}(count),
					${this.META_DETAILS_TABLE}(url_key)
				`,
					{ count: "exact" },
				)
				.range(from, to)
				.order("createdAt", { ascending: false });

			if (q.length > 0) {
				query = query.ilike("category_name", `%${q}%`);
			}

			const { data: rawCategories, error: queryError, count } = await query;

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				categories:
					rawCategories?.map((category) => {
						return {
							id: category.id,
							category_name: category.category_name,
							sub_category_count: category.sub_category[0].count ?? 0,
							createdAt: category.createdAt,
							url_key: category.meta_details?.url_key,
						} as HighLevelCategory;
					}) ?? [],
				total: count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { categories: [], total: 0, error: err };
			}
			return {
				categories: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Fetch a single page of sub‐categories for a given categoryId, plus total count. */
	async getSubCategories(
		categoryId: string,
		q = "",
		pageIndex = 0,
		pageSize = 10,
	): Promise<GetHighLevelSubCategoriesResponse> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.SUB_CATEGORY_TABLE)
				.select(
					`
					id, sub_category_name, description, createdAt,
					${this.META_DETAILS_TABLE}(url_key),
					${this.PRODUCTS_TABLE}(count)
				`,
					{ count: "exact" },
				)
				.eq("parent_id", categoryId)
				.order("createdAt", { ascending: false })
				.range(from, to);

			if (q.length > 0) {
				query = query.ilike("sub_category_name", `%${q}%`);
			}

			const { data: subCategories, error: queryError, count } = await query;

			if (queryError) {
				throw new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				subCategories:
					subCategories?.map((subCategory) => {
						return {
							id: subCategory.id,
							sub_category_name: subCategory.sub_category_name,
							url_key: subCategory.meta_details?.url_key,
							description: subCategory.description,
							createdAt: subCategory.createdAt,
							products_count: (subCategory as any)?.product![0]?.count ?? 0,
						};
					}) ?? [],
				total: count ?? 0,
				error: null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { subCategories: [], total: 0, error: err };
			}
			return {
				subCategories: [],
				total: 0,
				error: new ApiError(err.message || "Unknown error", 500, [err]),
			};
		}
	}

	/**   Create a new category along with the meta details */
	async createCategoryWithMeta(input: CategoryActionData): Promise<void> {
		const { category_name, description, sort_order, meta_details } = input;

		const metaDetailsService = new MetaDetailsService(this.request);
		const metaDetailsId = await metaDetailsService.createMetaDetails(meta_details);

		const { error: categoryError } = await this.supabase.from(this.CATEGORY_TABLE).insert({
			category_name,
			description,
			sort_order: sort_order,
			meta_details: metaDetailsId,
		});

		if (categoryError) {
			await metaDetailsService.deleteMetaDetails(metaDetailsId);
			throw new ApiError(`Failed to create category: ${categoryError.message}`, 500, [
				categoryError.details,
			]);
		}
	}

	/** Create a new category along with the meta details */
	async createSubCategoryWithMeta(input: SubCategoryActionData): Promise<void> {
		const { sub_category_name, description, sort_order, meta_details, parent_id } = input;

		const metaDetailsService = new MetaDetailsService(this.request);
		const metaDetailsId = await metaDetailsService.createMetaDetails(meta_details);

		const { error: subCategoryError } = await this.supabase.from(this.SUB_CATEGORY_TABLE).insert({
			sub_category_name,
			description,
			sort_order: sort_order,
			meta_details: metaDetailsId,
			parent_id,
		});

		if (subCategoryError) {
			await metaDetailsService.deleteMetaDetails(metaDetailsId);
			throw new ApiError(`Failed to create sub category: ${subCategoryError.message}`, 500, [
				subCategoryError.details,
			]);
		}
	}

	/** Get full category */
	async getCategoryById(categoryId: string): Promise<GetCategoryResponse> {
		try {
			const { data: categoryData, error: queryError } = await this.supabase
				.from(this.CATEGORY_TABLE)
				.select(
					`
					*, 
					${this.SUB_CATEGORY_TABLE}:sub_category(*),
					${this.META_DETAILS_TABLE}:meta_details(*)
				`,
				)
				.eq("id", categoryId)
				.single();

			let error: null | ApiError = null;
			if (queryError || !categoryData) {
				error = new ApiError(
					queryError?.message || "Category not found",
					queryError ? 500 : 404,
					queryError ? [queryError.details] : [],
				);
			}

			return {
				category: categoryData as FullCategoryRow | null,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { category: null, error: err };
			}
			return {
				category: null,
				error: new ApiError("Unknown error", 500, [err.message]),
			};
		}
	}

	/**  Update product category with its meta details */
	async updateCategory(categoryId: string, input: Partial<CategoryUpdateActionData>): Promise<void> {
		const { category_name, description, sort_order, meta_details } = input;
		// Fetch meta_details ID
		const { data: categoryData, error: fetchError } = await this.supabase
			.from(this.CATEGORY_TABLE)
			.select("meta_details")
			.eq("id", categoryId)
			.single();

		if (fetchError || !categoryData) {
			throw new ApiError(`Category not found`, 404, []);
		}

		const metaDetailsId = categoryData.meta_details;

		// Build category update payload
		const categoryUpdate: Partial<CategoryUpdationPayload> = {};
		if (category_name) categoryUpdate.category_name = category_name;
		if (description !== undefined) categoryUpdate.description = description;
		if (sort_order !== undefined) categoryUpdate.sort_order = sort_order;

		// Update category if any fields provided
		if (Object.keys(categoryUpdate).length > 0) {
			const { error: categoryError } = await this.supabase
				.from(this.CATEGORY_TABLE)
				.update(categoryUpdate)
				.eq("id", categoryId);

			if (categoryError) {
				throw new ApiError(`Failed to update category: ${categoryError.message}`, 500, []);
			}
		}

		if (meta_details) {
			const metaDetailsService = new MetaDetailsService(this.request);
			await metaDetailsService.updateMetaDetails({ meta_details, metaDetailsId });
		}
	}

	/**  Get full sub category */
	async getSubCategoryById(sub_category_id: string): Promise<GetSubCategoryResponse> {
		try {
			const { data: subCategoryData, error: queryError } = await this.supabase
				.from(this.SUB_CATEGORY_TABLE)
				.select(
					`
					*,
					${this.META_DETAILS_TABLE}:meta_details(*)
				`,
				)
				.eq("id", sub_category_id)
				.single();

			let error: null | ApiError = null;
			if (queryError || !subCategoryData) {
				error = new ApiError(
					queryError?.message || "Sub category not found",
					queryError ? 500 : 404,
					queryError ? [queryError.details] : [],
				);
			}

			return {
				sub_category: subCategoryData as FullSubCategoryRow | null,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { sub_category: null, error: err };
			}
			return {
				sub_category: null,
				error: new ApiError("Unknown error", 500, [err.message]),
			};
		}
	}

	/** Update sub category with its meta details */
	async updateSubCategory(sub_category_id: string, input: Partial<SubCategoryUpdateActionData>) {
		const { sub_category_name, description, sort_order, meta_details } = input;
		// Fetch meta_details ID
		const { data: categoryData, error: fetchError } = await this.supabase
			.from(this.SUB_CATEGORY_TABLE)
			.select("meta_details")
			.eq("id", sub_category_id)
			.single();

		if (fetchError || !categoryData) {
			throw new ApiError(`Sub category not found`, 404, []);
		}

		const metaDetailsId = categoryData.meta_details;

		// Build sub category update payload
		const subCategoryUpdate: Partial<SubCategoryUpdationPayload> = {};
		if (sub_category_name) subCategoryUpdate.sub_category_name = sub_category_name;
		if (description !== undefined) subCategoryUpdate.description = description;
		if (sort_order !== undefined) subCategoryUpdate.sort_order = sort_order;

		// Update sub category if any fields provided
		if (Object.keys(subCategoryUpdate).length > 0) {
			const { error: categoryError } = await this.supabase
				.from(this.SUB_CATEGORY_TABLE)
				.update(subCategoryUpdate)
				.eq("id", sub_category_id);

			if (categoryError) {
				throw new ApiError(`Failed to update sub category: ${categoryError.message}`, 500, []);
			}
		}

		if (meta_details) {
			const metaDetailsService = new MetaDetailsService(this.request);
			await metaDetailsService.updateMetaDetails({ meta_details, metaDetailsId });
		}
	}
}
