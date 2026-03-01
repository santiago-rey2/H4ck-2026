import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import type { RefObject } from "react";

interface LinkIframeBodyProps {
	iframeUrl: string;
	reloadKey: number;
	iframeRef: RefObject<HTMLIFrameElement | null>;
	title: string;
	externalUrl: string | null;
	isLoading: boolean;
	isBlocked: boolean;
	onFrameLoad: () => void;
	onFrameError: () => void;
	onRetry: () => void;
	onOpenExternal: () => void;
}

export function LinkIframeBody({
	iframeUrl,
	reloadKey,
	iframeRef,
	title,
	externalUrl,
	isLoading,
	isBlocked,
	onFrameLoad,
	onFrameError,
	onRetry,
	onOpenExternal,
}: LinkIframeBodyProps) {
	return (
		<div className="relative min-h-0 flex-1 bg-slate-100/80 dark:bg-slate-900/70">
			<iframe
				key={`${iframeUrl}-${reloadKey}`}
				ref={iframeRef}
				src={iframeUrl}
				title={`Preview de ${title}`}
				className="h-full w-full border-0 bg-white"
				allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
				referrerPolicy="strict-origin-when-cross-origin"
				onLoad={onFrameLoad}
				onError={onFrameError}
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
								onClick={onRetry}
								className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
							>
								<RefreshCw className="size-3.5" />
								Reintentar
							</button>
							<button
								type="button"
								onClick={onOpenExternal}
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
	);
}
