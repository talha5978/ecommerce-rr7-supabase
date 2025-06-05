import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					cursor: "pointer",
				} as React.CSSProperties
			}
			closeButton={true}
			position="top-right"
			richColors
			swipeDirections={["right"]}
			visibleToasts={3}
			{...props}
		/>
	);
};

export { Toaster };
