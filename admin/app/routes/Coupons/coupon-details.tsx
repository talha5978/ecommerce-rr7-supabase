import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { type Route } from "./+types/coupon-details";
import { fullCouponQuery } from "~/queries/coupons.q";
import { CouponDetails } from "~/components/Coupons/CouponDetails";
import type { GetFullCoupon } from "@ecom/shared/types/coupons";
import { memo, Suspense } from "react";
import { Await } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { cn } from "@ecom/shared/lib/utils";

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
			<Suspense fallback={<CouponDetailsSkeleton />}>
				<Await resolve={data as Promise<GetFullCoupon>}>
					{(resolvedData: GetFullCoupon) => <CouponDetails data={resolvedData} />}
				</Await>
			</Suspense>
		</>
	);
}

export const CouponDetailsSkeleton = memo(({ className }: { className?: string }) => {
	return (
		<>
			<Breadcrumbs params={{ couponCode: "", couponType: "" }} />
			<Card
				className={cn(
					"rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150",
					className,
				)}
			>
				<CardHeader className="border-b px-6 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-md" />
							<div className="flex flex-col gap-2">
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-4 w-48" />
							</div>
						</div>
						<Skeleton className="h-6 w-20 rounded-full" />
					</div>
				</CardHeader>
				<CardContent className="px-6 py-4 flex flex-col gap-6">
					{/* General Information */}
					<div>
						<Skeleton className="h-6 w-24 mb-2" />
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{[...Array(7)].map((_, index) => (
								<div key={index} className="flex flex-col gap-1">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-32" />
								</div>
							))}
						</div>
					</div>
					{/* Specific Products */}
					<Card className="flex gap-4 flex-col rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150">
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<Separator />
						<CardContent className="grid gap-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
							{[...Array(3)].map((_, index) => (
								<Skeleton key={index} className="h-10 w-full rounded-md" />
							))}
						</CardContent>
					</Card>
					<div className="flex gap-4 md:flex-row flex-col *:w-full">
						{/* Customer Conditions */}
						<Card className="flex gap-4 flex-col rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150">
							<CardHeader>
								<Skeleton className="h-6 w-36" />
							</CardHeader>
							<Separator />
							<CardContent>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-1">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
									<div className="flex flex-col gap-1">
										<Skeleton className="h-4 w-28" />
										<Skeleton className="h-4 w-32" />
									</div>
									<div className="flex flex-col gap-1">
										<Skeleton className="h-4 w-24" />
										<div className="flex gap-2 flex-wrap">
											{[...Array(2)].map((_, index) => (
												<Skeleton key={index} className="h-6 w-40 rounded" />
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
						{/* Usage Conditions */}
						<Card className="flex gap-4 flex-col rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150">
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<Separator />
							<CardContent>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-1">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
									<div className="flex flex-col gap-1">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-4 border-t">
						<Skeleton className="h-10 w-24 rounded-md" />
						<Skeleton className="h-10 w-24 rounded-md" />
					</div>
				</CardContent>
			</Card>
		</>
	);
});
