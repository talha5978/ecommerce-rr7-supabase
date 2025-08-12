import { queryOptions } from "@tanstack/react-query";
import { CouponsService } from "~/services/coupons.service";
import type { GetHighLevelCouponsResp } from "~/types/coupons";

interface highLvlCouponQArgs {
	request: Request;
	searchQuery: string;
	pageIndex?: number;
	pageSize?: number;
}

export const highLevelCouponsQuery = ({ request, searchQuery, pageIndex, pageSize }: highLvlCouponQArgs) => {
	return queryOptions<GetHighLevelCouponsResp>({
		queryKey: ["high_lvl_coupons", searchQuery, pageIndex, pageSize],
		queryFn: async () => {
			const couponsSvc = new CouponsService(request);
			const result = await couponsSvc.getHighLevelCoupons({
				searchQuery,
				pageIndex,
				pageSize,
			});
			return result;
		},
	});
};
