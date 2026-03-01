import type { DataItem } from "@/app/types/data";
import {
	buildYouTubeEmbedUrl,
	classifyLinkTarget,
} from "@/app/utils/link-classifier";
import type { LinkCardKind } from "@/app/utils/link-types";

export type DataItemCardVariant =
	| "event"
	| "text"
	| "link"
	| "youtube"
	| "spotify";

export interface ResolvedDataItemCardVariant {
	variant: DataItemCardVariant;
	linkKind: LinkCardKind | null;
}

export function resolveDataItemCardVariant(
	item: DataItem,
): ResolvedDataItemCardVariant {
	if (item.formato === "evento") {
		return {
			variant: "event",
			linkKind: null,
		};
	}

	if (item.formato !== "link") {
		return {
			variant: "text",
			linkKind: null,
		};
	}

	const linkKind = classifyLinkTarget(item.texto).kind;
	if (linkKind === "spotify") {
		return {
			variant: "spotify",
			linkKind,
		};
	}

	const isYouTubeFamilyLink =
		linkKind === "youtube_playlist" ||
		((linkKind === "video" || linkKind === "reel") &&
			Boolean(buildYouTubeEmbedUrl(item.texto)));
	if (isYouTubeFamilyLink) {
		return {
			variant: "youtube",
			linkKind,
		};
	}

	return {
		variant: "link",
		linkKind,
	};
}

export function isWideDataItemCard(item: DataItem): boolean {
	if (item.formato === "nota" || item.formato === "evento") {
		return true;
	}

	const { variant, linkKind } = resolveDataItemCardVariant(item);
	if (variant === "youtube" || variant === "spotify") {
		return true;
	}

	if (variant !== "link") {
		return false;
	}

	return linkKind === "video" || linkKind === "location";
}
