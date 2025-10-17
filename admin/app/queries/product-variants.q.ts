import { queryOptions } from "@tanstack/react-query";
import type {
	GetAllProductVariants,
	SingleProductVariantResponse,
	VariantConstraintsData,
	VariantsForCouponsResp,
} from "@ecom/shared/types/product-variants";
import { ProductVariantsService } from "@ecom/shared/services/product-variants.service";
import type { ProductVariantsFilters } from "@ecom/shared/schemas/product-variants-filter.schema";

interface productVariantsQueryArgs {
	request: Request;
	productId: string;
	q: string;
	pageIndex?: number;
	pageSize?: number;
	filters?: ProductVariantsFilters;
}

interface allProductUnitsQueryArgs {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
}

interface singleVariantQueryArgs {
	request: Request;
	variant_id: string;
}

interface variantConstraintsQueryArgs {
	request: Request;
	product_id: string;
}

interface getSkusForCouponsArgs {
	request: Request;
}

export const productVariantsQuery = ({
	request,
	q,
	pageIndex,
	pageSize,
	productId,
	filters,
}: productVariantsQueryArgs) => {
	return queryOptions<GetAllProductVariants>({
		queryKey: ["productVariants", productId, q, pageIndex, pageSize, filters],
		queryFn: async () => {
			const prodVariantsService = new ProductVariantsService(request);
			const result = await prodVariantsService.getProductVariants(
				q,
				pageIndex,
				pageSize,
				productId,
				filters,
			);
			return result;
		},
	});
};

export const allProductUnitsQuery = ({ request, q, pageIndex, pageSize }: allProductUnitsQueryArgs) => {
	return queryOptions<GetAllProductVariants>({
		queryKey: ["allProductUnits", q, pageIndex, pageSize],
		queryFn: async () => {
			const prodVariantsService = new ProductVariantsService(request);
			const result = await prodVariantsService.getAllProductUnits(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const singleVariantQuery = ({ request, variant_id }: singleVariantQueryArgs) => {
	return queryOptions<SingleProductVariantResponse>({
		queryKey: ["productVariant", variant_id],
		queryFn: async () => {
			const prodVariantsService = new ProductVariantsService(request);
			const result = await prodVariantsService.getVariantData(variant_id);
			return result;
		},
	});
};

export const variantConstraintsQuery = ({ request, product_id }: variantConstraintsQueryArgs) => {
	return queryOptions<VariantConstraintsData>({
		queryKey: ["variantConstraints", product_id],
		queryFn: async () => {
			const prodVariantsService = new ProductVariantsService(request);
			const result = await prodVariantsService.getConstaintsForVariantMutations(product_id);
			return result;
		},
	});
};

export const getSkusForCouponsQuery = ({ request }: getSkusForCouponsArgs) => {
	return queryOptions<VariantsForCouponsResp>({
		queryKey: ["skusForCoupons"],
		queryFn: async () => {
			const prodVariantsService = new ProductVariantsService(request);
			const result = await prodVariantsService.getSkusForCouponDiscountType();
			return result;
		},
	});
};
