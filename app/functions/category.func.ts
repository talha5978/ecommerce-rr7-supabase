
import type { GetAllCategoriesResponse } from "~/types/category";
import type { Database } from "~/types/supabase";
import { ApiError } from "~/lib/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { categoryDefaults } from "~/constants";

export class CategoryFunction {
	private supabase: SupabaseClient<Database>;
	private readonly TABLE = "category";

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
	}

	/** Fetch and search from all categories. */
	async getAllCategories(
		q = "",
		pageIndex = 0,
		pageSize = categoryDefaults.DEFAULT_CATEGORY_PAGE_SIZE
	): Promise<GetAllCategoriesResponse> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		let query = this.supabase
			.from(this.TABLE)
			.select("*, sub_category:sub_category(*)", { count: "exact" })
			.range(from, to);

		if (q.length > 0) {
			query = query.ilike("category_name", `%${q}%`);
		}

		const { data: categories, error: queryError, count } = await query;

		let error: null | ApiError = null;
		if (queryError) {
			error = new ApiError(queryError.message, 500);
		}

		return {
			categories: categories ?? [],
			total: count ?? 0,
			error,
		};
	}

	// /**
	//  * Insert a new category. Pass an object with at least `category_name`.
	//  * Returns the newly inserted Category record.
	//  */
	// async addCategory(newCategory: Partial<Category>): Promise<Category> {
	// 	const { data, error } = await this.supabase.from<Category>(this.TABLE).insert(newCategory).single();

	// 	if (error) {
	// 		throw new Error(`Error creating category: ${error.message}`);
	// 	}
	// 	return data;
	// }

	// /**
	//  * Update an existing category by `id`. `payload` can contain any subset of fields.
	//  * Returns the updated Category.
	//  */
	// async updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
	// 	const { data, error } = await this.supabase
	// 		.from<Category>(this.TABLE)
	// 		.update(payload)
	// 		.eq("id", id)
	// 		.single();

	// 	if (error) {
	// 		throw new Error(`Error updating category (id=${id}): ${error.message}`);
	// 	}
	// 	return data;
	// }

	// /**
	//  * Delete a category by `id`. Returns nothing if successful.
	//  */
	// async deleteCategory(id: string): Promise<void> {
	// 	const { error } = await this.supabase.from(this.TABLE).delete().eq("id", id);

	// 	if (error) {
	// 		throw new Error(`Error deleting category (id=${id}): ${error.message}`);
	// 	}
	// }
}

// let sbQuery = this.supabase.from(this.TABLE).select(`
// 	*, sub_category:sub_category(*)
// `);
// console.log("Actual Funciton ran ✅");

// if (q.length > 0) {
// 	sbQuery = sbQuery.ilike("category_name", `%${q}%`);
// }

// const { data: categories, error: queryError } = await sbQuery;
// let error: null | ApiError = null;

// if (error) {
// 	error = new ApiError(queryError?.message, 500);
// }

// return { categories: categories ?? null, error };