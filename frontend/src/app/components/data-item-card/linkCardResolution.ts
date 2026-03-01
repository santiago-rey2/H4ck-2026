import type { LinkPreviewDto } from "@/app/api/items.service";
import type { DataItem } from "@/app/types/data";
import {
	buildOpenStreetMapEmbedUrl,
	buildSpotifyEmbedUrl,
	buildVideoEmbedUrl,
	buildYouTubeEmbedUrl,
	buildYouTubePlaylistEmbedUrl,
	classifyLinkTarget,
	extractLocationName,
	extractSpotifyResource,
	isConsentGatewayUrl,
	normalizeLinkTarget,
} from "@/app/utils/link-classifier";
import type {
	LinkClassification,
	SpotifyResource,
} from "@/app/utils/link-types";

export interface LinkCardResolution {
	fallbackLinkUrl: string | null;
	previewSourceUrl: string | null;
	resolvedPreviewTarget: string | null;
	externalLinkUrl: string | null;
	linkClassification: LinkClassification;
	locationName: string | null;
	youTubeVideoEmbedUrl: string | null;
	spotifyResource: SpotifyResource | null;
	inlinePlayerEmbedUrl: string | null;
	viewerIframeUrl: string | null;
}

export function resolveLinkCardContent(
	item: DataItem,
	linkPreview: LinkPreviewDto | null | undefined,
): LinkCardResolution {
	const spotifyResourceFromRawValue = extractSpotifyResource(item.texto);
	const spotifyCanonicalUrl = spotifyResourceFromRawValue
		? `https://open.spotify.com/${spotifyResourceFromRawValue.type}/${spotifyResourceFromRawValue.id}`
		: null;
	const fallbackLinkUrl =
		normalizeLinkTarget(item.texto) ?? spotifyCanonicalUrl;
	const previewSourceUrl = normalizeLinkTarget(linkPreview?.url ?? null);
	const rawPreviewTarget = normalizeLinkTarget(
		linkPreview?.final_url ?? linkPreview?.url ?? item.texto,
	);
	const resolvedPreviewTarget =
		rawPreviewTarget && !isConsentGatewayUrl(rawPreviewTarget)
			? rawPreviewTarget
			: null;
	const linkTargetUrl =
		resolvedPreviewTarget ??
		previewSourceUrl ??
		fallbackLinkUrl ??
		rawPreviewTarget;
	const externalLinkUrl =
		fallbackLinkUrl ?? previewSourceUrl ?? rawPreviewTarget ?? linkTargetUrl;
	const primaryEmbedSource =
		externalLinkUrl ?? fallbackLinkUrl ?? previewSourceUrl ?? item.texto;
	const secondaryEmbedSource =
		resolvedPreviewTarget ?? previewSourceUrl ?? rawPreviewTarget ?? item.texto;

	const rawLinkClassification = classifyLinkTarget(item.texto);
	const resolvedLinkClassification = classifyLinkTarget(
		resolvedPreviewTarget ?? previewSourceUrl ?? item.texto,
	);
	const linkClassification =
		rawLinkClassification.kind === "web" &&
		resolvedLinkClassification.kind !== "web"
			? resolvedLinkClassification
			: rawLinkClassification;

	const locationName =
		linkClassification.kind === "location"
			? extractLocationName(externalLinkUrl ?? linkPreview?.url ?? item.texto)
			: null;
	const locationEmbedUrl =
		linkClassification.kind === "location"
			? buildOpenStreetMapEmbedUrl(
					externalLinkUrl ?? linkPreview?.url ?? item.texto,
				)
			: null;
	const providerEmbedUrl =
		linkClassification.kind === "video" || linkClassification.kind === "reel"
			? buildVideoEmbedUrl(
					resolvedPreviewTarget ??
						previewSourceUrl ??
						externalLinkUrl ??
						item.texto,
				)
			: null;
	const youTubeVideoEmbedUrl =
		linkClassification.kind === "video" || linkClassification.kind === "reel"
			? (buildYouTubeEmbedUrl(primaryEmbedSource) ??
				buildYouTubeEmbedUrl(secondaryEmbedSource))
			: null;
	const spotifyEmbedUrl =
		linkClassification.kind === "spotify"
			? (buildSpotifyEmbedUrl(primaryEmbedSource) ??
				buildSpotifyEmbedUrl(secondaryEmbedSource))
			: null;
	const spotifyResource =
		linkClassification.kind === "spotify"
			? (extractSpotifyResource(primaryEmbedSource) ??
				extractSpotifyResource(secondaryEmbedSource))
			: null;
	const youTubePlaylistEmbedUrl =
		linkClassification.kind === "youtube_playlist"
			? (buildYouTubePlaylistEmbedUrl(primaryEmbedSource) ??
				buildYouTubePlaylistEmbedUrl(secondaryEmbedSource))
			: null;
	const inlinePlayerEmbedUrl =
		linkClassification.kind === "spotify"
			? spotifyEmbedUrl
			: linkClassification.kind === "youtube_playlist"
				? youTubePlaylistEmbedUrl
				: null;
	const usesInlineEmbedMode =
		linkClassification.kind === "spotify" ||
		linkClassification.kind === "youtube_playlist";
	const viewerIframeUrl =
		linkClassification.kind === "location"
			? (locationEmbedUrl ?? linkTargetUrl)
			: linkClassification.kind === "video" ||
					linkClassification.kind === "reel"
				? (youTubeVideoEmbedUrl ?? providerEmbedUrl ?? linkTargetUrl)
				: usesInlineEmbedMode
					? inlinePlayerEmbedUrl
						? null
						: (linkTargetUrl ?? externalLinkUrl ?? fallbackLinkUrl)
					: (providerEmbedUrl ?? linkTargetUrl);

	return {
		fallbackLinkUrl,
		previewSourceUrl,
		resolvedPreviewTarget,
		externalLinkUrl,
		linkClassification,
		locationName,
		youTubeVideoEmbedUrl,
		spotifyResource,
		inlinePlayerEmbedUrl,
		viewerIframeUrl,
	};
}
