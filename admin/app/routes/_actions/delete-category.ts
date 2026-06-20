import type { ActionFunctionArgs } from "react-router";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { CategoryService } from "@ecom/shared/services/category.service";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();

	const categoryId = formData.get("categoryId") as string;

	if (!categoryId || categoryId == "") {
		throw new Response("Category ID is required", { status: 400 });
	}

	try {
		const categoryService = new CategoryService(request);
		const result = await categoryService.deleteCategory(categoryId);

		if (!result.success) {
			return {
				success: false,
				error: result.message,
			};
		}

		await queryClient.invalidateQueries({ queryKey: ["categories"] });
		await queryClient.invalidateQueries({ queryKey: ["highLevelCategories"] });
		queryClient.invalidateQueries({ queryKey: ["categories_for_taxes"] });
		await queryClient.invalidateQueries({ queryKey: ["category", categoryId] });

		return { success: result.success, message: result.message };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to delete category";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};
