import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { type Route } from "./+types/coupon-details";
import { fullCouponQuery } from "~/queries/coupons.q";
import { CouponDetailsDialog } from "~/components/Coupons/CouponDetailsDialog";
import type { GetFullCoupon } from "@ecom/shared/types/coupons";
import { Suspense, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Await, useNavigate, useParams } from "react-router";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";

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

export default function CouponDetails({ loaderData: { data } }: Route.ComponentProps) {
	const params = useParams();
	console.log(params);
	const navigate = useNavigate();
	const suppressNavigation = useSuppressTopLoadingBar();

	const closeDialog = useCallback(
		(open: boolean) => {
			if (!open) {
				suppressNavigation(() => {}).navigate("/coupons", { replace: true });
			}
		},
		[navigate],
	);

	return (
		<Dialog open onOpenChange={closeDialog}>
			<DialogContent className="sm:max-w-[calc(100%-10rem)] h-[80vh]">
				<DialogHeader>
					<DialogTitle>Coupon Details</DialogTitle>
					<DialogDescription>Select all the details related to this coupon.</DialogDescription>
				</DialogHeader>
				<div className="overflow-y-auto">
					<Suspense fallback={<>Loading.......</>}>
						<Await resolve={data as Promise<GetFullCoupon>}>
							{(resolvedData: GetFullCoupon) => <CouponDetailsDialog data={resolvedData} />}
						</Await>
					</Suspense>
				</div>
			</DialogContent>
		</Dialog>
	);
}
