import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "light" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast: "!rounded-xs",
				},
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					cursor: "pointer",
				} as React.CSSProperties
			}
			closeButton={false}
			position="top-center"
			richColors
			duration={3000}
			swipeDirections={["top"]}
			visibleToasts={4}
			{...props}
		/>
	);
};

export { Toaster };
