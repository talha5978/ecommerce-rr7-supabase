import { queryOptions } from "@tanstack/react-query";
import { ProductAttributesService } from "~/services/attributes.service";
import type { AllProductAttributesResponse, AttributeType, GetAllProductAttribsInput, HighLevelProductAttributesResponse, ProductAttributesResponse, SingleProductAttributeResponse } from "~/types/attributes";

type getProductAttributesByTypeArgs = { request: Request, attribute_type: AttributeType }

type getSingleProductAttributeByTypeArgs = { request: Request, attribute_id: string }

type getAllProductAttributesArgs = { request: Request, input?: GetAllProductAttribsInput };

export const highLevelProductAttributesQuery = ({ request }: { request: Request }) => {
	return queryOptions<HighLevelProductAttributesResponse>({
		queryKey: ["productAttributes"],
		queryFn: async () => {
			const attributesServ = new ProductAttributesService(request);
			const result = await attributesServ.getHighLevelProductAttributes();
			return result;
		},
	});
};

export const AllProductAttributesQuery = ({ request, input }: getAllProductAttributesArgs) => {
	return queryOptions<AllProductAttributesResponse>({
		queryKey: ["all_productAttributes", input],
		queryFn: async () => {
			const attributesServ = new ProductAttributesService(request);
			const result = await attributesServ.getAllProductAttributes(input as GetAllProductAttribsInput);
			return result;
		},
	});
};

export const productAttributesByTypeQuery = ({ request, attribute_type }: getProductAttributesByTypeArgs) => {
	return queryOptions<ProductAttributesResponse>({
		queryKey: ["productAttributesByType", attribute_type],
		queryFn: async () => {
			const attributesServ = new ProductAttributesService(request);
			const result = await attributesServ.getProductAttributes(attribute_type);
			return result;
		},
	});
};

export const singleProductAttributeByIdQuery = ({ request, attribute_id }: getSingleProductAttributeByTypeArgs) => {
	return queryOptions<SingleProductAttributeResponse>({
		queryKey: ["singleProductAttributesById", attribute_id],
		queryFn: async () => {
			const attributesServ = new ProductAttributesService(request);
			const result = await attributesServ.getSinlgeProductAttribute(attribute_id);
			return result;
		},
	});
};