import { queryOptions } from "@tanstack/react-query";
import { CategoryService } from "~/services/category.service";
import { GetAllCategoriesResponse, GetCategoryResponse, GetSubCategoriesResponse, GetSubCategoryResponse } from "~/types/category.d";

interface categoriesQueryArgs {
    request: Request;
    q: string;
    pageIndex?: number;
    pageSize?: number;
}

interface subCategoriesQueryArgs {
    request: Request;
    categoryId: string,
	q: string,
	pageIndex: number,
	pageSize: number
}

interface singleCategoryQueryArgs {
	request: Request;
	categoryId: string;
}

interface singleSubCategoryQueryArgs {
	request: Request;
	subCategoryId: string;
}

export const categoriesQuery = ({ request, q, pageIndex, pageSize }: categoriesQueryArgs) => {
	return queryOptions<GetAllCategoriesResponse>({
		queryKey: ["categories", q, pageIndex, pageSize],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.getAllCategories(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const subCategoriesQuery = ({
	request,
	categoryId,
	q,
	pageIndex,
	pageSize,
}: subCategoriesQueryArgs) => {
	return queryOptions<GetSubCategoriesResponse>({
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