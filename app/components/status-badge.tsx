import { Badge } from "~/components/ui/badge";

type StatusBadgeVariantsProps = "default" | "success" | "warning" | "destructive";

const StatusBadge = ({ variant, children }: { variant: StatusBadgeVariantsProps; children: React.ReactNode }) => {
	if (variant === "default") {
		return (
			<Badge className="bg-muted-foreground/10 dark:bg-muted-foreground/20 hover:bg-muted-foreground/10 text-muted-foreground shadow-none rounded-full">
				<div className="h-1.5 w-1.5 rounded-full bg-muted-foreground mr-2" /> {children}
			</Badge>
		)
	} else if (variant === "success") {
		return (
			<Badge className="bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-green-500 shadow-none rounded-full">
				<div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2" /> {children}
			</Badge>
		)
	} else if (variant === "destructive") {
		return (
			<Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-destructive shadow-none rounded-full">
				<div className="h-1.5 w-1.5 rounded-full bg-destructive mr-2" /> {children}
			</Badge>
		)
	} else if (variant === "warning") {
		return (
			<Badge className="bg-yellow-600/10 dark:bg-yellow-600/20 hover:bg-yellow-600/10 text-yellow-500 shadow-none rounded-full">
				<div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-2" /> {children}
			</Badge>
		)
	}
};

export default StatusBadge