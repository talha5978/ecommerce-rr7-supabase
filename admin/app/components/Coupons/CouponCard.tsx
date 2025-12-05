import { type JSX, memo, useContext, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { GiftIcon, ListMinus, Pencil, PlusCircle, ZapIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { motion } from "motion/react";
import { CouponsPageCtx } from "~/components/Coupons/MainCouponsContext";
import type { HighLevelCoupon } from "@ecom/shared/types/coupons";
import { cn } from "@ecom/shared/lib/utils";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import { getCouponStatus } from "@ecom/shared/constants/couponsConstants";

interface Props {
	coupon: HighLevelCoupon;
	className?: string;
}

const formatDate = (date: string | null) => {
	return date ? format(new Date(date), "PPP") : "-";
};

const createdAtLabel = (date: string | null) => {
	return date ? `${formatDistanceToNow(new Date(date), { addSuffix: true })}` : "-";
};

const SeeDetailsButton = ({ couponId }: { couponId: number }) => {
	if (!couponId) {
		return (
			<button
				type="button"
				className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition"
				disabled
			>
				<ListMinus className="h-4 w-4" />
				See details
			</button>
		);
	}

	const suppressNavigation = useSuppressTopLoadingBar();
	const handleSeeDetailsClick = (id: number) => {
		suppressNavigation(() => {}).navigate(`coupon/${id}`);
	};

	return (
		<button
			type="button"
			className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none"
			onClick={() => handleSeeDetailsClick(Number(couponId))}
		>
			<ListMinus className="h-4 w-4" />
			See details
		</button>
	);
};

const BodyItem = memo(({ value, heading, ...props }: { value: JSX.Element | string; heading: string }) => {
	return (
		<div className="flex flex-col" {...props}>
			<span className="text-xs font-medium text-muted-foreground">{heading}</span>
			<span className="mt-1 font-medium">{value}</span>
		</div>
	);
});

export const CouponCard = memo(({ coupon, className = "", ...props }: Props) => {
	const { id, code, status, coupon_type: couponType, start_timestamp, end_timestamp, created_at } = coupon;

	const isManual = couponType === "manual";

	const calculatedStatus = useMemo(
		() => getCouponStatus(start_timestamp, end_timestamp),
		[start_timestamp, end_timestamp],
	);

	const BodyItems = useMemo(
		() => [
			{
				heading: "Starts",
				value: formatDate(start_timestamp),
			},
			{
				heading: "Expires",
				value: formatDate(end_timestamp),
			},
			{
				heading: "Created",
				value: createdAtLabel(created_at),
			},
			{
				heading: "Usage",
				value: "N/A",
			},
		],
		[start_timestamp, end_timestamp, created_at],
	);

	return (
		<Card
			className={cn(
				"rounded-2xl transition-colors duration-150 border shadow-sm hover:shadow-lg",
				className,
			)}
			id={`coupon-card-${id}`}
			{...props}
		>
			<CardHeader className="border-b px-5 flex flex-col gap-3">
				<div className="flex justify-between w-full">
					<Button
						variant={"outline"}
						size={"icon"}
						tabIndex={-1}
						className="pointer-events-none **:text-primary"
					>
						{isManual ? <GiftIcon /> : <ZapIcon />}
					</Button>
					<div>
						<p
							className={`text-sm ${
								calculatedStatus === "Live"
									? "text-success"
									: calculatedStatus === "Expired"
										? "text-destructive"
										: "text-warning"
							}`}
						>
							{calculatedStatus}
						</p>
					</div>
				</div>
				<div className="w-full flex flex-col gap-1">
					<div className="flex justify-between gap-2">
						<CardTitle className="text-lg font-semibold tracking-tight">{code}</CardTitle>
						<div>
							<Badge variant={status ? "success" : "destructive"} className={`capitalize `}>
								{status ? "Active" : "Inactive"}
							</Badge>
						</div>
					</div>
					<div className="text-sm text-muted-foreground">
						<span className="capitalize">{couponType} Coupon</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-5 flex flex-col gap-6 justify-between h-full">
				<div className="grid grid-cols-2 gap-4 text-sm">
					{BodyItems.map((item, index) => (
						<BodyItem key={index} {...item} />
					))}
				</div>

				{/* Small footer / Some actions.. */}
				<div className="flex items-center flex-wrap gap-2 flex-row  justify-between">
					<div className="text-xs text-muted-foreground">Quick actions</div>
					<div className="flex items-center gap-2 *:cursor-pointer">
						<SeeDetailsButton couponId={id} />
						<button
							type="button"
							className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:opacity-90 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none"
						>
							<Pencil className="h-3 w-3" />
							Edit
						</button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

const CardSkeleton = memo(({ className = "" }: { className?: string }) => {
	const BodyItems = useMemo(
		() => [
			{
				heading: "Starts",
				value: <Skeleton className="h-3 w-full md:w-[95%] lg:w-[90%] xl:w-[85%]" />,
			},
			{
				heading: "Expires",
				value: <Skeleton className="h-3 w-full md:w-[95%] lg:w-[90%] xl:w-[85%]" />,
			},
			{
				heading: "Created",
				value: <Skeleton className="h-3 w-full md:w-[90%] lg:w-[90%] xl:w-[85%]" />,
			},
			{
				heading: "Usage",
				value: <Skeleton className="h-3 w-full md:w-[60%] lg:w-[50%] xl:w-[50%]" />,
			},
		],
		[],
	);

	return (
		<Card
			className={cn(
				"rounded-2xl transition-colors duration-150 border shadow-sm hover:shadow-lg",
				className,
			)}
		>
			<CardHeader className="border-b px-5 flex flex-col gap-3">
				<div className="flex justify-between w-full">
					<Button
						variant={"outline"}
						size={"icon"}
						tabIndex={-1}
						className="pointer-events-none **:text-primary"
					>
						<Skeleton className={"size-4"} />
					</Button>
					<div>
						<Skeleton className="w-12 h-4" />
					</div>
				</div>
				<div className="w-full flex flex-col gap-3 mt-2">
					<div className="flex justify-between gap-2">
						<CardTitle className="text-lg font-semibold tracking-tight">
							<Skeleton className="w-32 h-6" />
						</CardTitle>
						<div className="flex flex-col items-end gap-2">
							<Skeleton className="w-20 h-4" />
						</div>
					</div>
					<div className="text-sm text-muted-foreground">
						<span className="capitalize">
							<Skeleton className="w-20 h-4" />
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-5 flex flex-col gap-6">
				<div className="grid grid-cols-2 gap-4 text-sm">
					{BodyItems.map((item, index) => (
						<BodyItem key={index} heading={item.heading} value={item.value as JSX.Element} />
					))}
				</div>

				{/* Small footer / Some actions.. */}
				<div className="flex xl:items-center xl:gap-1 gap-2 xl:flex-row flex-col justify-between">
					<div className="text-xs text-muted-foreground">Quick actions</div>
					<div className="flex items-center gap-2 *:cursor-pointer">
						<Skeleton className="rounded-md w-[75px] h-[20px]" />
						<Skeleton className="rounded-md w-[63px] h-[20px]" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

export const CouponCardSkeleton = memo(
	({ cards = 4, className = "" }: { className?: string; cards?: number }) => {
		return (
			<motion.ul
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="grid grid-cols-12 gap-4"
			>
				{Array.from({ length: cards }).map((_, index) => (
					<li
						key={index}
						className="col-span-12 min-[520px]:col-span-6 min-[850px]:col-span-4 min-[1200px]:col-span-3"
					>
						<CardSkeleton className={className} />
					</li>
				))}
			</motion.ul>
		);
	},
);

export const CreateNewCouponCard = memo(() => {
	const { setCouponTypeDialogState } = useContext(CouponsPageCtx);

	return (
		<Card
			className={
				"rounded-2xl transition-colors duration-300 border border-dashed border-primary bg-primary/10 shadow-sm h-full hover:shadow-lg hover:bg-primary/15 cursor-pointer select-none"
			}
			onClick={() => setCouponTypeDialogState(true)}
		>
			<CardContent className="px-5 flex items-center justify-center gap-6 h-full flex-1">
				<div className="text-sm text-muted-foreground flex items-center justify-center flex-col gap-1">
					<PlusCircle className="h-5 w-5" />
					Create new coupon
				</div>
			</CardContent>
		</Card>
	);
});
