import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { type Route } from "./+types/coupon-details";
import { fullCouponQuery } from "~/queries/coupons.q";
import { CouponDetails } from "~/components/Coupons/CouponDetails";
import type { GetFullCoupon } from "@ecom/shared/types/coupons";
import { Suspense } from "react";
import { Await } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const selectedCouponParam = params.couponId;
	const data = queryClient.fetchQuery(
		fullCouponQuery({
			request,
			coupon_id: Number(selectedCouponParam),
		}),
	);

	return {
		data,
	};
};

export default function CouponDetailsPage({ loaderData: { data } }: Route.ComponentProps) {
	return (
		<>
			<MetaDetails
				metaTitle={`Coupon Details | Admin Panel`}
				metaDescription="See all the related details for the coupon."
				metaKeywords="Coupons, Coupon, Coupon details"
			/>
			<Suspense fallback={<>Loading coupon data.......</>}>
				<Await resolve={data as Promise<GetFullCoupon>}>
					{(resolvedData: GetFullCoupon) => <CouponDetails data={resolvedData} />}
				</Await>
			</Suspense>
		</>
	);
}
