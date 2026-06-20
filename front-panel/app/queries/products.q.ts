import { queryOptions } from "@tanstack/react-query";
import { FP_ProductsService } from "@ecom/shared/services/products.service";
import type {
	FP_Featured_Products_Response,
	FP_Search_Filters,
	FP_SearchProductsFilterResponse,
	FP_SearchProductsResponse,
} from "@ecom/shared/types/products";
import type { GetProductFullDetailsResp } from "@ecom/shared/types/product-details";
import { sortProductSizes, sortSizes } from "~/utils/sortSizes";
import type { ProductAttribute } from "@ecom/shared/types/attributes";

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
			const filtersData = await prodSvc.getAllProductsFiltersData();
			if (filtersData.data?.attributes != null && "size" in filtersData.data.attributes) {
				const filterSizes = filtersData.data?.attributes?.["size"] || [];
				if (filterSizes) {
					filtersData.data.attributes["size"] = sortSizes(filterSizes as ProductAttribute[]);
				}
			}

			return filtersData;
		},
	});
};

export const get_FP_searchProducts = ({ request, filters }: searchProductsQueryArgs) => {
	return queryOptions<FP_SearchProductsResponse>({
		queryKey: ["fp_search_products", filters],
		queryFn: async () => {
			const prodSvc = new FP_ProductsService(request);
			const result = await prodSvc.getAllProducts(0, 20, filters);
			result.products?.map((product) => {
				if (product.available_sizes != null && product.available_sizes.length > 0) {
					product.available_sizes = sortProductSizes(product.available_sizes);
				}
			});

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
