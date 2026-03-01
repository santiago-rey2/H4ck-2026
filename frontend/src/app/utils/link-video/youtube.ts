import { hostMatches, normalizeLinkTarget } from "../link-url-utils";

function isYouTubeHost(hostname: string): boolean {
	return (
		hostMatches(hostname, "youtube.com") || hostMatches(hostname, "youtu.be")
	);
}

function sanitizeYouTubeId(rawValue: string | null | undefined): string | null {
	const candidate = rawValue?.trim();
	if (!candidate) {
		return null;
	}

	const cleaned = candidate.split(/[?/&#]/, 1)[0];
	if (!/^[A-Za-z0-9_-]{6,15}$/.test(cleaned)) {
		return null;
	}

	return cleaned;
}

function parseColonTimestampToSeconds(value: string): number | null {
	const segments = value
		.split(":")
		.map((segment) => Number.parseInt(segment, 10));
	if (segments.some((segment) => !Number.isFinite(segment) || segment < 0)) {
		return null;
	}

	if (segments.length === 2) {
		const [minutes, seconds] = segments;
		if (seconds >= 60) {
			return null;
		}

		return minutes * 60 + seconds;
	}

	if (segments.length === 3) {
		const [hours, minutes, seconds] = segments;
		if (minutes >= 60 || seconds >= 60) {
			return null;
		}

		return hours * 3600 + minutes * 60 + seconds;
	}

	return null;
}

function parseYouTubeTimestampToSeconds(
	rawValue: string | null | undefined,
): number | null {
	const candidate = rawValue?.trim().toLowerCase();
	if (!candidate) {
		return null;
	}

	if (/^\d+$/.test(candidate)) {
		const parsed = Number.parseInt(candidate, 10);
		return parsed > 0 ? parsed : null;
	}

	if (/^\d{1,3}:\d{1,2}(?::\d{1,2})?$/.test(candidate)) {
		const parsed = parseColonTimestampToSeconds(candidate);
		return parsed && parsed > 0 ? parsed : null;
	}

	let totalSeconds = 0;
	let hasUnitMatch = false;
	const unitRegex = /(\d+)\s*(h|m|s)/g;
	for (const match of candidate.matchAll(unitRegex)) {
		const amount = Number.parseInt(match[1], 10);
		if (!Number.isFinite(amount) || amount < 0) {
			continue;
		}

		hasUnitMatch = true;
		const unit = match[2];
		if (unit === "h") {
			totalSeconds += amount * 3600;
			continue;
		}

		if (unit === "m") {
			totalSeconds += amount * 60;
			continue;
		}

		totalSeconds += amount;
	}

	if (hasUnitMatch && totalSeconds > 0) {
		return totalSeconds;
	}

	return null;
}

function extractYouTubeStartSeconds(parsedUrl: URL): number | null {
	const explicitStart = parseYouTubeTimestampToSeconds(
		parsedUrl.searchParams.get("start"),
	);
	if (explicitStart && explicitStart > 0) {
		return explicitStart;
	}

	const timestampStart = parseYouTubeTimestampToSeconds(
		parsedUrl.searchParams.get("t"),
	);
	if (timestampStart && timestampStart > 0) {
		return timestampStart;
	}

	return null;
}

export function isYouTubePlaylistUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	if (!hostMatches(hostname, "youtube.com")) {
		return false;
	}

	const pathname = url.pathname.toLowerCase();
	if (
		pathname.startsWith("/playlist") ||
		pathname.startsWith("/embed/videoseries")
	) {
		return (
			url.searchParams.has("list") || pathname.startsWith("/embed/videoseries")
		);
	}

	return url.searchParams.has("list");
}

export function isYouTubeVideoUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	const pathname = url.pathname.toLowerCase();

	if (hostMatches(hostname, "youtube.com")) {
		return (
			pathname.startsWith("/watch") ||
			pathname.startsWith("/live") ||
			pathname.startsWith("/embed/") ||
			pathname.startsWith("/playlist")
		);
	}

	if (hostMatches(hostname, "youtu.be")) {
		return pathname.length > 1;
	}

	return false;
}

export function extractYouTubeVideoId(
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
	if (!isYouTubeHost(hostname)) {
		return null;
	}

	if (hostMatches(hostname, "youtu.be")) {
		const shortId = parsedUrl.pathname.split("/").filter(Boolean)[0];
		return sanitizeYouTubeId(shortId);
	}

	const queryId = sanitizeYouTubeId(parsedUrl.searchParams.get("v"));
	if (queryId) {
		return queryId;
	}

	const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
	if (pathSegments.length >= 2) {
		const [firstSegment, secondSegment] = pathSegments;
		if (["embed", "shorts", "live", "v"].includes(firstSegment)) {
			return sanitizeYouTubeId(secondSegment);
		}
	}

	return null;
}

export function buildYouTubeEmbedUrl(
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
	if (!isYouTubeHost(hostname)) {
		return null;
	}

	const videoId = extractYouTubeVideoId(normalized);
	if (!videoId) {
		return buildYouTubePlaylistEmbedUrl(normalized);
	}

	const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);

	const startSeconds = extractYouTubeStartSeconds(parsedUrl);
	if (startSeconds && startSeconds > 0) {
		embedUrl.searchParams.set("start", String(startSeconds));
	}

	const listId = parsedUrl.searchParams.get("list")?.trim();
	if (listId) {
		embedUrl.searchParams.set("list", listId);

		const listIndex = parsedUrl.searchParams.get("index")?.trim();
		if (listIndex && /^\d+$/.test(listIndex)) {
			embedUrl.searchParams.set("index", listIndex);
		}
	}

	return embedUrl.toString();
}

export function buildYouTubePlaylistEmbedUrl(
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

	if (!isYouTubePlaylistUrl(parsedUrl)) {
		return null;
	}

	const listId = parsedUrl.searchParams.get("list")?.trim();
	if (!listId) {
		return null;
	}

	const embedUrl = new URL("https://www.youtube.com/embed/videoseries");
	embedUrl.searchParams.set("list", listId);

	const listIndex = parsedUrl.searchParams.get("index")?.trim();
	if (listIndex && /^\d+$/.test(listIndex)) {
		embedUrl.searchParams.set("index", listIndex);
	}

	const startSeconds = extractYouTubeStartSeconds(parsedUrl);
	if (startSeconds && startSeconds > 0) {
		embedUrl.searchParams.set("start", String(startSeconds));
	}

	return embedUrl.toString();
}
