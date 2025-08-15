import { queryOptions } from "@tanstack/react-query";
import type { GetFullCoupon, GetHighLevelCouponsResp } from "@ecom/shared/types/coupons";
import { CouponsService } from "@ecom/shared/services/coupons.service";

interface highLvlCouponQArgs {
	request: Request;
	searchQuery: string;
	pageIndex?: number;
	pageSize?: number;
}

interface singleCouponQArgs {
	request: Request;
	coupon_id: number;
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

export const fullCouponQuery = ({ request, coupon_id }: singleCouponQArgs) => {
	return queryOptions<GetFullCoupon>({
		queryKey: ["single_coupon", coupon_id],
		queryFn: async () => {
			const couponsSvc = new CouponsService(request);
			const result = await couponsSvc.getSingleCouponDetails(coupon_id);
			return result;
		},
	});
};
