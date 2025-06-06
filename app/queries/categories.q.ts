import { queryOptions } from "@tanstack/react-query";
import { CategoryFunction } from "~/functions/category.func";
import { GetAllCategoriesResponse } from "~/types/category";

interface categoriesQueryArgs {
    request: Request;
    q: string;
    pageIndex?: number;
    pageSize?: number;
}

export const categoriesQuery = ({ request, q, pageIndex, pageSize }: categoriesQueryArgs) => {
    return queryOptions<GetAllCategoriesResponse>({
        queryKey: ["categories", q, pageIndex, pageSize],
        queryFn: async () => {
            const categoryService = new CategoryFunction(request);
            const result = await categoryService.getAllCategories(q, pageIndex, pageSize);
            return result;
        },
    });
}