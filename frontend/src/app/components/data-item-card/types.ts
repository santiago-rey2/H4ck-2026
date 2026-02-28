import type { DataItem } from "@/app/types/data";

export interface DataItemCardProps {
	item: DataItem;
}

export interface CardStyleTokens {
	bg: string;
	border: string;
	iconBg: string;
	iconColor: string;
	tagBg: string;
}

export type LinkMediaKind = "image" | "logo" | "favicon";

export interface LinkMediaCandidate {
	kind: LinkMediaKind;
	url: string;
}
