import { queryOptions } from "@tanstack/react-query";
import type { GroupOptions } from "~/components/Coupons/BuyXGetYCard";
import { ProductFilters } from "~/schemas/products-filter.schema";
import { ProductsService } from "~/services/products.service";
import type {
	GetAllProductsResponse,
	GetSingleProductResponse,
	ProductNamesListResponse,
	SKUsNamesListResponse,
} from "~/types/products";

interface productsQueryArgs {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
	filters?: ProductFilters;
}

type productNamesQueryArgs = { request: Request };
type skuNamesQueryArgs = {
	request: Request;
	pageIndex?: number;
	searchQuery?: string;
	autoRun?: boolean;
	group: GroupOptions;
};
type singleProductQueryArgs = { request: Request; productId: string };

export const productsQuery = ({ request, q, pageIndex, pageSize, filters }: productsQueryArgs) => {
	return queryOptions<GetAllProductsResponse>({
		queryKey: ["products", q, pageIndex, pageSize, filters],
		queryFn: async () => {
			const prodService = new ProductsService(request);
			const result = await prodService.getAllProducts(q, pageIndex, pageSize, filters);
			return result;
		},
	});
};

export const productNamesQuery = ({ request }: productNamesQueryArgs) => {
	return queryOptions<ProductNamesListResponse>({
		queryKey: ["productNames"],
		queryFn: async () => {
			const prodService = new ProductsService(request);
			const result = await prodService.getProductNamesList();
			return result;
		},
	});
};

export const skuNamesQuery = ({ request, pageIndex, searchQuery, autoRun, group }: skuNamesQueryArgs) => {
	return queryOptions<SKUsNamesListResponse>({
		queryKey: [`${group}_skuNames`, pageIndex, searchQuery],
		queryFn: async () => {
			const prodService = new ProductsService(request);
			const result = await prodService.getSKUsNamesList(pageIndex, searchQuery);
			return result;
		},
		enabled: !!autoRun,
	});
};

export const getFullSingleProductQuery = ({ request, productId }: singleProductQueryArgs) => {
	return queryOptions<GetSingleProductResponse>({
		queryKey: ["fullProduct", productId],
		queryFn: async () => {
			const prodService = new ProductsService(request);
			const result = await prodService.getFullSingleProduct(productId);
			return result;
		},
	});
};
