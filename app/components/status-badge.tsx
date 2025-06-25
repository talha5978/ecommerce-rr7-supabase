import { Check, Dot, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";

type StatusBadgeVariantsProps = "default" | "success" | "warning" | "destructive";
type StatusBadgeIconsProps = "dot" | "tick" | "cross";

interface StatusBadgeProps {
	variant: StatusBadgeVariantsProps;
	children: React.ReactNode;
	icon: StatusBadgeIconsProps;
}

const StatusIcon = ({ className, iconType = "dot" }: { className?: string, iconType?: StatusBadgeIconsProps }) => {
	if (iconType === "tick") {
		return <Check strokeWidth={4} className="!size-3"/>;
	} else if (iconType === "dot") {
		return <Dot className={`mr-2 rounded-full !size-[7px] ${className}`}/>;
	} else {
		return <X strokeWidth={4} className="!size-3"/>;
	}

};

const StatusBadge = ({ variant, children, icon = "dot" }: StatusBadgeProps) => {
	if (variant === "default") {
		return (
			<Badge className="bg-muted-foreground/10 dark:bg-muted-foreground/20 hover:bg-muted-foreground/10 text-muted-foreground shadow-none rounded-full">
				<StatusIcon className="bg-muted-foreground" iconType={icon} /> {children}
			</Badge>
		)
	} else if (variant === "success") {
		return (
			<Badge className="bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-green-500 shadow-none rounded-full">
				<StatusIcon className="bg-green-500" iconType={icon} /> {children}
			</Badge>
		)
	} else if (variant === "destructive") {
		return (
			<Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-destructive shadow-none rounded-full">
				<StatusIcon className="bg-destructive" iconType={icon} /> {children}
			</Badge>
		)
	} else if (variant === "warning") {
		return (
			<Badge className="bg-yellow-600/10 dark:bg-yellow-600/20 hover:bg-yellow-600/10 text-yellow-500 shadow-none rounded-full">
				<StatusIcon className="bg-yellow-500" iconType={icon} /> {children}
			</Badge>
		)
	}
};

export default StatusBadge