import { queryOptions } from "@tanstack/react-query";
import { FP_ProductsService } from "@ecom/shared/services/products.service";
import type {
	FP_Featured_Products_Response,
	FP_Search_Filters,
	FP_SearchProductsFilterResponse,
	FP_SearchProductsResponse,
} from "@ecom/shared/types/products";
import type { GetProductFullDetailsResp } from "@ecom/shared/types/product-details";

interface featuredProductsQueryArgs {
	request: Request;
}

interface productDetailsQueryArgs {
	request: Request;
	product_id: string;
}

interface searchProductsQueryArgs {
	request: Request;
	filters: FP_Search_Filters;
}

export const get_FP_featuredProducts = ({ request }: featuredProductsQueryArgs) => {
	return queryOptions<FP_Featured_Products_Response>({
		queryKey: ["fp_featured_products"],
		queryFn: async () => {
			const prodSvc = new FP_ProductsService(request);
			const result = await prodSvc.getFeaturedProducts();
			return result;
		},
	});
};

export const get_FP_searchProductsFilters = ({ request }: featuredProductsQueryArgs) => {
	return queryOptions<FP_SearchProductsFilterResponse>({
		queryKey: ["fp_search_products_filters"],
		queryFn: async () => {
			const prodSvc = new FP_ProductsService(request);
			const result = await prodSvc.getAllProductsFiltersData();
			return result;
		},
	});
};

export const get_FP_searchProducts = ({ request, filters }: searchProductsQueryArgs) => {
	return queryOptions<FP_SearchProductsResponse>({
		queryKey: ["fp_search_products", filters],
		queryFn: async () => {
			// console.log("categories: ", filters.categories, " ", filters.categories?.length);
			const prodSvc = new FP_ProductsService(request);
			const result = await prodSvc.getAllProducts(0, 20, filters);
			return result;
		},
	});
};

export const getProductDetails = ({ request, product_id }: productDetailsQueryArgs) => {
	return queryOptions<GetProductFullDetailsResp>({
		queryKey: ["product_details", product_id],
		queryFn: async () => {
			const prodSvc = new FP_ProductsService(request);
			const result = await prodSvc.getProductDetails(product_id);
			return result;
		},
	});
};
