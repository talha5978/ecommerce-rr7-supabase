import { queryOptions } from "@tanstack/react-query";
import { FP_CouponsService } from "@ecom/shared/services/coupons.service";
import type { FP_GetAllCouponsDetailsResp } from "@ecom/shared/types/coupons";

interface GetAllCouponsDetailsResp {
	request: Request;
}

export const get_FP_allCoupons = ({ request }: GetAllCouponsDetailsResp) => {
	return queryOptions<FP_GetAllCouponsDetailsResp>({
		queryKey: ["fp_all_coupons"],
		queryFn: async () => {
			const couponsSvc = new FP_CouponsService(request);
			const result = await couponsSvc.getAllFullCoupons();
			return result;
		},
	});
};
