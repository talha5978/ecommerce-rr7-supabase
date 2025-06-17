import { queryOptions } from "@tanstack/react-query";
import { ProductAttributesService } from "~/services/product-attributes.service";
import { AttributeType, GetAllProductAttributesResponse, ProductAttributesResponse, SingleProductAttributeResponse } from "~/types/product-attributes";

type getProductAttributesByTypeArgs = { request: Request, attribute_type: AttributeType }

type getSingleProductAttributeByTypeArgs = { request: Request, attribute_id: string }

export const productAttributesQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetAllProductAttributesResponse>({
		queryKey: ["productAttributes"],
		queryFn: async () => {
			const attributesServ = new ProductAttributesService(request);
			const result = await attributesServ.getAllProductAttributes();
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