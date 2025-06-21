import { queryOptions } from "@tanstack/react-query";
import { ProductVariantsService } from "~/services/product-variants.service";
import { GetAllProductVariants } from "~/types/product-variants";

interface productVariantsQueryArgs {
    request: Request;
	productId: string;
    q: string;
    pageIndex?: number;
    pageSize?: number;
}

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