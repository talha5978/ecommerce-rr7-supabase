
import type { CategoryUpdationPayload, FullCategoryRow, FullSubCategoryRow, GetAllCategoriesResponse, GetCategoryResponse, GetSubCategoriesResponse, GetSubCategoryResponse,  SubCategoryUpdationPayload } from "~/types/category.d";
import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { defaults } from "~/constants";
import type { CategoryActionData, CategoryUpdateActionData, SubCategoryActionData, SubCategoryUpdateActionData } from "~/schemas/category.schema";
import { MetaUpdationPayload } from "~/types/meta_details.d";
import { MetaDetailsService } from "~/services/meta-details.service";


export class CategoryService {
	private supabase: SupabaseClient<Database>;
	private readonly request: Request;
	private readonly TABLE = "category";
	private readonly SUB_TABLE = "sub_category";
	private readonly META_TABLE = "meta_details";
	
	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.request = request;
	}

	/** Fetch and search from all categories. with the given pageIndex and pageSize plus total count */
	async getAllCategories(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_CATEGORY_PAGE_SIZE
	): Promise<GetAllCategoriesResponse> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query: any = this.supabase
				.from(this.TABLE)
				.select(
					`
					*, 
					sub_category:${this.SUB_TABLE}(*),
					meta_details:${this.META_TABLE}(*)
				`,
					{ count: "exact" }
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
				categories: rawCategories ?? [],
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
		pageSize = 10
	): Promise<GetSubCategoriesResponse> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.SUB_TABLE)
				.select(
					`
					*, ${this.META_TABLE}:meta_details(*)
				`,
					{ count: "exact" }
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
				subCategories: subCategories ?? [],
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

		const { error: categoryError } = await this.supabase.from(this.TABLE).insert({
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

		const { error: subCategoryError } = await this.supabase.from(this.SUB_TABLE).insert({
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
				.from(this.TABLE)
				.select(
					`
					*, 
					${this.SUB_TABLE}:sub_category(*),
					${this.META_TABLE}:meta_details(*)
				`
				)
				.eq("id", categoryId)
				.single();

			let error: null | ApiError = null;
			if (queryError || !categoryData) {
				error = new ApiError(
					queryError?.message || "Category not found",
					queryError ? 500 : 404,
					queryError ? [queryError.details] : []
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
			.from(this.TABLE)
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
				.from(this.TABLE)
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
				.from(this.SUB_TABLE)
				.select(`
					*,
					${this.META_TABLE}:meta_details(*)
				`)
				.eq("id", sub_category_id)
				.single();

			let error: null | ApiError = null;
			if (queryError || !subCategoryData) {
				error = new ApiError(
					queryError?.message || "Sub category not found",
					queryError ? 500 : 404,
					queryError ? [queryError.details] : []
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
			.from(this.SUB_TABLE)
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
				.from(this.SUB_TABLE)
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

	/** Delete a category (Do this later!!!!) */
	// async deleteCategory(categoryId: string): Promise<void> {
	// 	// Check for subcategories
	// 	const { count, error: subCountError } = await this.supabase
	// 		.from(this.SUB_TABLE)
	// 		.select("id", { count: "exact", head: true })
	// 		.eq("parent_id", categoryId);

	// 	if (subCountError) {
	// 		throw new ApiError(`Failed to check subcategories: ${subCountError.message}`, 500, [
	// 			subCountError.details,
	// 		]);
	// 	}

	// 	if (count && count > 0) {
	// 		throw new ApiError(`Cannot delete category with ${count} subcategor${count > 1 ? "ies" : "y"}. Please delete all sub categories first.`, 400, [
	// 			{ subcategories_count: count },
	// 		]);
	// 	}

	// 	// Fetch the meta_details ID
	// 	const { data: categoryData, error: fetchError } = await this.supabase
	// 		.from(this.TABLE)
	// 		.select("meta_details")
	// 		.eq("id", categoryId)
	// 		.single();

	// 	if (fetchError || !categoryData) {
	// 		throw new ApiError(`Category not found: ${fetchError?.message || "Unknown error"}`, 404, [
	// 			fetchError?.details,
	// 		]);
	// 	}

	// 	const metaDetailsId = categoryData.meta_details;

	// 	// Delete the meta_details row (triggers CASCADE to delete category)
	// 	const { error: metaError } = await this.supabase
	// 		.from(this.META_TABLE)
	// 		.delete()
	// 		.eq("id", metaDetailsId);

	// 	if (metaError) {
	// 		throw new ApiError(`Failed to delete meta details: ${metaError.message}`, 500, [
	// 			metaError.details,
	// 		]);
	// 	}
	// }
}