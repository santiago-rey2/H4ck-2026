import { isLocationUrl } from "./link-location-utils";
import { getPlatformByHostname } from "./link-platform-utils";
import { isSocialUrl } from "./link-social-utils";
import { extractSpotifyResource, isSpotifyUrl } from "./link-spotify-utils";
import type { LinkClassification } from "./link-types";
import { normalizeLinkTarget } from "./link-url-utils";
import {
	isReelUrl,
	isVideoUrl,
	isYouTubePlaylistUrl,
} from "./link-video-utils";

export { isConsentGatewayUrl, isConsentLikeTitle } from "./link-consent-utils";
export {
	buildOpenStreetMapEmbedUrl,
	buildOpenStreetMapTileSnapshotUrls,
	extractLocationCoordinates,
	extractLocationName,
	type LocationCoordinates,
} from "./link-location-utils";
export {
	buildSpotifyEmbedUrl,
	extractSpotifyResource,
} from "./link-spotify-utils";
export type {
	LinkCardKind,
	LinkClassification,
	SpotifyResource,
	SpotifyResourceType,
} from "./link-types";
export { getDisplayHostname, normalizeLinkTarget } from "./link-url-utils";
export {
	buildVideoEmbedUrl,
	buildYouTubeEmbedUrl,
	buildYouTubePlaylistEmbedUrl,
	extractYouTubeVideoId,
} from "./link-video-utils";

export function classifyLinkTarget(
	rawValue: string | null | undefined,
): LinkClassification {
	const spotifyResource = extractSpotifyResource(rawValue);
	const normalizedUrl = normalizeLinkTarget(rawValue);
	if (!normalizedUrl) {
		if (spotifyResource) {
			return {
				kind: "spotify",
				platform: "Spotify",
				normalizedUrl: `https://open.spotify.com/${spotifyResource.type}/${spotifyResource.id}`,
				hostname: "open.spotify.com",
			};
		}

		return {
			kind: "web",
			platform: null,
			normalizedUrl: null,
			hostname: null,
		};
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(normalizedUrl);
	} catch {
		return {
			kind: "web",
			platform: null,
			normalizedUrl,
			hostname: null,
		};
	}

	const hostname = parsedUrl.hostname.toLowerCase();
	const platform = getPlatformByHostname(hostname);

	if (isLocationUrl(parsedUrl)) {
		return {
			kind: "location",
			platform: platform ?? "Mapas",
			normalizedUrl,
			hostname,
		};
	}

	if (isReelUrl(parsedUrl)) {
		return {
			kind: "reel",
			platform: platform ?? "Reel",
			normalizedUrl,
			hostname,
		};
	}

	if (isSpotifyUrl(parsedUrl)) {
		return {
			kind: "spotify",
			platform: platform ?? "Spotify",
			normalizedUrl,
			hostname,
		};
	}

	if (isYouTubePlaylistUrl(parsedUrl)) {
		return {
			kind: "youtube_playlist",
			platform: platform ?? "YouTube",
			normalizedUrl,
			hostname,
		};
	}

	if (isVideoUrl(parsedUrl)) {
		return {
			kind: "video",
			platform: platform ?? "Video",
			normalizedUrl,
			hostname,
		};
	}

	if (isSocialUrl(parsedUrl)) {
		return {
			kind: "social",
			platform: platform ?? "Social",
			normalizedUrl,
			hostname,
		};
	}

	return {
		kind: "web",
		platform,
		normalizedUrl,
		hostname,
	};
}
