import { PanelLeft, PanelRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { LeftFiltersSidebar } from "@/app/components/LeftFiltersSidebar";
import { PageTransition } from "@/app/components/PageTransition";
import { RightWorkbenchSidebar } from "@/app/components/RightWorkbenchSidebar";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getSidebarContentVariants } from "@/app/motion/variants";
import { cn } from "@/lib/utils";

interface TabletLayoutProps {
	routeKey: string;
}

export function TabletLayout({ routeKey }: TabletLayoutProps) {
	const { prefersReducedMotion } = useMotionPreferences();
	const [openTabletSidebar, setOpenTabletSidebar] = useState<
		"left" | "right" | null
	>(null);

	const sidebarWidthTransitionClass = prefersReducedMotion
		? "duration-0"
		: "duration-300";
	const leftSidebarVariants = getSidebarContentVariants(
		prefersReducedMotion,
		"left",
	);
	const rightSidebarVariants = getSidebarContentVariants(
		prefersReducedMotion,
		"right",
	);

	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			setOpenTabletSidebar(null);
		};

		window.addEventListener("keydown", closeOnEscape);
		return () => {
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, []);

	const isLeftOpen = openTabletSidebar === "left";
	const isRightOpen = openTabletSidebar === "right";

	return (
		<div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
			<div className="flex h-full flex-col">
				<header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
					<button
						type="button"
						aria-expanded={isLeftOpen}
						aria-controls="tablet-left-sidebar"
						onClick={() =>
							setOpenTabletSidebar((currentSidebar) =>
								currentSidebar === "left" ? null : "left",
							)
						}
						className={cn(
							"inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
							isLeftOpen
								? "border-teal-400 bg-teal-100 text-teal-800 dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-200"
								: "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
						)}
					>
						<PanelLeft className="h-4 w-4" />
						Filtros
					</button>

					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
						Digital Brain
					</p>

					<button
						type="button"
						aria-expanded={isRightOpen}
						aria-controls="tablet-right-sidebar"
						onClick={() =>
							setOpenTabletSidebar((currentSidebar) =>
								currentSidebar === "right" ? null : "right",
							)
						}
						className={cn(
							"inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
							isRightOpen
								? "border-amber-500 bg-amber-600 text-white"
								: "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
						)}
					>
						<PanelRight className="h-4 w-4" />
						Panel
					</button>
				</header>

				<div className="flex min-h-0 flex-1 overflow-hidden">
					<aside
						id="tablet-left-sidebar"
						aria-hidden={!isLeftOpen}
						className={cn(
							"min-h-0 shrink-0 overflow-hidden bg-white transition-[width,border-color,box-shadow] ease-out dark:bg-slate-900",
							sidebarWidthTransitionClass,
							isLeftOpen
								? "w-80 border-r border-slate-200 shadow-[8px_0_20px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:shadow-[8px_0_20px_rgba(0,0,0,0.35)]"
								: "w-0 border-r-0 shadow-none",
						)}
					>
						<AnimatePresence initial={false} mode="wait">
							{isLeftOpen ? (
								<motion.div
									key="tablet-left-content"
									variants={leftSidebarVariants}
									initial="initial"
									animate="animate"
									exit="exit"
									className="h-full"
								>
									<LeftFiltersSidebar surface="tablet" />
								</motion.div>
							) : null}
						</AnimatePresence>
					</aside>

					<main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
						<PageTransition pageKey={routeKey}>
							<Outlet />
						</PageTransition>
					</main>

					<aside
						id="tablet-right-sidebar"
						aria-hidden={!isRightOpen}
						className={cn(
							"min-h-0 shrink-0 overflow-hidden bg-white transition-[width,border-color,box-shadow] ease-out dark:bg-slate-900",
							sidebarWidthTransitionClass,
							isRightOpen
								? "w-96 border-l border-slate-200 shadow-[-8px_0_20px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:shadow-[-8px_0_20px_rgba(0,0,0,0.35)]"
								: "w-0 border-l-0 shadow-none",
						)}
					>
						<AnimatePresence initial={false} mode="wait">
							{isRightOpen ? (
								<motion.div
									key="tablet-right-content"
									variants={rightSidebarVariants}
									initial="initial"
									animate="animate"
									exit="exit"
									className="h-full"
								>
									<RightWorkbenchSidebar surface="tablet" />
								</motion.div>
							) : null}
						</AnimatePresence>
					</aside>
				</div>
			</div>
		</div>
	);
}
