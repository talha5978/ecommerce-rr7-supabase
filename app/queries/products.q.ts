import { queryOptions } from "@tanstack/react-query";
import { ProductVariantsService } from "~/services/product-variants.service";
import { ProductsService } from "~/services/products.service";
import { GetAllProductsResponse, GetAllProductVariants, GetSingleProductResponse } from "~/types/products";

interface productsQueryArgs {
    request: Request;
    q: string;
    pageIndex?: number;
    pageSize?: number;
}
interface productVariantsQueryArgs {
    request: Request;
	productId: string;
    q: string;
    pageIndex?: number;
    pageSize?: number;
}

type singleProductQueryArgs = { request: Request; productId: string }

export const productsQuery = ({ request, q, pageIndex, pageSize }: productsQueryArgs) => {
	return queryOptions<GetAllProductsResponse>({
		queryKey: ["products", q, pageIndex, pageSize],
		queryFn: async () => {
			const prodService = new ProductsService(request);
			const result = await prodService.getAllProducts(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const productVariantsQuery = ({ request, q, pageIndex, pageSize, productId }: productVariantsQueryArgs) => {
	return queryOptions<GetAllProductVariants>({
		queryKey: ["productVariants", productId , q, pageIndex, pageSize],
		queryFn: async () => {
			const prodVariantsService = new ProductVariantsService(request);
			const result = await prodVariantsService.getAllProductVariants(q, pageIndex, pageSize, productId);
			return result;
		},
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
	})
};