import type { GetFullCoupon } from "@ecom/shared/types/coupons";
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "@ecom/shared/lib/utils";
import { DollarSignIcon, PercentIcon, TagIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import {
	discount_type_fields,
	getCouponStatus,
	getFullDateTimeFormat,
} from "@ecom/shared/constants/couponsConstants";
import StatusBadge from "~/components/status-badge";
import { Separator } from "~/components/ui/separator";
import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";
import { Label } from "~/components/ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { MetaDetails } from "~/components/SEO/MetaDetails";

interface CouponDetailsCardProps {
	data: GetFullCoupon;
	className?: string;
}

export const CouponDetails = memo(({ data, className }: CouponDetailsCardProps) => {
	const coupon = data.coupon;
	console.log(data);

	if (coupon == null || data.error != null) {
		return <p>No data</p>;
	}

	const {
		code,
		description,
		status,
		coupon_type,
		discount_type,
		discount_value,
		start_timestamp,
		end_timestamp,
		created_at,
		specific_products,
		customer_conditions,
		usage_conditions,
	} = coupon;

	const calculatedStatus = useMemo(
		() => getCouponStatus(start_timestamp, end_timestamp),
		[start_timestamp, end_timestamp],
	);

	const DiscountIcon = () => {
		switch (discount_type.toLowerCase()) {
			case "percentage_product":
			case "percentage_order":
				return <PercentIcon className="h-4 w-4 text-primary" />;
			case "fixed_order":
			case "fixed_product":
				return <DollarSignIcon className="h-4 w-4 text-primary" />;
			default:
				return <TagIcon className="h-4 w-4 text-primary" />;
		}
	};

	const generalItems = useMemo(
		() => [
			{ heading: "Coupon Type", value: coupon_type.charAt(0).toUpperCase() + coupon_type.slice(1) },
			{ heading: "Status", value: status ? "Active" : "Inactive" },
			{
				heading: "Discount Type",
				value: discount_type_fields.find((field) => field.value === discount_type)?.label || "N/A",
			},
			{
				heading: `Discount ${discount_type.includes("percentage") ? "percentage" : "value"}`,
				value: discount_value ? `${discount_value}` : "N/A",
			},
			{ heading: "Starts", value: getFullDateTimeFormat(start_timestamp) },
			{ heading: "Expires", value: getFullDateTimeFormat(end_timestamp) },
			{ heading: "Created at", value: created_at ? getFullDateTimeFormat(created_at) : "" },
		],
		[
			code,
			description,
			coupon_type,
			status,
			discount_type,
			discount_value,
			start_timestamp,
			end_timestamp,
			created_at,
		],
	);

	return (
		<>
			<MetaDetails
				metaTitle={`${code} Coupon Details | Admin Panel`}
				metaDescription={`${description!} See all the related details for the coupon.`}
				metaKeywords="Coupons, Coupon, Coupon details"
			/>
			<Breadcrumbs params={{ couponCode: code, couponType: coupon_type }} />
			<Card
				className={cn(
					"rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150",
					className,
				)}
			>
				<CardHeader className="border-b px-6 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-md">
								<DiscountIcon />
							</div>
							<div>
								<CardTitle className="text-xl font-semibold tracking-tight">{code}</CardTitle>
								<p className="text-sm">{description}</p>
							</div>
						</div>
						<StatusBadge
							variant={
								calculatedStatus === "Live"
									? "success"
									: calculatedStatus === "Expired"
										? "destructive"
										: "warning"
							}
							icon={
								calculatedStatus === "Live"
									? "tick"
									: calculatedStatus === "Expired"
										? "cross"
										: "dot"
							}
						>
							{calculatedStatus}
						</StatusBadge>
					</div>
				</CardHeader>
				<CardContent className="px-6 py-4 flex flex-col gap-6">
					{/* General Information */}
					<div>
						<h3 className="text-lg font-semibold mb-2">General</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
							{generalItems.map((item, index) => (
								<div key={index} className="flex flex-col">
									<span className="text-muted-foreground">{item.heading}</span>
									<span className="font-medium">{item.value}</span>
								</div>
							))}
						</div>
					</div>
					{/* Specific Products */}
					{specific_products != null && specific_products.length > 0 && (
						<SpecificProductsSection specific_products={specific_products} />
					)}
					<div className="flex gap-4 md:flex-row flex-col *:w-full">
						{/* Customer Conditions */}
						<Card className="flex gap-4 flex-col rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150">
							<CardHeader>Customer Conditions</CardHeader>
							<Separator />
							<CardContent>
								<div className="flex flex-col gap-4 text-sm">
									<p>
										<span className="font-medium">Customer Group:</span>{" "}
										<span className="capitalize">
											{customer_conditions.customer_group || "N/A"}
										</span>
									</p>
									<p>
										<span className="font-medium">Min Purchased Amount:</span>{" "}
										{customer_conditions.min_purchased_amount || "N/A"}
									</p>
									<div className="flex gap-1 flex-col">
										<span className="font-medium">Customer Emails:</span>{" "}
										{customer_conditions.customer_emails.length > 0 ? (
											<div className="flex gap-2 flex-wrap">
												{customer_conditions.customer_emails.map((email, index) => (
													<a
														key={index}
														href={`mailto:${email}`}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1.5 rounded border bg-transparent px-2.5 text-sm focus:outline-hidden"
													>
														{email}
													</a>
												))}
											</div>
										) : (
											<span>None</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
						{/* Usage Conditions */}
						<Card className="flex gap-4 flex-col rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150">
							<CardHeader>Usage Conditions</CardHeader>
							<Separator />
							<CardContent>
								<div className="flex flex-col gap-4 text-sm">
									<p>
										<span className="font-medium">Max Total Uses:</span>{" "}
										{usage_conditions.max_total_uses || "Unlimited"}
									</p>
									<p>
										<span className="font-medium">One Use/Customer:</span>{" "}
										{usage_conditions.one_use_per_customer ? "Yes" : "No"}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-4 border-t">
						<Link to={"/coupons"} viewTransition prefetch="intent">
							<Button variant="outline">Go Back</Button>
						</Link>
						<Button>Edit</Button>
					</div>
				</CardContent>
			</Card>
		</>
	);
});

const SpecificProductsSection = memo(
	({
		specific_products,
	}: {
		specific_products: {
			id: string;
			sku: string;
			cover_image?: string;
		}[];
	}) => {
		return (
			<Card className="flex gap-4 flex-col rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150">
				<CardHeader>Specific Products</CardHeader>
				<Separator />
				<CardContent className="grid gap-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
					{specific_products.map((item) => (
						<HoverCard key={item.id}>
							<HoverCardTrigger asChild>
								<Label
									key={item.id}
									htmlFor={item.id}
									className={cn(
										"flex items-center justify-center px-4 py-2 bg-accent rounded-md cursor-pointer hover:underline underline-offset-4",
									)}
								>
									<p>{item.sku}</p>
								</Label>
							</HoverCardTrigger>
							<HoverCardContent className="w-fit">
								<div className="flex gap-2 flex-col items-center justify-center">
									<img
										src={SUPABASE_IMAGE_BUCKET_PATH + item.cover_image}
										alt={item.sku + " cover image"}
										className="object-cover h-40 rounded-md"
									/>
									<h4 className="text-xs font-semibold text-muted-foreground">
										{item.sku}
									</h4>
								</div>
							</HoverCardContent>
						</HoverCard>
					))}
				</CardContent>
			</Card>
		);
	},
);
