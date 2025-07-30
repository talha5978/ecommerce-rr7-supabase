import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { ThemeToggleButton } from "~/components/Theme/theme-toggle";
import { usePageTitle } from "~/hooks/use-page-title";
import { UserButton } from "./nav-user";

export function SiteHeader() {
	const pageTitle = usePageTitle();

	return (
		<header className="flex h-[var(--header-spacing)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-spacing)]">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1 cursor-pointer" />
				<Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
				<span className="text-base font-medium">{pageTitle}</span>
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggleButton />
					<UserButton />
				</div>
			</div>
		</header>
	);
}
