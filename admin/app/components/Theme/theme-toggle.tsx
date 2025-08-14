import { Moon, Sun } from "lucide-react";
import { useTheme } from "~/components/Theme/theme-provder";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const Themes = ["light", "dark", "system"] as const;

export function ThemeToggleButton() {
	const { setTheme, theme: currentTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" className="cursor-pointer">
					<Sun className="h-[1rem] w-[1rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon className="absolute h-[1rem] w-[1rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{Themes.map((theme: (typeof Themes)[number], index) => (
					<DropdownMenuCheckboxItem
						key={theme + index}
						onCheckedChange={() => setTheme(theme)}
						checked={theme === currentTheme}
					>
						{theme.charAt(0).toUpperCase() + String(theme).slice(1)}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
