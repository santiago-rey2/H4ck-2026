import { Home, PanelLeft, PanelRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Outlet } from "react-router-dom";
import type { MobileActiveView } from "@/app/atoms";
import { LeftFiltersSidebar } from "@/app/components/LeftFiltersSidebar";
import { PageTransition } from "@/app/components/PageTransition";
import { RightWorkbenchSidebar } from "@/app/components/RightWorkbenchSidebar";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getViewSwitchVariants } from "@/app/motion/variants";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
	routeKey: string;
	mobileView: MobileActiveView;
	onViewChange: (nextView: MobileActiveView) => void;
}

export function MobileLayout({
	routeKey,
	mobileView,
	onViewChange,
}: MobileLayoutProps) {
	const { prefersReducedMotion } = useMotionPreferences();
	const viewSwitchVariants = getViewSwitchVariants(prefersReducedMotion);

	return (
		<div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
			<div className="flex h-full flex-col">
				<div className="min-h-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={mobileView}
							variants={viewSwitchVariants}
							initial="initial"
							animate="animate"
							exit="exit"
							className="h-full"
						>
							{mobileView === "home" ? (
								<main className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
									<PageTransition pageKey={routeKey}>
										<Outlet />
									</PageTransition>
								</main>
							) : null}

							{mobileView === "filters" ? (
								<div className="h-full">
									<LeftFiltersSidebar className="border-r-0" />
								</div>
							) : null}

							{mobileView === "panel" ? (
								<div className="h-full">
									<RightWorkbenchSidebar className="border-l-0" />
								</div>
							) : null}
						</motion.div>
					</AnimatePresence>
				</div>

				<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
					<div className="grid grid-cols-3 gap-1 p-2">
						<button
							type="button"
							onClick={() => onViewChange("filters")}
							className={cn(
								"flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors",
								mobileView === "filters"
									? "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
									: "text-slate-600 dark:text-slate-300",
							)}
						>
							<PanelLeft className="h-4 w-4" />
							Filtros
						</button>

						<button
							type="button"
							onClick={() => onViewChange("home")}
							className={cn(
								"flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors",
								mobileView === "home"
									? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200"
									: "text-slate-600 dark:text-slate-300",
							)}
						>
							<Home className="h-4 w-4" />
							Inicio
						</button>

						<button
							type="button"
							onClick={() => onViewChange("panel")}
							className={cn(
								"flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors",
								mobileView === "panel"
									? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
									: "text-slate-600 dark:text-slate-300",
							)}
						>
							<PanelRight className="h-4 w-4" />
							Panel
						</button>
					</div>
				</nav>
			</div>
		</div>
	);
}
