import type { SpotifyResource, SpotifyResourceType } from "./link-types";
import { hostMatchesAny, normalizeLinkTarget } from "./link-url-utils";

const SPOTIFY_DOMAINS = ["open.spotify.com"];

const SPOTIFY_RESOURCE_TYPES = new Set<SpotifyResourceType>([
	"track",
	"album",
	"playlist",
	"artist",
	"show",
	"episode",
]);

function decodeUriComponentSafe(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function isSpotifyResourceType(value: string): value is SpotifyResourceType {
	return SPOTIFY_RESOURCE_TYPES.has(value as SpotifyResourceType);
}

function sanitizeSpotifyResourceId(
	rawValue: string | null | undefined,
): string | null {
	const candidate = rawValue?.trim();
	if (!candidate) {
		return null;
	}

	if (!/^[A-Za-z0-9]{8,64}$/.test(candidate)) {
		return null;
	}

	return candidate;
}

function parseSpotifyResourceFromUri(rawValue: string): SpotifyResource | null {
	const compactValue = rawValue.trim();
	if (!compactValue.toLowerCase().startsWith("spotify:")) {
		return null;
	}

	const segments = compactValue.split(":").map((segment) => segment.trim());
	if (segments.length < 3) {
		return null;
	}

	const firstType = segments[1]?.toLowerCase() ?? "";
	if (firstType === "user") {
		const playlistMarker = segments[3]?.toLowerCase() ?? "";
		const playlistId = sanitizeSpotifyResourceId(segments[4]);
		if (playlistMarker === "playlist" && playlistId) {
			return {
				type: "playlist",
				id: playlistId,
			};
		}

		return null;
	}

	if (!isSpotifyResourceType(firstType)) {
		return null;
	}

	const resourceId = sanitizeSpotifyResourceId(segments[2]);
	if (!resourceId) {
		return null;
	}

	return {
		type: firstType,
		id: resourceId,
	};
}

function parseSpotifyResourceFromUrl(url: URL): SpotifyResource | null {
	const hostname = url.hostname.toLowerCase();
	if (!hostMatchesAny(hostname, SPOTIFY_DOMAINS)) {
		return null;
	}

	const pathSegments = url.pathname
		.split("/")
		.filter(Boolean)
		.map((segment) => decodeUriComponentSafe(segment));
	if (pathSegments.length < 2) {
		return null;
	}

	let cursor = 0;
	if (/^intl-[a-z]{2}$/i.test(pathSegments[cursor] ?? "")) {
		cursor += 1;
	}

	if ((pathSegments[cursor] ?? "").toLowerCase() === "embed") {
		cursor += 1;
	}

	const firstSegment = (pathSegments[cursor] ?? "").toLowerCase();
	if (firstSegment === "user") {
		const legacyPlaylistMarker = (pathSegments[cursor + 2] ?? "").toLowerCase();
		const legacyPlaylistId = sanitizeSpotifyResourceId(
			pathSegments[cursor + 3],
		);
		if (legacyPlaylistMarker === "playlist" && legacyPlaylistId) {
			return {
				type: "playlist",
				id: legacyPlaylistId,
			};
		}

		return null;
	}

	const resourceType = firstSegment;
	const resourceId = sanitizeSpotifyResourceId(pathSegments[cursor + 1]);
	if (!resourceType || !resourceId) {
		return null;
	}

	if (!isSpotifyResourceType(resourceType)) {
		return null;
	}

	return {
		type: resourceType,
		id: resourceId,
	};
}

function parseSpotifyResourceFromRaw(
	rawValue: string | null | undefined,
): SpotifyResource | null {
	const trimmedValue = rawValue?.trim();
	if (!trimmedValue) {
		return null;
	}

	const fromUri = parseSpotifyResourceFromUri(trimmedValue);
	if (fromUri) {
		return fromUri;
	}

	const normalized = normalizeLinkTarget(trimmedValue);
	if (!normalized) {
		return null;
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(normalized);
	} catch {
		return null;
	}

	return parseSpotifyResourceFromUrl(parsedUrl);
}

export function extractSpotifyResource(
	rawValue: string | null | undefined,
): SpotifyResource | null {
	return parseSpotifyResourceFromRaw(rawValue);
}

export function isSpotifyUrl(url: URL): boolean {
	return parseSpotifyResourceFromUrl(url) !== null;
}

export function buildSpotifyEmbedUrl(
	rawValue: string | null | undefined,
): string | null {
	const spotifyResource = extractSpotifyResource(rawValue);
	if (!spotifyResource) {
		return null;
	}

	const embedUrl = new URL(
		`https://open.spotify.com/embed/${spotifyResource.type}/${spotifyResource.id}`,
	);

	const normalizedUrl = normalizeLinkTarget(rawValue);
	if (normalizedUrl) {
		try {
			const parsedUrl = new URL(normalizedUrl);
			const timestampSeconds = Number.parseInt(
				parsedUrl.searchParams.get("t") ?? "",
				10,
			);
			if (Number.isFinite(timestampSeconds) && timestampSeconds > 0) {
				embedUrl.searchParams.set("t", String(timestampSeconds));
			}
		} catch {
			return embedUrl.toString();
		}
	}

	return embedUrl.toString();
}
