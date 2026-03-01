import {
	Disc3,
	ListMusic,
	type LucideIcon,
	Mic2,
	Music2,
	Radio,
	UserRound,
} from "lucide-react";
import type { DataItem } from "@/app/types/data";
import type { SpotifyResourceType } from "@/app/utils/link-types";
import { CardFooter } from "./CardFooter";
import { CardShell } from "./CardShell";
import { InlineEmbedFrame } from "./InlineEmbedFrame";
import { useLinkCardModel } from "./useLinkCardModel";

interface SpotifyCardProps {
	item: DataItem;
	prefersReducedMotion: boolean;
}

const SPOTIFY_RESOURCE_LABELS: Record<SpotifyResourceType, string> = {
	track: "Cancion",
	album: "Album",
	playlist: "Playlist",
	artist: "Artista",
	show: "Podcast",
	episode: "Episodio",
};

const SPOTIFY_RESOURCE_ICONS: Record<SpotifyResourceType, LucideIcon> = {
	track: Music2,
	album: Disc3,
	playlist: ListMusic,
	artist: UserRound,
	show: Mic2,
	episode: Radio,
};

export function SpotifyCard({ item, prefersReducedMotion }: SpotifyCardProps) {
	const model = useLinkCardModel(item);
	const formattedDate = new Date(item.fecha).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const resourceType = model.spotifyResourceType;
	const resourceLabel = resourceType
		? SPOTIFY_RESOURCE_LABELS[resourceType]
		: "Spotify";
	const ResourceIcon = resourceType
		? SPOTIFY_RESOURCE_ICONS[resourceType]
		: Music2;
	const isClickable =
		Boolean(model.viewerIframeUrl) && !model.inlinePlayerEmbedUrl;

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
					heightClass={model.inlinePlayerHeightClass ?? "h-[152px]"}
					borderClass={model.styles.border}
				/>
			) : model.showPreviewImage ? (
				<div
					className={`relative w-full ${model.mediaHeightClass} overflow-hidden bg-gradient-to-br from-emerald-300 to-teal-400 dark:from-emerald-900/60 dark:to-teal-900/60`}
				>
					<img
						src={model.activePreviewMediaUrl ?? undefined}
						alt={model.previewTitle}
						className="h-full w-full object-cover"
						onError={model.onPreviewMediaError}
					/>
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/20 to-transparent dark:from-slate-950/35" />
				</div>
			) : (
				<div className="relative h-24 w-full overflow-hidden border-b border-emerald-200/70 bg-gradient-to-br from-emerald-100/90 to-lime-100/70 dark:border-emerald-900/70 dark:from-emerald-950/35 dark:to-lime-950/30">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.28),transparent_60%)] dark:bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.18),transparent_60%)]" />
					<div className="relative z-10 flex h-full items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300">
						<ResourceIcon className="size-4" />
						<span className="text-xs font-semibold">{resourceLabel}</span>
					</div>
				</div>
			)}

			<div className="flex flex-col space-y-3 p-4">
				<div className="flex items-start justify-between gap-2">
					<div
						className={`rounded-lg p-1.5 ${model.styles.iconBg} ${model.styles.iconColor} flex-shrink-0`}
					>
						<ResourceIcon className="h-3.5 w-3.5" />
					</div>
					<span className="rounded-full border border-emerald-300/70 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
						{resourceLabel}
					</span>
				</div>

				<div className="space-y-2">
					<h3 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
						{model.previewTitle}
					</h3>

					{model.previewDescription ? (
						<p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-400">
							{model.previewDescription}
						</p>
					) : null}

					<p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
						{model.linkKindHint}
					</p>
				</div>

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
