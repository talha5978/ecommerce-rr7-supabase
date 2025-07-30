import { queryOptions } from "@tanstack/react-query";
import { CategoryService } from "~/services/category.service";
import type {
	GetAllCategoriesResponse,
	GetCategoryResponse,
	GetHighLevelCategoriesResponse,
	GetHighLevelSubCategoriesResponse,
	GetSubCategoryResponse,
} from "~/types/category.d";

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

export const categoriesQuery = ({ request, pageIndex }: { request: Request; pageIndex?: number }) => {
	return queryOptions<GetAllCategoriesResponse>({
		queryKey: ["categories", pageIndex],
		queryFn: async () => {
			const categoryService = new CategoryService(request);
			const result = await categoryService.getAllCategories(pageIndex);
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
