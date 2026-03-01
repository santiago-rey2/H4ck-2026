import { Outlet } from "react-router-dom";
import { LeftFiltersSidebar } from "@/app/components/LeftFiltersSidebar";
import { PageTransition } from "@/app/components/PageTransition";
import { RightWorkbenchSidebar } from "@/app/components/RightWorkbenchSidebar";

interface DesktopLayoutProps {
	routeKey: string;
}

export function DesktopLayout({ routeKey }: DesktopLayoutProps) {
	return (
		<div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
			<div className="grid h-full grid-cols-[20rem_minmax(0,1fr)_24rem]">
				<aside className="min-h-0 overflow-hidden">
					<LeftFiltersSidebar />
				</aside>

				<main className="min-h-0 overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
					<PageTransition pageKey={routeKey}>
						<Outlet />
					</PageTransition>
				</main>

				<aside className="min-h-0 overflow-hidden">
					<RightWorkbenchSidebar />
				</aside>
			</div>
		</div>
	);
}
