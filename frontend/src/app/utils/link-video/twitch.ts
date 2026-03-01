import { hostMatches, normalizeLinkTarget } from "../link-url-utils";

const TWITCH_RESERVED_PATH_SEGMENTS = new Set([
	"directory",
	"downloads",
	"inventory",
	"jobs",
	"messages",
	"payments",
	"p",
	"search",
	"settings",
	"store",
	"subscriptions",
	"turbo",
	"videos",
	"wallet",
]);

export function isTwitchVideoUrl(url: URL): boolean {
	return hostMatches(url.hostname.toLowerCase(), "twitch.tv");
}

function buildTwitchClipEmbedUrl(clipSlug: string): string | null {
	const normalizedSlug = clipSlug.trim();
	if (!normalizedSlug) {
		return null;
	}

	const embedUrl = new URL("https://clips.twitch.tv/embed");
	embedUrl.searchParams.set("clip", normalizedSlug);
	embedUrl.searchParams.set("parent", "localhost");

	if (typeof window !== "undefined") {
		const parentDomain = window.location.hostname.trim();
		if (parentDomain) {
			embedUrl.searchParams.set("parent", parentDomain);
		}
	}

	return embedUrl.toString();
}

function buildTwitchVideoEmbedUrl(
	identifierKey: "channel" | "video",
	identifierValue: string,
): string | null {
	const normalizedIdentifier = identifierValue.trim();
	if (!normalizedIdentifier) {
		return null;
	}

	const embedUrl = new URL("https://player.twitch.tv/");
	embedUrl.searchParams.set(identifierKey, normalizedIdentifier);
	embedUrl.searchParams.set("parent", "localhost");

	if (typeof window !== "undefined") {
		const parentDomain = window.location.hostname.trim();
		if (parentDomain) {
			embedUrl.searchParams.set("parent", parentDomain);
		}
	}

	return embedUrl.toString();
}

export function buildTwitchEmbedUrl(
	rawValue: string | null | undefined,
): string | null {
	const normalized = normalizeLinkTarget(rawValue);
	if (!normalized) {
		return null;
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(normalized);
	} catch {
		return null;
	}

	const hostname = parsedUrl.hostname.toLowerCase();
	if (!hostMatches(hostname, "twitch.tv")) {
		return null;
	}

	const pathSegments = parsedUrl.pathname
		.split("/")
		.filter(Boolean)
		.map((segment) => decodeURIComponent(segment));
	if (pathSegments.length === 0) {
		return null;
	}

	if (hostMatches(hostname, "clips.twitch.tv")) {
		const clipSlug = pathSegments[0];
		return clipSlug ? buildTwitchClipEmbedUrl(clipSlug) : null;
	}

	const [firstSegment, secondSegment, thirdSegment] = pathSegments;
	const normalizedFirstSegment = firstSegment.toLowerCase();

	if (normalizedFirstSegment === "videos") {
		if (secondSegment && /^\d+$/.test(secondSegment)) {
			return buildTwitchVideoEmbedUrl("video", `v${secondSegment}`);
		}

		return null;
	}

	if (normalizedFirstSegment === "clip") {
		return secondSegment ? buildTwitchClipEmbedUrl(secondSegment) : null;
	}

	if (secondSegment?.toLowerCase() === "clip") {
		return thirdSegment ? buildTwitchClipEmbedUrl(thirdSegment) : null;
	}

	if (TWITCH_RESERVED_PATH_SEGMENTS.has(normalizedFirstSegment)) {
		return null;
	}

	return buildTwitchVideoEmbedUrl("channel", firstSegment);
}
