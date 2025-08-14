import { queryOptions } from "@tanstack/react-query";
import { type GetHighLevelCouponsResp } from "@ecom/shared/types/coupons";
import { CouponsService } from "@ecom/shared/services/coupons.service";

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
