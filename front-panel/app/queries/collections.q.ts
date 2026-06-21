import { queryOptions } from "@tanstack/react-query";
import { FP_CollectionsService } from "@ecom/shared/services/collections.service";
import type { FP_CollectionDetails, FP_HomeCollectionsResp } from "@ecom/shared/types/collections";
import type { FP_Search_Filters } from "@ecom/shared/types/products";
import { FP_ProductsService } from "@ecom/shared/services/products.service";
import { sortProductSizes } from "~/utils/sortSizes";

interface homeCollectionsArgs {
	request: Request;
}

export const getAllFPCollections = ({ request }: homeCollectionsArgs) => {
	return queryOptions<FP_HomeCollectionsResp>({
		queryKey: ["fp_collections"],
		queryFn: async () => {
			const prodSvc = new FP_CollectionsService(request);
			const result = await prodSvc.getAllHomeCollections();
			return result;
		},
	});
};

export const getCollectionDetails = ({
	request,
	filters,
	pageIndex = 0,
	pageSize = 24,
	collection_id,
}: {
	request: Request;
	filters: FP_Search_Filters;
	pageIndex?: number;
	pageSize?: number;
	collection_id: string;
}) => {
	return queryOptions<FP_CollectionDetails>({
		queryKey: ["fp_collection_details", collection_id, filters, pageIndex, pageSize],
		queryFn: async () => {
			const prodSvc = new FP_ProductsService(request);
			const productsResp = await prodSvc.getProductsByCollection(
				collection_id,
				pageIndex,
				pageSize,
				filters,
			);
			productsResp.products?.map((product) => {
				if (product.available_sizes != null && product.available_sizes.length > 0) {
					product.available_sizes = sortProductSizes(product.available_sizes);
				}
			});

			const collectionSvc = new FP_CollectionsService(request);
			const collectionResp = await collectionSvc.getFullCollection(collection_id);

			const result = {
				collection: collectionResp.collection,
				products: productsResp,
			};

			return result;
		},
	});
};
