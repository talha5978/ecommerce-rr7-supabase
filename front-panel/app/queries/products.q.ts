import { queryOptions } from "@tanstack/react-query";
import { FP_ProductsService } from "@ecom/shared/services/products.service";
import type { FP_Featured_Products_Response } from "@ecom/shared/types/products";
import type { GetProductFullDetailsResp } from "@ecom/shared/types/product-details";

interface featuredProductsQueryArgs {
	request: Request;
}

interface productDetailsQueryArgs {
	request: Request;
	product_id: string;
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
