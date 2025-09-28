import { queryOptions } from "@tanstack/react-query";
import { FP_ProductsService } from "@ecom/shared/services/products.service";
import { FP_Featured_Products_Response } from "@ecom/shared/types/products";

interface featuredProductsQueryArgs {
	request: Request;
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
