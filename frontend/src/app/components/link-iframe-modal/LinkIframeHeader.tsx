import { ExternalLink, Globe, X } from "lucide-react";

interface LinkIframeHeaderProps {
	title: string;
	hostnameOrUrl: string;
	externalUrl: string | null;
	onOpenExternal: () => void;
	onClose: () => void;
}

export function LinkIframeHeader({
	title,
	hostnameOrUrl,
	externalUrl,
	onOpenExternal,
	onClose,
}: LinkIframeHeaderProps) {
	return (
		<header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/85">
			<div className="min-w-0 space-y-1">
				<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
					Visor interno
				</p>
				<h2
					id="link-iframe-modal-title"
					className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base"
				>
					{title}
				</h2>
				<p className="inline-flex items-center gap-1.5 truncate text-xs text-slate-600 dark:text-slate-400">
					<Globe className="size-3.5 shrink-0" />
					<span className="truncate">{hostnameOrUrl}</span>
				</p>
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={onOpenExternal}
					disabled={!externalUrl}
					className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-200 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60"
				>
					<ExternalLink className="size-3.5" />
					Abrir fuera
				</button>
				<button
					type="button"
					onClick={onClose}
					className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
					aria-label="Cerrar visor"
				>
					<X className="size-4" />
				</button>
			</div>
		</header>
	);
}
