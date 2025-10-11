import { cn } from "@ecom/shared/lib/utils";
import { AlertCircle } from "lucide-react";
import { memo } from "react";

interface StockDisplayProps {
	stock: number;
	isOutOfStock: boolean;
}

export const StockDisplay = memo(({ stock, isOutOfStock }: StockDisplayProps) => {
	let message = "";
	let colorClass = "";
	let iconColor = "";

	if (isOutOfStock || stock <= 0) {
		message = "Out of stock — check back soon!";
		colorClass = "text-destructive";
		iconColor = "text-destructive";
	} else if (stock > 0 && stock <= 5) {
		message = `Hurry up! Only ${stock} ${stock === 1 ? "unit" : "units"} left in stock!`;
		colorClass = "text-warning";
		iconColor = "text-warning";
	} else {
		message = `${stock} units available — order while it lasts!`;
		colorClass = "text-success";
		iconColor = "text-success";
	}

	return (
		<div className="flex items-center gap-2">
			<AlertCircle className={cn("w-4 h-4", iconColor)} />
			<p className={cn("text-sm font-medium", colorClass)}>{message}</p>
		</div>
	);
});
