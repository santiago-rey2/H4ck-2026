import { Clapperboard, MapPin, MessageCircle } from "lucide-react";
import type { DataItem } from "@/app/types/data";
import { CardShell } from "./CardShell";
import { InlineEmbedFrame } from "./InlineEmbedFrame";
import {
	LinkCardContentSection,
	LinkPreviewMediaSection,
} from "./linkCardSharedSections";
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
					heightClass={model.inlinePlayerHeightClass ?? "h-[180px]"}
					borderClass={model.styles.border}
				/>
			) : model.hasLocationSnapshot ? (
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
				<LinkPreviewMediaSection model={model} />
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

			<LinkCardContentSection
				item={item}
				model={model}
				prefersReducedMotion={prefersReducedMotion}
				formattedDate={formattedDate}
			/>
		</CardShell>
	);
}
