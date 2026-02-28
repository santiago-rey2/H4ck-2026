import { useAtom, useSetAtom } from "jotai";
import { ExternalLink, Globe, Loader2, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { closeLinkViewerAtom, linkViewerAtom } from "@/app/atoms";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getModalVariants } from "@/app/motion/variants";

const IFRAME_BLOCK_DETECTION_MS = 4500;

function openUrlInNewTab(url: string) {
	window.open(url, "_blank", "noopener,noreferrer");
}

export function LinkIframeModal() {
	const [viewerState] = useAtom(linkViewerAtom);
	const closeViewer = useSetAtom(closeLinkViewerAtom);
	const { prefersReducedMotion } = useMotionPreferences();
	const modalVariants = getModalVariants(prefersReducedMotion);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const timeoutRef = useRef<number | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);

	const iframeUrl = viewerState.iframeUrl;
	const externalUrl = viewerState.externalUrl;
	const title = viewerState.title?.trim() || viewerState.hostname || "Enlace";

	const clearFallbackTimeout = useCallback(() => {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	useEffect(() => {
		void reloadKey;

		if (!viewerState.open || !iframeUrl) {
			clearFallbackTimeout();
			setIsLoading(false);
			setIsBlocked(false);
			return;
		}

		setIsLoading(true);
		setIsBlocked(false);
		clearFallbackTimeout();

		timeoutRef.current = window.setTimeout(() => {
			setIsLoading(false);
			setIsBlocked(true);
		}, IFRAME_BLOCK_DETECTION_MS);

		return clearFallbackTimeout;
	}, [viewerState.open, iframeUrl, reloadKey, clearFallbackTimeout]);

	useEffect(() => {
		if (!viewerState.open) {
			return;
		}

		const onEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeViewer();
			}
		};

		window.addEventListener("keydown", onEscape);
		return () => {
			window.removeEventListener("keydown", onEscape);
		};
	}, [closeViewer, viewerState.open]);

	const handleFrameLoad = () => {
		clearFallbackTimeout();
		setIsLoading(false);

		const iframe = iframeRef.current;
		if (!iframe) {
			return;
		}

		try {
			const href = iframe.contentWindow?.location.href;
			if (href === "about:blank") {
				setIsBlocked(true);
				return;
			}
		} catch {
			// Si lanza error de cross-origin, asumimos que el iframe cargo correctamente.
		}

		setIsBlocked(false);
	};

	const handleFrameError = () => {
		clearFallbackTimeout();
		setIsLoading(false);
		setIsBlocked(true);
	};

	const handleRetry = () => {
		setReloadKey((currentKey) => currentKey + 1);
	};

	if (!viewerState.open || !iframeUrl) {
		return null;
	}

	return (
		<AnimatePresence>
			<motion.div
				className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
				role="dialog"
				aria-modal="true"
				aria-labelledby="link-iframe-modal-title"
			>
				<motion.button
					type="button"
					aria-label="Cerrar visor de enlace"
					variants={modalVariants.backdrop}
					initial="hidden"
					animate="visible"
					exit="exit"
					className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
					onClick={() => closeViewer()}
				/>

				<motion.div
					variants={modalVariants.panel}
					initial="hidden"
					animate="visible"
					exit="exit"
					className="relative z-10 w-full h-full max-h-[94vh] max-w-[1400px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
				>
					<div className="h-full flex flex-col">
						<header className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-200/90 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/85">
							<div className="min-w-0 space-y-1">
								<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
									Visor interno
								</p>
								<h2
									id="link-iframe-modal-title"
									className="truncate text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100"
								>
									{title}
								</h2>
								<p className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 truncate">
									<Globe className="size-3.5 shrink-0" />
									<span className="truncate">
										{viewerState.hostname ?? externalUrl ?? iframeUrl}
									</span>
								</p>
							</div>

							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => {
										if (!externalUrl) {
											return;
										}
										openUrlInNewTab(externalUrl);
									}}
									disabled={!externalUrl}
									className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-200 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60"
								>
									<ExternalLink className="size-3.5" />
									Abrir fuera
								</button>
								<button
									type="button"
									onClick={() => closeViewer()}
									className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
									aria-label="Cerrar visor"
								>
									<X className="size-4" />
								</button>
							</div>
						</header>

						<div className="relative flex-1 min-h-0 bg-slate-100/80 dark:bg-slate-900/70">
							<iframe
								key={`${iframeUrl}-${reloadKey}`}
								ref={iframeRef}
								src={iframeUrl}
								title={`Preview de ${title}`}
								className="h-full w-full border-0 bg-white"
								allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
								referrerPolicy="strict-origin-when-cross-origin"
								onLoad={handleFrameLoad}
								onError={handleFrameError}
							/>

							{isLoading ? (
								<div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
									<p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
										<Loader2 className="size-3.5 animate-spin" />
										Cargando pagina...
									</p>
								</div>
							) : null}

							{isBlocked ? (
								<div className="absolute inset-0 flex items-center justify-center p-6">
									<div className="w-full max-w-lg rounded-2xl border border-amber-300 bg-amber-50/95 p-5 text-amber-900 shadow-md dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
										<h3 className="text-sm font-semibold">
											No se pudo embeber esta pagina
										</h3>
										<p className="mt-2 text-xs leading-relaxed">
											El sitio puede bloquear iframes por politicas de seguridad
											(X-Frame-Options o Content-Security-Policy).
										</p>
										<div className="mt-4 flex flex-wrap gap-2">
											<button
												type="button"
												onClick={handleRetry}
												className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
											>
												<RefreshCw className="size-3.5" />
												Reintentar
											</button>
											<button
												type="button"
												onClick={() => {
													if (!externalUrl) {
														return;
													}
													openUrlInNewTab(externalUrl);
												}}
												disabled={!externalUrl}
												className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/90 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
											>
												<ExternalLink className="size-3.5" />
												Abrir en pestaña nueva
											</button>
										</div>
									</div>
								</div>
							) : null}
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
