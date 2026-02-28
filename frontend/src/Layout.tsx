import { useAtom } from "jotai";
import { Home, PanelLeft, PanelRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { mobileActiveViewAtom } from "@/app/atoms";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import {
	getSidebarContentVariants,
	getViewSwitchVariants,
} from "@/app/motion/variants";
import { cn } from "@/lib/utils";
import { LeftFiltersSidebar } from "./app/components/LeftFiltersSidebar";
import { LinkIframeModal } from "./app/components/LinkIframeModal";
import { PageTransition } from "./app/components/PageTransition";
import { RightWorkbenchSidebar } from "./app/components/RightWorkbenchSidebar";

type ViewportMode = "mobile" | "tablet" | "desktop";

const TABLET_MIN_WIDTH = 768;
const DESKTOP_MIN_WIDTH = 1024;

function getViewportMode(width: number): ViewportMode {
	if (width >= DESKTOP_MIN_WIDTH) {
		return "desktop";
	}

	if (width >= TABLET_MIN_WIDTH) {
		return "tablet";
	}

	return "mobile";
}

function Layout() {
	const location = useLocation();
	const [mobileView, setMobileView] = useAtom(mobileActiveViewAtom);
	const { prefersReducedMotion } = useMotionPreferences();
	const [viewportMode, setViewportMode] = useState<ViewportMode>(() => {
		if (typeof window === "undefined") {
			return "desktop";
		}

		return getViewportMode(window.innerWidth);
	});
	const [openTabletSidebar, setOpenTabletSidebar] = useState<
		"left" | "right" | null
	>(null);

	const routeKey = `${location.pathname}${location.search}${location.hash}`;
	const sidebarWidthTransitionClass = prefersReducedMotion
		? "duration-0"
		: "duration-300";
	const viewSwitchVariants = getViewSwitchVariants(prefersReducedMotion);
	const leftSidebarVariants = getSidebarContentVariants(
		prefersReducedMotion,
		"left",
	);
	const rightSidebarVariants = getSidebarContentVariants(
		prefersReducedMotion,
		"right",
	);

	useEffect(() => {
		const updateViewportMode = () => {
			setViewportMode(getViewportMode(window.innerWidth));
		};

		window.addEventListener("resize", updateViewportMode);
		return () => {
			window.removeEventListener("resize", updateViewportMode);
		};
	}, []);

	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key !== "Escape" || viewportMode !== "tablet") {
				return;
			}

			setOpenTabletSidebar(null);
		};

		window.addEventListener("keydown", closeOnEscape);
		return () => {
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [viewportMode]);

	useEffect(() => {
		if (viewportMode !== "tablet") {
			setOpenTabletSidebar(null);
		}

		if (viewportMode !== "mobile" && mobileView !== "home") {
			setMobileView("home");
		}
	}, [mobileView, setMobileView, viewportMode]);

	if (viewportMode === "desktop") {
		return (
			<div className="w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
				<div className="h-full grid grid-cols-[20rem_minmax(0,1fr)_24rem]">
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
				<LinkIframeModal />
			</div>
		);
	}

	if (viewportMode === "tablet") {
		const isLeftOpen = openTabletSidebar === "left";
		const isRightOpen = openTabletSidebar === "right";

		return (
			<div className="w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
				<div className="h-full flex flex-col">
					<header className="h-14 shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 flex items-center justify-between gap-3">
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
									: "border-slate-300 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100",
							)}
						>
							<PanelLeft className="w-4 h-4" />
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
									: "border-slate-300 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100",
							)}
						>
							<PanelRight className="w-4 h-4" />
							Panel
						</button>
					</header>

					<div className="flex-1 min-h-0 flex overflow-hidden">
						<aside
							id="tablet-left-sidebar"
							aria-hidden={!isLeftOpen}
							className={cn(
								"min-h-0 shrink-0 overflow-hidden bg-white dark:bg-slate-900 transition-[width,border-color,box-shadow] ease-out",
								sidebarWidthTransitionClass,
								isLeftOpen
									? "w-80 border-r border-slate-200 dark:border-slate-800 shadow-[8px_0_20px_rgba(15,23,42,0.08)] dark:shadow-[8px_0_20px_rgba(0,0,0,0.35)]"
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

						<main className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
							<PageTransition pageKey={routeKey}>
								<Outlet />
							</PageTransition>
						</main>

						<aside
							id="tablet-right-sidebar"
							aria-hidden={!isRightOpen}
							className={cn(
								"min-h-0 shrink-0 overflow-hidden bg-white dark:bg-slate-900 transition-[width,border-color,box-shadow] ease-out",
								sidebarWidthTransitionClass,
								isRightOpen
									? "w-96 border-l border-slate-200 dark:border-slate-800 shadow-[-8px_0_20px_rgba(15,23,42,0.08)] dark:shadow-[-8px_0_20px_rgba(0,0,0,0.35)]"
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
				<LinkIframeModal />
			</div>
		);
	}

	return (
		<div className="w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
			<div className="h-full flex flex-col">
				<div className="flex-1 min-h-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
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

				<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300/80 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 pb-[env(safe-area-inset-bottom)]">
					<div className="grid grid-cols-3 gap-1 p-2">
						<button
							type="button"
							onClick={() => setMobileView("filters")}
							className={cn(
								"h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
								mobileView === "filters"
									? "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
									: "text-slate-600 dark:text-slate-300",
							)}
						>
							<PanelLeft className="w-4 h-4" />
							Filtros
						</button>

						<button
							type="button"
							onClick={() => setMobileView("home")}
							className={cn(
								"h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
								mobileView === "home"
									? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200"
									: "text-slate-600 dark:text-slate-300",
							)}
						>
							<Home className="w-4 h-4" />
							Inicio
						</button>

						<button
							type="button"
							onClick={() => setMobileView("panel")}
							className={cn(
								"h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
								mobileView === "panel"
									? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
									: "text-slate-600 dark:text-slate-300",
							)}
						>
							<PanelRight className="w-4 h-4" />
							Panel
						</button>
					</div>
				</nav>
			</div>
			<LinkIframeModal />
		</div>
	);
}

export default Layout;
