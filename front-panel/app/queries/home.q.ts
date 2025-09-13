import { queryOptions } from "@tanstack/react-query";
import type { GetAllCategoriesResponse } from "@ecom/shared/types/category";
import { CategoryService } from "@ecom/shared/services/category.service";
import type { Groups } from "@ecom/shared/types/coupons-comp";

interface categoriesQueryArgs {
	request: Request;
	autoRun?: boolean;
	group?: Groups;
	pageIndex?: number;
	searchQuery?: string;
	productCount?: boolean;
}

// Ye query coupons mien use ho ri hai is leye autoRun aur group wagera props pass krr rhy hain aur baqi jaghon pr bi use ho ri hai is leye group aur autoRun optional hain
// export const headerQuery = ({
// 	request,
// 	autoRun = false,
// 	group,
// 	pageIndex,
// 	searchQuery,
// 	productCount
// }: categoriesQueryArgs) => {
// 	return queryOptions<GetAllCategoriesResponse>({
// 		queryKey: [group ? `${group}_categories`: "categories" , pageIndex, searchQuery],
// 		queryFn: async () => {
// 			const categoryService = new CategoryService(request);
// 			const result = await categoryService.getAllCategories({
// 				pageIndex,
// 				searchQuery,
// 				productCount
// 			});
// 			return result;
// 		},
// 		enabled: !!autoRun,
// 	});
// };
