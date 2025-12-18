import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const ReviewsSection = () => {
	return (
		<Card>
			<CardHeader className="border-b py-0">
				<CardTitle className="text-xl">
					<h2>Product Reviews</h2>
				</CardTitle>
			</CardHeader>
			<CardContent>{/* // Review List */}</CardContent>
		</Card>
	);
};
