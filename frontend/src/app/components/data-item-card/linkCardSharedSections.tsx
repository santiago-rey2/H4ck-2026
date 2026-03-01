import { Globe, Play } from "lucide-react";
import type { ReactNode } from "react";
import type { DataItem } from "@/app/types/data";
import { CardFooter } from "./CardFooter";
import type { LinkCardModel } from "./useLinkCardModel";

interface LinkPreviewMediaSectionProps {
	model: LinkCardModel;
}

export function LinkPreviewMediaSection({
	model,
}: LinkPreviewMediaSectionProps) {
	if (!model.showPreviewImage) {
		return null;
	}

	if (model.isIconLikeMedia) {
		return (
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
		);
	}

	return (
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
	);
}

interface LinkCardContentSectionProps {
	item: DataItem;
	model: LinkCardModel;
	prefersReducedMotion: boolean;
	formattedDate: string;
	headerBadge?: ReactNode;
}

export function LinkCardContentSection({
	item,
	model,
	prefersReducedMotion,
	formattedDate,
	headerBadge,
}: LinkCardContentSectionProps) {
	return (
		<div className="flex flex-col space-y-3 p-4">
			<div className="flex items-start justify-between gap-2">
				<div
					className={`flex-shrink-0 rounded-lg p-1.5 ${model.styles.iconBg} ${model.styles.iconColor}`}
				>
					<model.LinkKindIcon className="h-3.5 w-3.5" />
				</div>
				{headerBadge ?? null}
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
	);
}
