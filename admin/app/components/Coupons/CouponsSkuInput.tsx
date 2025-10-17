import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "@ecom/shared/lib/utils";
import type { CouponMutationVariant } from "@ecom/shared/types/product-variants";
import { Button } from "~/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";

type CouponsSkuInputProps = {
	skus: CouponMutationVariant[];
	value: string[]; // Array of selected SKU IDs
	onValueChange: (value: string[]) => void;
	height?: string;
	className?: string;
};

export const CouponsSkuInput = memo(
	({ skus, value, onValueChange, height = "12rem", className = "" }: CouponsSkuInputProps) => {
		const [isExpanded, setIsExpanded] = useState<boolean>(false);
		const [contentHeight, setContentHeight] = useState<number>(0);
		const contentRef = useRef<HTMLDivElement>(null);

		const collapsedHeightPx = useMemo(() => parseFloat(height) * 16, [height]);

		useEffect(() => {
			if (contentRef.current) {
				setContentHeight(contentRef.current.scrollHeight);
			}
		}, [skus]); // Re-measure if skus change

		const handleChange = (skuId: string) => {
			const newValue = value.includes(skuId) ? value.filter((id) => id !== skuId) : [...value, skuId];
			onValueChange(newValue);
		};

		// Determine if content exceeds collapsed height
		const needsExpansion = useMemo(
			() => contentHeight > collapsedHeightPx,
			[contentHeight, collapsedHeightPx],
		);

		return (
			<section className={cn("w-full flex flex-col gap-4", className)}>
				<div className="flex justify-between flex-wrap gap-2">
					<Label className="text-md font-semiboldblock">Select SKUs</Label>
					<div>
						<p className="text-muted-foreground">{value.length} SKUs selected</p>
					</div>
				</div>
				<div className={cn("w-full border px-2 pt-2 pb-3 rounded-lg shadow-sm", className)}>
					<div className="relative overflow-hidden">
						<div
							ref={contentRef}
							id="sku-content"
							className={cn(
								"transition-all duration-300 ease-in-out",
								needsExpansion ? "overflow-hidden" : "overflow-visible",
							)}
							style={{
								height: needsExpansion
									? isExpanded
										? `${contentHeight}px`
										: height
									: "auto",
							}}
						>
							<div className="grid gap-4 px-1 pt-1 pb-3 md:grid-cols-4 sm:grid-cols-2 grid-cols-1">
								{skus.map((item) => (
									<HoverCard key={item.id}>
										<HoverCardTrigger asChild>
											<Label
												key={item.id}
												htmlFor={item.id}
												className={cn(
													"flex items-center justify-center px-4 py-2 bg-accent rounded-md cursor-pointer transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-ring hover:underline underline-offset-4",
													value.includes(item.id) && "outline-2 outline-primary ",
												)}
											>
												<Checkbox
													checked={value.includes(item.id)}
													onCheckedChange={() => handleChange(item.id)}
													id={item.id}
													className="mr-2"
													hidden
												/>
												<p>{item.value}</p>
											</Label>
										</HoverCardTrigger>
										<HoverCardContent className="w-fit">
											<div className="flex gap-2 flex-col items-center justify-center">
												<img
													src={SUPABASE_IMAGE_BUCKET_PATH + item.cover_image}
													alt={item.value + " cover image"}
													className="object-cover h-40 rounded-md"
												/>
												<h4 className="text-xs font-semibold text-muted-foreground">
													{item.value}
												</h4>
											</div>
										</HoverCardContent>
									</HoverCard>
								))}
							</div>
						</div>
						{needsExpansion && (
							<>
								<div
									data-expanded={isExpanded}
									className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background dark:from-zinc-800/50 to-transparent pointer-events-none data-[expanded=true]:opacity-0 transition-opacity duration-300 ease-in-out"
									aria-hidden={isExpanded ? "true" : "false"}
								/>
								<div
									className={cn(
										"mx-auto bg-inherit dark:bg-inherit text-center",
										isExpanded ? "pt-4" : "absolute bottom-2 inset-x-0",
									)}
								>
									<Button
										variant={"link"}
										onClick={() => setIsExpanded(!isExpanded)}
										role="button"
										type="button"
										className={cn("relative")}
										aria-expanded={isExpanded}
										aria-controls="sku-content"
									>
										{isExpanded ? "Collapse" : "Expand"}
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			</section>
		);
	},
);
