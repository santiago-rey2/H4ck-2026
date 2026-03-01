import { useAtom, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import { closeLinkViewerAtom, linkViewerAtom } from "@/app/atoms";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getModalVariants } from "@/app/motion/variants";
import { LinkIframeBody } from "./link-iframe-modal/LinkIframeBody";
import { LinkIframeHeader } from "./link-iframe-modal/LinkIframeHeader";
import { useLinkIframeViewerState } from "./link-iframe-modal/useLinkIframeViewerState";

function openUrlInNewTab(url: string) {
	window.open(url, "_blank", "noopener,noreferrer");
}

export function LinkIframeModal() {
	const [viewerState] = useAtom(linkViewerAtom);
	const closeViewer = useSetAtom(closeLinkViewerAtom);
	const { prefersReducedMotion } = useMotionPreferences();
	const modalVariants = getModalVariants(prefersReducedMotion);

	const iframeUrl = viewerState.iframeUrl;
	const externalUrl = viewerState.externalUrl;
	const title = viewerState.title?.trim() || viewerState.hostname || "Enlace";
	const hostnameOrUrl =
		viewerState.hostname ?? externalUrl ?? iframeUrl ?? "Enlace";

	const {
		iframeRef,
		reloadKey,
		isLoading,
		isBlocked,
		handleFrameLoad,
		handleFrameError,
		handleRetry,
	} = useLinkIframeViewerState({
		open: viewerState.open,
		iframeUrl,
		onClose: closeViewer,
	});

	if (!viewerState.open || !iframeUrl) {
		return null;
	}

	const handleOpenExternal = () => {
		if (!externalUrl) {
			return;
		}

		openUrlInNewTab(externalUrl);
	};

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
					className="relative z-10 h-full max-h-[94vh] w-full max-w-[1400px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
				>
					<div className="flex h-full flex-col">
						<LinkIframeHeader
							title={title}
							hostnameOrUrl={hostnameOrUrl}
							externalUrl={externalUrl}
							onOpenExternal={handleOpenExternal}
							onClose={closeViewer}
						/>

						<LinkIframeBody
							iframeUrl={iframeUrl}
							reloadKey={reloadKey}
							iframeRef={iframeRef}
							title={title}
							externalUrl={externalUrl}
							isLoading={isLoading}
							isBlocked={isBlocked}
							onFrameLoad={handleFrameLoad}
							onFrameError={handleFrameError}
							onRetry={handleRetry}
							onOpenExternal={handleOpenExternal}
						/>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
