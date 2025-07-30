import { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Check, X } from "lucide-react";
import { IconPointFilled } from "@tabler/icons-react";

const Default_Icon = "dot";

const statusBadgeVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-medium transition-all",
	{
		variants: {
			variant: {
				default:
					"bg-muted-foreground/10 dark:bg-muted-foreground/20 text-muted-foreground shadow-none",
				success: "bg-emerald-600/30 dark:bg-emerald-600/40 text-primary-foreground shadow-none",
				destructive: "bg-red-600/30 dark:bg-red-600/40 text-primary-foreground shadow-none",
				warning: "bg-yellow-600/30 dark:bg-yellow-600/30 text-primary-foreground shadow-none",
			},
			icon: {
				dot: "text-muted-foreground dark:text-muted-foreground",
				tick: "text-green-500",
				cross: "text-destructive",
			},
		},
		defaultVariants: {
			variant: "default",
			icon: Default_Icon,
		},
	},
);

interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusBadgeVariants> {
	variant: "default" | "success" | "destructive" | "warning";
	icon?: "dot" | "tick" | "cross";
}

const StatusBadge = ({ className, variant, icon = Default_Icon, children, ...props }: StatusBadgeProps) => {
	const iconType = icon;
	const iconClassName = statusBadgeVariants({ variant, icon: iconType });

	return (
		<Badge className={cn(statusBadgeVariants({ variant, className }))} {...props}>
			{iconType === "tick" ? (
				<Check strokeWidth={4} className="!size-3" />
			) : iconType === "dot" ? (
				<IconPointFilled className={`${iconClassName}`} />
			) : (
				<X strokeWidth={4} className="!size-3" />
			)}
			{children}
		</Badge>
	);
};

export default StatusBadge;
