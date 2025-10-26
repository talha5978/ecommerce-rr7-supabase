import { queryOptions } from "@tanstack/react-query";
import type {
	GetAllCategoriesResponse,
	GetCategoriesForTaxesResp,
	GetCategoryResponse,
	GetHighLevelCategoriesResponse,
	GetHighLevelSubCategoriesResponse,
	GetSubCategoryResponse,
} from "@ecom/shared/types/category";
import { CategoryService } from "@ecom/shared/services/category.service";

interface highLevelCategoriesQueryArgs {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
}

interface subCategoriesQueryArgs {
	request: Request;
	categoryId: string;
	q: string;
	pageIndex: number;
	pageSize: number;
}

interface singleCategoryQueryArgs {
	request: Request;
	categoryId: string;
}

interface singleSubCategoryQueryArgs {
	request: Request;
	subCategoryId: string;
}

interface categoriesQueryArgs {
	request: Request;
	autoRun?: boolean;
	pageIndex?: number;
	searchQuery?: string;
}

export const highLevelCategoriesQuery = ({
	request,
	q,
	pageIndex,
	pageSize,
}: highLevelCategoriesQueryArgs) => {
	return queryOptions<GetHighLevelCategoriesResponse>({
		queryKey: ["highLevelCategories", q, pageIndex, pageSize],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.gethighLevelCategories(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const categoriesForTaxesQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetCategoriesForTaxesResp>({
		queryKey: ["categories_for_taxes"],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.getCategoriesForTaxRates();
			return result;
		},
	});
};

// Ye query coupons mien use ho ri hai is leye autoRun aur group wagera props pass krr rhy hain aur baqi jaghon pr bi use ho ri hai is leye group aur autoRun optional hain
export const categoriesQuery = ({
	request,
	autoRun = false,
	pageIndex,
	searchQuery,
}: categoriesQueryArgs) => {
	return queryOptions<GetAllCategoriesResponse>({
		queryKey: ["categories", pageIndex, searchQuery],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.getAllCategories({
				pageIndex,
				searchQuery,
			});
			return result;
		},
		enabled: !!autoRun,
	});
};

export const subCategoriesQuery = ({
	request,
	categoryId,
	q,
	pageIndex,
	pageSize,
}: subCategoriesQueryArgs) => {
	return queryOptions<GetHighLevelSubCategoriesResponse>({
		queryKey: ["subCategories", categoryId, q, pageIndex, pageSize],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.getSubCategories(categoryId, q, pageIndex, pageSize);
			return result;
		},
	});
};

export const singleCategoryQuery = ({ request, categoryId }: singleCategoryQueryArgs) => {
	return queryOptions<GetCategoryResponse>({
		queryKey: ["category", categoryId],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.getCategoryById(categoryId);
			return result;
		},
	});
};

export const singleSubCategoryQuery = ({ request, subCategoryId }: singleSubCategoryQueryArgs) => {
	return queryOptions<GetSubCategoryResponse>({
		queryKey: ["subCategory", subCategoryId],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.getSubCategoryById(subCategoryId);
			return result;
		},
	});
};
