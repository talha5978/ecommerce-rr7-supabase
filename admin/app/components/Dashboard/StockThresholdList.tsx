import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { memo, useMemo, useState } from "react";
import ImageViewer from "~/components/ImageViewer/image-viewer";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { LowStockProduct } from "@ecom/shared/types/admin-dashboard";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

const StockThresholdTile = ({
	id,
	image_url,
	product_id,
	reorder_level,
	product_name,
	sku,
	stock,
}: LowStockProduct) => {
	return (
		<div className="flex justify-between items-center" key={product_id}>
			<div className="flex gap-4">
				<div>
					<ImageViewer
						imageUrl={`${SUPABASE_IMAGE_BUCKET_PATH}/${image_url}`}
						classNameThumbnailViewer="h-20 w-17 rounded-sm object-cover shadow-md"
					/>
				</div>
				<div>
					<div className="flex gap-2">
						<h3>{product_name}</h3>
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge variant={"outline"} className="hover:cursor-pointer">
									{reorder_level}
								</Badge>
							</TooltipTrigger>
							<TooltipContent side="bottom" align="center">
								Re-order Level
							</TooltipContent>
						</Tooltip>
					</div>
					<h4 className="text-sm">{sku}</h4>
					<p className="text-sm text-destructive mt-2">{stock} units available</p>
				</div>
			</div>
			<Link to={`/products/${product_id}/variants/${id}/update`}>
				<Button variant={"outline"}>
					<p>Update</p>
					<ArrowRight />
				</Button>
			</Link>
		</div>
	);
};

function getActiveStockProducts(products: LowStockProduct[]) {
	for (let i = 0; i < products.length; i++) {
		for (let j = i + 1; j < products.length; j++) {
			if (products[j].stock < products[i].stock) {
				[products[j], products[i]] = [products[i], products[j]];
			}
		}
	}

	return products.slice(0, 4);
}

export const StockThresholdList = memo(({ products }: { products: LowStockProduct[] }) => {
	const [showAll, setShowAll] = useState<boolean>(false);

	const displayedProducts = useMemo(
		() => (showAll ? products : getActiveStockProducts(products)),
		[showAll, products],
	);
	const hasMore = products.length > 4;

	return (
		<Card className="w-full">
			<CardHeader className="border-b py-2">
				<CardTitle>
					<h2>Stock Threshold</h2>
				</CardTitle>
				<CardDescription>
					Require you to update the products that are below the stock threshold
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 pt-4">
				{displayedProducts.length === 0 ? (
					<p className="text-center text-muted-foreground py-8">
						All products are sufficiently stocked!
					</p>
				) : (
					displayedProducts.map((product) => <StockThresholdTile key={product.id} {...product} />)
				)}
				{hasMore && (
					<div className="pt-4">
						<Button variant="outline" className="w-full" onClick={() => setShowAll(!showAll)}>
							{showAll ? "Show Less" : `Show All (${products.length})`}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
});
