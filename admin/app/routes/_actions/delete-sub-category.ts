import { ApiError } from "@ecom/shared/utils/ApiError";
import { CategoryService } from "@ecom/shared/services/category.service";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import type { Route } from "../_actions/+types/delete-sub-category";

export const action = async ({ request, params: { categoryId } }: Route.ActionArgs) => {
	const formData = await request.formData();

	const subCategoryId = formData.get("subCategoryId") as string;

	if (!subCategoryId || subCategoryId == "") {
		throw new Response("Sub-category ID is required", { status: 400 });
	}

	try {
		const categoryService = new CategoryService(request);
		const result = await categoryService.deleteSubCategory(subCategoryId);

		if (!result.success) {
			return {
				success: false,
				error: result.message,
			};
		}

		await queryClient.invalidateQueries({ queryKey: ["subCategories", categoryId] });
		await queryClient.invalidateQueries({ queryKey: ["categories"] });
		await queryClient.invalidateQueries({ queryKey: ["highLevelCategories"] });
		await queryClient.invalidateQueries({ queryKey: ["subCategory", subCategoryId] });

		return { success: result.success, message: result.message };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to delete sub-category";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};
