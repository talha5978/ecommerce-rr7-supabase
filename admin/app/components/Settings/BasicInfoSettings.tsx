import { BrickWall, Info, ReceiptText } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Label } from "~/components/ui/label";
import { businessDetails } from "@ecom/shared/constants/business-details";

const BasicInfoSettings = () => {
	return (
		<Card className="pb-10">
			<CardContent>
				<div className="flex gap-4">
					<span className="bg-accent p-2 rounded-full self-center">
						<Info className="h-5 w-5" />
					</span>
					<div className="flex-1 space-y-1">
						<h2 className="font-semibold">Basic information</h2>
						<p className="text-sm text-muted-foreground">
							Will be used everywhere across the application
						</p>
					</div>
				</div>
			</CardContent>
			<Separator />
			<CardContent className="space-y-4">
				<div className="flex gap-4 md:flex-row flex-col *:flex-1">
					<div>
						<div className="flex gap-4">
							<span className="bg-accent p-2 rounded-full self-center">
								<ReceiptText className="h-5 w-5" />
							</span>
							<div className="space-y-1">
								<Label className="text-muted-foreground">Business Name</Label>
								<p className="text-sm">{businessDetails.business_name}</p>
							</div>
						</div>
					</div>
					<div>
						<div className="flex gap-4">
							<span className="bg-accent p-2 rounded-full self-center">
								<BrickWall className="h-5 w-5" />
							</span>
							<div className="space-y-1">
								<Label className="text-muted-foreground">Industry</Label>
								<p className="text-sm">{businessDetails.industry}</p>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default BasicInfoSettings;
