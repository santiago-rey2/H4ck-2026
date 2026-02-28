import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { EventCard } from "./EventCard";
import { LinkCard } from "./LinkCard";
import { TextCard } from "./TextCard";
import type { DataItemCardProps } from "./types";

export function DataItemCard({ item }: DataItemCardProps) {
	const { prefersReducedMotion } = useMotionPreferences();

	if (item.formato === "evento") {
		return (
			<EventCard item={item} prefersReducedMotion={prefersReducedMotion} />
		);
	}

	if (item.formato === "link") {
		return <LinkCard item={item} prefersReducedMotion={prefersReducedMotion} />;
	}

	return <TextCard item={item} prefersReducedMotion={prefersReducedMotion} />;
}
