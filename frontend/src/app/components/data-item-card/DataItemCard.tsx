import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import {
	buildYouTubeEmbedUrl,
	classifyLinkTarget,
} from "@/app/utils/link-classifier";
import { EventCard } from "./EventCard";
import { LinkCard } from "./LinkCard";
import { SpotifyCard } from "./SpotifyCard";
import { TextCard } from "./TextCard";
import type { DataItemCardProps } from "./types";
import { YouTubeCard } from "./YouTubeCard";

export function DataItemCard({ item }: DataItemCardProps) {
	const { prefersReducedMotion } = useMotionPreferences();

	if (item.formato === "evento") {
		return (
			<EventCard item={item} prefersReducedMotion={prefersReducedMotion} />
		);
	}

	if (item.formato === "link") {
		const linkKind = classifyLinkTarget(item.texto).kind;
		if (linkKind === "spotify") {
			return (
				<SpotifyCard item={item} prefersReducedMotion={prefersReducedMotion} />
			);
		}

		const isYouTubeFamilyLink =
			linkKind === "youtube_playlist" ||
			((linkKind === "video" || linkKind === "reel") &&
				Boolean(buildYouTubeEmbedUrl(item.texto)));
		if (isYouTubeFamilyLink) {
			return (
				<YouTubeCard item={item} prefersReducedMotion={prefersReducedMotion} />
			);
		}

		return <LinkCard item={item} prefersReducedMotion={prefersReducedMotion} />;
	}

	return <TextCard item={item} prefersReducedMotion={prefersReducedMotion} />;
}
