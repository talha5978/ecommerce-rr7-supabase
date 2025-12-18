import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Fragment, memo, useMemo, useState } from "react";
import ImageViewer from "~/components/ImageViewer/image-viewer";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { Link } from "react-router";
import type { TopSellingProduct } from "@ecom/shared/types/admin-dashboard";

const TopSellingProductItem = ({
	p: { image_url, original_price, product_id, product_name, sku, stock },
}: {
	p: TopSellingProduct;
}) => {
	return (
		<div className="flex gap-4">
			<div>
				<ImageViewer
					imageUrl={`${SUPABASE_IMAGE_BUCKET_PATH}/${image_url}`}
					classNameThumbnailViewer="h-25 w-20 rounded-sm object-cover shadow-md"
				/>
			</div>
			<div>
				<Link to={`http://localhost:5173/product/${product_id}/knitted-polo-shirt`} target="_blank">
					<h3 className="hover:cursor-pointer underline-offset-4 hover:text-primary hover:underline mb-1">
						{product_name}
					</h3>
				</Link>
				<h4 className="text-sm">{sku}</h4>
				<p className={"text-sm text-muted-foreground"}>PKR {original_price}</p>
				<Badge className="mt-2" variant={stock > 0 ? "success" : "destructive"}>
					{stock > 0 ? "In Stock" : "Out of Stock"}
				</Badge>
			</div>
		</div>
	);
};

export const TopSellingProductsList = memo(({ products }: { products: TopSellingProduct[] }) => {
	const [showAll, setShowAll] = useState<boolean>(false);

	const displayedProducts = useMemo(() => (showAll ? products : products.slice(0, 6)), [showAll, products]);
	const hasMore = products.length > 6;

	return (
		<Card className="w-full">
			<CardHeader className="border-b py-2">
				<CardTitle>
					<h2>Top Selling Products</h2>
				</CardTitle>
				<CardDescription>Here are the top selling products for last 90 days</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 pt-4">
				<div className="grid grid-cols-2 gap-x-4 gap-y-5">
					{displayedProducts.map((prod) => (
						<Fragment key={prod.product_id}>
							<TopSellingProductItem p={prod} />
						</Fragment>
					))}
				</div>

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
