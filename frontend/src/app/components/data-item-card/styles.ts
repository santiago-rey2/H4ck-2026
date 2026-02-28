import {
	Clapperboard,
	Globe,
	ListVideo,
	type LucideIcon,
	MapPin,
	MessageCircle,
	Music2,
	Play,
} from "lucide-react";
import type { LinkCardKind } from "@/app/utils/link-classifier";
import type { CardStyleTokens } from "./types";

type SupportedFormat = "dato" | "nota" | "evento" | "link";

export const LINK_SOURCE_LABELS = {
	extruct: "OG",
	yt_dlp: "YT-DLP",
	mixed: "Mixto",
} as const;

export const LINK_KIND_LABELS: Record<LinkCardKind, string> = {
	web: "Web",
	video: "Video",
	youtube_playlist: "YouTube Playlist",
	location: "Ubicacion",
	reel: "Reel",
	social: "Social",
	spotify: "Spotify",
};

export const LINK_KIND_ICONS: Record<LinkCardKind, LucideIcon> = {
	web: Globe,
	video: Clapperboard,
	youtube_playlist: ListVideo,
	location: MapPin,
	reel: Play,
	social: MessageCircle,
	spotify: Music2,
};

export const LINK_KIND_STYLES: Record<LinkCardKind, CardStyleTokens> = {
	web: {
		bg: "bg-gradient-to-br from-sky-50 via-cyan-50 to-indigo-100 dark:from-slate-900 dark:via-sky-950/30 dark:to-indigo-950/30",
		border: "border-sky-200 dark:border-sky-800",
		iconBg: "bg-sky-100 dark:bg-sky-900/40",
		iconColor: "text-sky-700 dark:text-sky-300",
		tagBg: "bg-sky-100/60 dark:bg-sky-900/30",
	},
	video: {
		bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-100 dark:from-slate-900 dark:via-rose-950/30 dark:to-amber-950/30",
		border: "border-orange-200 dark:border-orange-800",
		iconBg: "bg-orange-100 dark:bg-orange-900/40",
		iconColor: "text-orange-700 dark:text-orange-300",
		tagBg: "bg-orange-100/60 dark:bg-orange-900/30",
	},
	youtube_playlist: {
		bg: "bg-gradient-to-br from-red-50 via-orange-50 to-amber-100 dark:from-slate-900 dark:via-red-950/25 dark:to-orange-950/25",
		border: "border-red-200 dark:border-red-800",
		iconBg: "bg-red-100 dark:bg-red-900/40",
		iconColor: "text-red-700 dark:text-red-300",
		tagBg: "bg-red-100/60 dark:bg-red-900/30",
	},
	location: {
		bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-emerald-950/25 dark:to-cyan-950/30",
		border: "border-emerald-200 dark:border-emerald-800",
		iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
		iconColor: "text-emerald-700 dark:text-emerald-300",
		tagBg: "bg-emerald-100/60 dark:bg-emerald-900/30",
	},
	reel: {
		bg: "bg-gradient-to-br from-rose-50 via-fuchsia-50 to-orange-100 dark:from-slate-900 dark:via-fuchsia-950/25 dark:to-rose-950/30",
		border: "border-rose-200 dark:border-rose-800",
		iconBg: "bg-rose-100 dark:bg-rose-900/40",
		iconColor: "text-rose-700 dark:text-rose-300",
		tagBg: "bg-rose-100/60 dark:bg-rose-900/30",
	},
	social: {
		bg: "bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-100 dark:from-slate-900 dark:via-indigo-950/25 dark:to-cyan-950/30",
		border: "border-indigo-200 dark:border-indigo-800",
		iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
		iconColor: "text-indigo-700 dark:text-indigo-300",
		tagBg: "bg-indigo-100/60 dark:bg-indigo-900/30",
	},
	spotify: {
		bg: "bg-gradient-to-br from-emerald-50 via-lime-50 to-teal-100 dark:from-slate-900 dark:via-emerald-950/30 dark:to-lime-950/25",
		border: "border-emerald-200 dark:border-emerald-800",
		iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
		iconColor: "text-emerald-700 dark:text-emerald-300",
		tagBg: "bg-emerald-100/60 dark:bg-emerald-900/30",
	},
};

export const LINK_KIND_ACCENT_BAR: Record<LinkCardKind, string> = {
	web: "bg-gradient-to-r from-sky-300/80 via-cyan-300/80 to-indigo-300/80 dark:from-sky-700/70 dark:via-cyan-700/70 dark:to-indigo-700/70",
	video:
		"bg-gradient-to-r from-orange-300/80 via-rose-300/80 to-amber-300/80 dark:from-orange-700/70 dark:via-rose-700/70 dark:to-amber-700/70",
	youtube_playlist:
		"bg-gradient-to-r from-red-300/80 via-orange-300/80 to-amber-300/80 dark:from-red-700/70 dark:via-orange-700/70 dark:to-amber-700/70",
	location:
		"bg-gradient-to-r from-emerald-300/80 via-teal-300/80 to-cyan-300/80 dark:from-emerald-700/70 dark:via-teal-700/70 dark:to-cyan-700/70",
	reel: "bg-gradient-to-r from-rose-300/80 via-fuchsia-300/80 to-orange-300/80 dark:from-rose-700/70 dark:via-fuchsia-700/70 dark:to-orange-700/70",
	social:
		"bg-gradient-to-r from-indigo-300/80 via-sky-300/80 to-cyan-300/80 dark:from-indigo-700/70 dark:via-sky-700/70 dark:to-cyan-700/70",
	spotify:
		"bg-gradient-to-r from-emerald-300/80 via-lime-300/80 to-teal-300/80 dark:from-emerald-700/70 dark:via-lime-700/70 dark:to-teal-700/70",
};

const FORMAT_STYLES: Record<SupportedFormat, CardStyleTokens> = {
	dato: {
		bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40",
		border: "border-blue-200 dark:border-blue-800",
		iconBg: "bg-blue-100 dark:bg-blue-900/40",
		iconColor: "text-blue-600 dark:text-blue-400",
		tagBg: "bg-blue-100/50 dark:bg-blue-900/30",
	},
	nota: {
		bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/40",
		border: "border-amber-200 dark:border-amber-800",
		iconBg: "bg-amber-100 dark:bg-amber-900/40",
		iconColor: "text-amber-600 dark:text-amber-400",
		tagBg: "bg-amber-100/50 dark:bg-amber-900/30",
	},
	evento: {
		bg: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/40 dark:to-cyan-900/40",
		border: "border-cyan-200 dark:border-cyan-800",
		iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
		iconColor: "text-cyan-600 dark:text-cyan-400",
		tagBg: "bg-cyan-100/50 dark:bg-cyan-900/30",
	},
	link: LINK_KIND_STYLES.web,
};

export function getBaseStyleForItem(format: string): CardStyleTokens {
	if (format in FORMAT_STYLES) {
		return FORMAT_STYLES[format as SupportedFormat];
	}

	return FORMAT_STYLES.dato;
}
