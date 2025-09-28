import { queryOptions } from "@tanstack/react-query";
import type { FP_HeaderCategoriesResponse } from "@ecom/shared/types/category";
import { FP_CategoryService } from "@ecom/shared/services/category.service";

interface headerCategoriesQueryArgs {
	request: Request;
}

export const get_FP_headerCategories = ({ request }: headerCategoriesQueryArgs) => {
	return queryOptions<FP_HeaderCategoriesResponse>({
		queryKey: ["fp_header_categories"],
		queryFn: async () => {
			const categoryService = new FP_CategoryService(request);
			const result = await categoryService.getHeaderCategories();
			return result;
		},
	});
};
