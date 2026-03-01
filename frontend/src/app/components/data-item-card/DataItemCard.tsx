import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { resolveDataItemCardVariant } from "./cardVariant";
import { EventCard } from "./EventCard";
import { LinkCard } from "./LinkCard";
import { SpotifyCard } from "./SpotifyCard";
import { TextCard } from "./TextCard";
import type { DataItemCardProps } from "./types";
import { YouTubeCard } from "./YouTubeCard";

export function DataItemCard({ item }: DataItemCardProps) {
	const { prefersReducedMotion } = useMotionPreferences();
	const { variant } = resolveDataItemCardVariant(item);

	if (variant === "event") {
		return (
			<EventCard item={item} prefersReducedMotion={prefersReducedMotion} />
		);
	}

	if (variant === "spotify") {
		return (
			<SpotifyCard item={item} prefersReducedMotion={prefersReducedMotion} />
		);
	}

	if (variant === "youtube") {
		return (
			<YouTubeCard item={item} prefersReducedMotion={prefersReducedMotion} />
		);
	}

	if (variant === "link") {
		return <LinkCard item={item} prefersReducedMotion={prefersReducedMotion} />;
	}

	return <TextCard item={item} prefersReducedMotion={prefersReducedMotion} />;
}
