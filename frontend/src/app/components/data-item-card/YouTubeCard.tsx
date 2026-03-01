import { Clapperboard, ListVideo, Play } from "lucide-react";
import type { DataItem } from "@/app/types/data";
import { CardShell } from "./CardShell";
import { InlineEmbedFrame } from "./InlineEmbedFrame";
import {
	LinkCardContentSection,
	LinkPreviewMediaSection,
} from "./linkCardSharedSections";
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
				<LinkPreviewMediaSection model={model} />
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

			<LinkCardContentSection
				item={item}
				model={model}
				prefersReducedMotion={prefersReducedMotion}
				formattedDate={formattedDate}
				headerBadge={
					<span className="inline-flex items-center gap-1 rounded-full border border-red-300/80 bg-red-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-800 dark:border-red-800 dark:bg-red-950/45 dark:text-red-200">
						<KindBadgeIcon className="size-3" />
						{kindBadgeLabel}
					</span>
				}
			/>
		</CardShell>
	);
}
