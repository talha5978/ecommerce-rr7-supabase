import { queryOptions } from "@tanstack/react-query";
import { FP_CollectionsService } from "@ecom/shared/services/collections.service";
import type { FP_HomeCollectionsResp } from "@ecom/shared/types/collections";

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
