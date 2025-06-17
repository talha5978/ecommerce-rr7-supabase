import { AppSidebar } from "~/components/Nav/app-sidebar";
import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { SectionCards } from "~/components/section-cards";
import { SiteHeader } from "~/components/Nav/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import data from "../../dashboard/data.json";
import { ThemeProvider } from "~/components/Theme/theme-provder";
import { useIsMobile } from "~/hooks/use-mobile";
import { AlertCircle } from "lucide-react";

const WarningBarForMobile = () => {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<div className="z-50 w-full bg-destructive px-4 py-3 text-center text-sm font-medium text-white">
				<div className="flex items-center justify-center gap-2 max-[435px]:flex-col">
					<span>
						<AlertCircle className="h-4 w-4"/>
					</span>
					<span>Please switch to larger screen for a better experience</span>
				</div>
			</div>
		)
	}
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<SidebarProvider
				style={
					{
						"--sidebar-width": "calc(var(--spacing) * 72)",
						"--header-height": "calc(var(--spacing) * 12)",
					} as React.CSSProperties
				}
			>
				<AppSidebar variant="inset" />
				<SidebarInset>
					<SiteHeader />
					<section className="flex flex-1 flex-col @container/main p-4">
						{children}

						{/* ----- Prefilled data template from shadcn UI ---- */}

						{/* <div className="flex flex-1 flex-col">
							<div className="@container/main flex flex-1 flex-col gap-2">
								<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
									<SectionCards />
									<div className="px-4 lg:px-6">
										<ChartAreaInteractive />
									</div>
									<DataTable data={data} />
								</div>
							</div>
						</div> */}
					</section>
					<WarningBarForMobile />
				</SidebarInset>
			</SidebarProvider>
		</ThemeProvider>
	);
}


