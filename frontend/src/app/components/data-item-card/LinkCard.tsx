import {
	Clapperboard,
	ExternalLink,
	Globe,
	Loader2,
	MapPin,
	MessageCircle,
	Play,
	Sparkles,
} from "lucide-react";
import type { DataItem } from "@/app/types/data";
import { Badge } from "@/components/ui/badge";
import { CardFooter } from "./CardFooter";
import { CardShell } from "./CardShell";
import { LINK_KIND_ACCENT_BAR } from "./styles";
import { useLinkCardModel } from "./useLinkCardModel";

interface LinkCardProps {
	item: DataItem;
	prefersReducedMotion: boolean;
}

export function LinkCard({ item, prefersReducedMotion }: LinkCardProps) {
	const model = useLinkCardModel(item);
	const formattedDate = new Date(item.fecha).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const isClickable = Boolean(model.viewerIframeUrl);

	return (
		<CardShell
			styles={model.styles}
			prefersReducedMotion={prefersReducedMotion}
			className={`group ${isClickable ? "cursor-pointer" : "cursor-default"}`}
			onClick={isClickable ? model.onCardClick : undefined}
			onKeyDown={isClickable ? model.onCardKeyDown : undefined}
			role={isClickable ? "link" : undefined}
			tabIndex={isClickable ? 0 : undefined}
			ariaLabel={isClickable ? `Abrir enlace ${model.previewTitle}` : undefined}
		>
			{model.hasLocationSnapshot ? (
				<div
					className={`relative w-full ${model.mediaHeightClass} overflow-hidden border-b border-emerald-200/80 dark:border-emerald-900/70`}
				>
					<div className="grid h-full w-full grid-cols-2 grid-rows-2">
						{(model.locationSnapshotTiles ?? []).map((tileUrl) => (
							<img
								key={tileUrl}
								src={tileUrl}
								alt="Mapa"
								className="h-full w-full object-cover"
								onError={model.onMapSnapshotError}
							/>
						))}
					</div>
					<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent dark:from-slate-950/40" />
					<div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
						<MapPin className="size-3.5" />
						Mapa
					</div>
				</div>
			) : model.showPreviewImage ? (
				model.isIconLikeMedia ? (
					<div
						className={`relative w-full h-24 overflow-hidden border-b ${model.styles.border} bg-white/40 dark:bg-slate-900/50`}
					>
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_60%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
						<div className="relative z-10 flex h-full items-center justify-center px-4">
							<img
								src={model.activePreviewMediaUrl ?? undefined}
								alt={model.previewTitle}
								className="max-h-14 w-full object-contain drop-shadow-sm"
								onError={model.onPreviewMediaError}
							/>
						</div>
					</div>
				) : (
					<div
						className={`relative w-full ${model.mediaHeightClass} overflow-hidden bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800`}
					>
						<img
							src={model.activePreviewMediaUrl ?? undefined}
							alt={model.previewTitle}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
							onError={model.onPreviewMediaError}
						/>
						{model.showPlayOverlay ? (
							<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/25 dark:bg-slate-950/35">
								<span className="inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-slate-900 shadow-md dark:bg-slate-900/85 dark:text-white">
									<Play className="size-4 fill-current" />
								</span>
							</div>
						) : null}
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/20 to-transparent dark:from-slate-950/35" />
					</div>
				)
			) : model.showLocationPlaceholder ? (
				<div className="relative h-24 w-full overflow-hidden border-b border-emerald-200/70 bg-gradient-to-br from-emerald-100/90 to-cyan-100/70 dark:border-emerald-900/70 dark:from-emerald-950/35 dark:to-cyan-950/30">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.28),transparent_60%)] dark:bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.18),transparent_60%)]" />
					<div className="relative z-10 flex h-full items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300">
						<MapPin className="size-4" />
						<span className="text-xs font-semibold">
							{model.linkPlatform ?? "Ubicacion"}
						</span>
					</div>
				</div>
			) : model.showSocialPlaceholder ? (
				<div className="relative h-24 w-full overflow-hidden border-b border-indigo-200/70 bg-gradient-to-br from-indigo-100/85 to-cyan-100/70 dark:border-indigo-900/70 dark:from-indigo-950/35 dark:to-cyan-950/30">
					<div className="relative z-10 flex h-full items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300">
						<MessageCircle className="size-4" />
						<span className="text-xs font-semibold">
							{model.linkPlatform ?? "Social"}
						</span>
					</div>
				</div>
			) : model.showPlayOverlay ? (
				<div className="relative h-24 w-full overflow-hidden border-b border-orange-200/70 bg-gradient-to-br from-orange-100/90 to-rose-100/70 dark:border-orange-900/70 dark:from-orange-950/35 dark:to-rose-950/30">
					<div className="relative z-10 flex h-full items-center justify-center gap-2 text-orange-700 dark:text-orange-300">
						<Clapperboard className="size-4" />
						<span className="text-xs font-semibold">
							{model.linkPlatform ?? "Video"}
						</span>
					</div>
				</div>
			) : (
				<div
					className={`h-1.5 w-full ${LINK_KIND_ACCENT_BAR[model.linkKind]}`}
				/>
			)}

			<div className="p-4 space-y-3 flex flex-col">
				<div className="flex items-start justify-between gap-2">
					<div
						className={`p-1.5 rounded-lg ${model.styles.iconBg} ${model.styles.iconColor} flex-shrink-0`}
					>
						<model.LinkKindIcon className="w-3.5 h-3.5" />
					</div>
				</div>

				{model.isPreviewLoading ? (
					<div className="space-y-2 animate-pulse">
						<div className="h-3 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
						<div className="h-4 w-full rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
						<div className="h-4 w-11/12 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
						<div className="h-3 w-2/3 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
					</div>
				) : (
					<div className="space-y-2">
						<h3 className="font-semibold text-sm leading-snug text-slate-900 dark:text-slate-100 line-clamp-3">
							{model.previewTitle}
						</h3>

						{model.previewDescription ? (
							<p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
								{model.previewDescription}
							</p>
						) : null}

						<div className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
							<Globe className="size-3.5" />
							<span className="truncate">{model.displayHostname}</span>
						</div>
					</div>
				)}

				<CardFooter
					item={item}
					styles={model.styles}
					prefersReducedMotion={prefersReducedMotion}
					formattedDate={formattedDate}
				/>
			</div>
		</CardShell>
	);
}
