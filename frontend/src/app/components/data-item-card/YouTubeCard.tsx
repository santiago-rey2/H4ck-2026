import { Clapperboard, Globe, ListVideo, Play } from "lucide-react";
import type { DataItem } from "@/app/types/data";
import { CardFooter } from "./CardFooter";
import { CardShell } from "./CardShell";
import { InlineEmbedFrame } from "./InlineEmbedFrame";
import { LINK_KIND_ACCENT_BAR } from "./styles";
import { useLinkCardModel } from "./useLinkCardModel";

interface YouTubeCardProps {
	item: DataItem;
	prefersReducedMotion: boolean;
}

const YOUTUBE_KIND_BADGE_LABELS = {
	video: "Video",
	reel: "Short",
	youtube_playlist: "Playlist",
} as const;

const YOUTUBE_KIND_BADGE_ICONS = {
	video: Clapperboard,
	reel: Play,
	youtube_playlist: ListVideo,
} as const;

export function YouTubeCard({ item, prefersReducedMotion }: YouTubeCardProps) {
	const model = useLinkCardModel(item);
	const formattedDate = new Date(item.fecha).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const isClickable =
		Boolean(model.viewerIframeUrl) && !model.inlinePlayerEmbedUrl;
	const kindBadgeLabel =
		YOUTUBE_KIND_BADGE_LABELS[
			model.linkKind as keyof typeof YOUTUBE_KIND_BADGE_LABELS
		] ?? "YouTube";
	const KindBadgeIcon =
		YOUTUBE_KIND_BADGE_ICONS[
			model.linkKind as keyof typeof YOUTUBE_KIND_BADGE_ICONS
		] ?? Clapperboard;

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
			{model.inlinePlayerEmbedUrl ? (
				<InlineEmbedFrame
					title={`Reproductor de ${model.previewTitle}`}
					src={model.inlinePlayerEmbedUrl}
					heightClass={model.inlinePlayerHeightClass ?? "h-[224px]"}
					borderClass={model.styles.border}
				/>
			) : model.showPreviewImage ? (
				model.isIconLikeMedia ? (
					<div
						className={`relative h-24 w-full overflow-hidden border-b ${model.styles.border} bg-white/40 dark:bg-slate-900/50`}
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
							className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
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
			) : model.showYouTubePlaylistPlaceholder ? (
				<div className="relative h-24 w-full overflow-hidden border-b border-red-200/70 bg-gradient-to-br from-red-100/90 to-orange-100/70 dark:border-red-900/70 dark:from-red-950/35 dark:to-orange-950/30">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(239,68,68,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_18%_30%,rgba(239,68,68,0.16),transparent_60%)]" />
					<div className="relative z-10 flex h-full items-center justify-center gap-2 text-red-700 dark:text-red-300">
						<ListVideo className="size-4" />
						<span className="text-xs font-semibold">YouTube Playlist</span>
					</div>
				</div>
			) : model.showPlayOverlay ? (
				<div className="relative h-24 w-full overflow-hidden border-b border-orange-200/70 bg-gradient-to-br from-orange-100/90 to-rose-100/70 dark:border-orange-900/70 dark:from-orange-950/35 dark:to-rose-950/30">
					<div className="relative z-10 flex h-full items-center justify-center gap-2 text-orange-700 dark:text-orange-300">
						<Clapperboard className="size-4" />
						<span className="text-xs font-semibold">
							{model.linkPlatform ?? "YouTube"}
						</span>
					</div>
				</div>
			) : (
				<div
					className={`h-1.5 w-full ${LINK_KIND_ACCENT_BAR[model.linkKind]}`}
				/>
			)}

			<div className="flex flex-col space-y-3 p-4">
				<div className="flex items-start justify-between gap-2">
					<div
						className={`flex-shrink-0 rounded-lg p-1.5 ${model.styles.iconBg} ${model.styles.iconColor}`}
					>
						<model.LinkKindIcon className="h-3.5 w-3.5" />
					</div>
					<span className="inline-flex items-center gap-1 rounded-full border border-red-300/80 bg-red-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-800 dark:border-red-800 dark:bg-red-950/45 dark:text-red-200">
						<KindBadgeIcon className="size-3" />
						{kindBadgeLabel}
					</span>
				</div>

				{model.isPreviewLoading ? (
					<div className="animate-pulse space-y-2">
						<div className="h-3 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
						<div className="h-4 w-full rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
						<div className="h-4 w-11/12 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
						<div className="h-3 w-2/3 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
					</div>
				) : (
					<div className="space-y-2">
						<h3 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
							{model.previewTitle}
						</h3>

						{model.previewDescription ? (
							<p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-400">
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
