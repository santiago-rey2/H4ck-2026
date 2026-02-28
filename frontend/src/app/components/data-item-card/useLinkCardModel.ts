import { useSetAtom } from "jotai";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { openLinkViewerAtom } from "@/app/atoms";
import { useItemLinkPreview } from "@/app/hooks/useDataItems";
import type { DataItem } from "@/app/types/data";
import {
	buildOpenStreetMapEmbedUrl,
	buildOpenStreetMapTileSnapshotUrls,
	buildSpotifyEmbedUrl,
	buildVideoEmbedUrl,
	buildYouTubeEmbedUrl,
	buildYouTubePlaylistEmbedUrl,
	classifyLinkTarget,
	extractLocationName,
	extractSpotifyResource,
	extractYouTubeVideoId,
	getDisplayHostname,
	isConsentGatewayUrl,
	isConsentLikeTitle,
	normalizeLinkTarget,
	type SpotifyResourceType,
} from "@/app/utils/link-classifier";
import {
	LINK_KIND_ICONS,
	LINK_KIND_LABELS,
	LINK_KIND_STYLES,
	LINK_SOURCE_LABELS,
} from "./styles";
import type { LinkMediaCandidate, LinkMediaKind } from "./types";

const GENERIC_SEED_LINK_DESCRIPTION_PREFIX =
	"Referencia externa para pruebas de formato link.";

const SPOTIFY_RESOURCE_HINTS: Record<SpotifyResourceType, string> = {
	track: "Cancion",
	album: "Album",
	playlist: "Playlist",
	artist: "Artista",
	show: "Podcast",
	episode: "Episodio",
};

const SPOTIFY_TALL_EMBED_TYPES = new Set<SpotifyResourceType>([
	"album",
	"playlist",
	"artist",
	"show",
]);

export interface LinkCardModel {
	linkKind:
		| "web"
		| "video"
		| "youtube_playlist"
		| "location"
		| "reel"
		| "social"
		| "spotify";
	styles: (typeof LINK_KIND_STYLES)[keyof typeof LINK_KIND_STYLES];
	linkKindLabel: string;
	LinkKindIcon: (typeof LINK_KIND_ICONS)[keyof typeof LINK_KIND_ICONS];
	linkPlatform: string | null;
	previewSourceLabel: string | null;
	displayHostname: string;
	displayLinkUrl: string;
	previewTitle: string;
	previewDescription: string | null;
	linkKindHint: string;
	showPlayOverlay: boolean;
	showLocationPlaceholder: boolean;
	showSocialPlaceholder: boolean;
	spotifyResourceType: SpotifyResourceType | null;
	showYouTubePlaylistPlaceholder: boolean;
	inlinePlayerEmbedUrl: string | null;
	inlinePlayerHeightClass: string | null;
	mediaHeightClass: string;
	hasLocationSnapshot: boolean;
	locationSnapshotTiles: string[] | null;
	showPreviewImage: boolean;
	isIconLikeMedia: boolean;
	activePreviewMediaUrl: string | null;
	isPreviewLoading: boolean;
	isPreviewRefreshing: boolean;
	hasPreviewPayload: boolean;
	viewerIframeUrl: string | null;
	onPreviewMediaError: () => void;
	onMapSnapshotError: () => void;
	onCardClick: (event: MouseEvent<HTMLDivElement>) => void;
	onCardKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function useLinkCardModel(item: DataItem): LinkCardModel {
	const openLinkViewer = useSetAtom(openLinkViewerAtom);
	const [failedPreviewMediaUrls, setFailedPreviewMediaUrls] = useState<
		string[]
	>([]);
	const [mapSnapshotFailed, setMapSnapshotFailed] = useState(false);
	const { data: linkPreview, isLoading: isLinkPreviewLoading } =
		useItemLinkPreview(item.id, true);

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

	const styles = LINK_KIND_STYLES[linkClassification.kind];
	const linkKindLabel = LINK_KIND_LABELS[linkClassification.kind];
	const LinkKindIcon = LINK_KIND_ICONS[linkClassification.kind];
	const linkPlatform = linkClassification.platform;

	const displayLinkUrl = (
		externalLinkUrl ??
		viewerIframeUrl ??
		item.texto
	).replace(/^https?:\/\//i, "");
	const fallbackHostname = getDisplayHostname(item.texto);
	const previewHostname = getDisplayHostname(
		resolvedPreviewTarget ?? previewSourceUrl ?? externalLinkUrl ?? item.texto,
	);
	const displayHostname = previewHostname ?? fallbackHostname ?? "enlace";

	const previewTitleCandidate = linkPreview?.title?.trim() ?? null;
	const safePreviewTitle =
		previewTitleCandidate && !isConsentLikeTitle(previewTitleCandidate)
			? previewTitleCandidate
			: null;
	const locationTitleFallback =
		linkClassification.kind === "location"
			? locationName
				? locationName
				: `Ubicacion en ${linkPlatform ?? displayHostname}`
			: null;
	const previewTitle =
		safePreviewTitle ||
		item.title?.trim() ||
		locationTitleFallback ||
		displayHostname;

	const previewDescriptionCandidate = linkPreview?.description?.trim() ?? null;
	const safePreviewDescription =
		previewDescriptionCandidate &&
		!isConsentLikeTitle(previewDescriptionCandidate)
			? previewDescriptionCandidate
			: null;
	const itemDescription = item.description?.trim() ?? null;
	const isGenericSeedDescription = Boolean(
		itemDescription?.startsWith(GENERIC_SEED_LINK_DESCRIPTION_PREFIX),
	);
	const previewDescription =
		safePreviewDescription ||
		(linkClassification.kind === "location" || isGenericSeedDescription
			? null
			: itemDescription);

	const previewImageUrl =
		linkPreview?.image?.trim() || item.image?.trim() || null;
	const previewLogoUrl = linkPreview?.logo?.trim() || null;
	const previewFaviconUrl = linkPreview?.favicon?.trim() || null;
	const previewSiteNameCandidate = linkPreview?.site_name?.trim() ?? null;
	const safePreviewSiteName =
		previewSiteNameCandidate && !isConsentLikeTitle(previewSiteNameCandidate)
			? previewSiteNameCandidate
			: null;

	const youtubeVideoId = extractYouTubeVideoId(
		linkPreview?.final_url ?? linkPreview?.url ?? item.texto,
	);
	const youtubeHdImageCandidates =
		(linkClassification.kind === "video" ||
			linkClassification.kind === "reel") &&
		youtubeVideoId
			? [
					`https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
					`https://i.ytimg.com/vi/${youtubeVideoId}/sddefault.jpg`,
					`https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
				]
			: [];

	const previewMediaCandidates: LinkMediaCandidate[] = [];
	const seenMediaCandidates = new Set<string>();
	const pushMediaCandidate = (kind: LinkMediaKind, url: string | null) => {
		if (!url) {
			return;
		}

		const candidateKey = `${kind}:${url}`;
		if (seenMediaCandidates.has(candidateKey)) {
			return;
		}

		seenMediaCandidates.add(candidateKey);
		previewMediaCandidates.push({ kind, url });
	};

	for (const candidate of youtubeHdImageCandidates) {
		pushMediaCandidate("image", candidate);
	}

	pushMediaCandidate("image", previewImageUrl);
	pushMediaCandidate("logo", previewLogoUrl);
	pushMediaCandidate("favicon", previewFaviconUrl);

	const locationSnapshotTiles =
		linkClassification.kind === "location"
			? buildOpenStreetMapTileSnapshotUrls(
					externalLinkUrl ?? linkPreview?.url ?? item.texto,
				)
			: null;
	const hasLocationSnapshot = Boolean(
		locationSnapshotTiles &&
			locationSnapshotTiles.length === 4 &&
			!mapSnapshotFailed,
	);

	const mediaCandidateSignature = previewMediaCandidates
		.map((candidate) => `${candidate.kind}:${candidate.url}`)
		.join("|");
	const locationSnapshotSignature = locationSnapshotTiles?.join("|") ?? "";

	const activePreviewMedia =
		previewMediaCandidates.find(
			(candidate) => !failedPreviewMediaUrls.includes(candidate.url),
		) ?? null;
	const showPreviewImage = Boolean(activePreviewMedia?.url);
	const activePreviewMediaUrl = activePreviewMedia?.url ?? null;
	const isIconLikeMedia =
		activePreviewMedia?.kind === "logo" ||
		activePreviewMedia?.kind === "favicon";

	const hasPreviewPayload = Boolean(
		safePreviewTitle ||
			safePreviewDescription ||
			linkPreview?.image ||
			linkPreview?.logo ||
			linkPreview?.favicon ||
			safePreviewSiteName,
	);
	const hasFallbackPreview = Boolean(
		item.title || item.description || item.image,
	);
	const isPreviewLoading = isLinkPreviewLoading && !hasFallbackPreview;
	const isPreviewRefreshing = isLinkPreviewLoading && hasFallbackPreview;
	const previewSourceLabel = linkPreview?.source
		? LINK_SOURCE_LABELS[linkPreview.source]
		: null;

	const linkKindHint =
		linkClassification.kind === "video"
			? youTubeVideoEmbedUrl
				? "Video de YouTube"
				: "Contenido audiovisual"
			: linkClassification.kind === "youtube_playlist"
				? "Playlist de YouTube"
				: linkClassification.kind === "spotify"
					? spotifyResource
						? `Spotify · ${SPOTIFY_RESOURCE_HINTS[spotifyResource.type]}`
						: "Musica o podcast"
					: linkClassification.kind === "location"
						? locationName
							? `Vista de ubicacion · ${locationName}`
							: "Vista de ubicacion"
						: linkClassification.kind === "reel"
							? youTubeVideoEmbedUrl
								? "Short de YouTube"
								: "Contenido corto"
							: linkClassification.kind === "social"
								? "Publicacion social"
								: "Sitio o documentacion";

	const showPlayOverlay =
		linkClassification.kind === "video" || linkClassification.kind === "reel";
	const showLocationPlaceholder =
		linkClassification.kind === "location" && !hasLocationSnapshot;
	const showSocialPlaceholder = linkClassification.kind === "social";
	const showYouTubePlaylistPlaceholder =
		linkClassification.kind === "youtube_playlist" && !inlinePlayerEmbedUrl;
	const inlinePlayerHeightClass =
		linkClassification.kind === "spotify"
			? inlinePlayerEmbedUrl &&
				spotifyResource &&
				SPOTIFY_TALL_EMBED_TYPES.has(spotifyResource.type)
				? "h-[352px]"
				: "h-[152px]"
			: linkClassification.kind === "youtube_playlist"
				? "h-[312px]"
				: null;
	const mediaHeightClass =
		linkClassification.kind === "reel"
			? "h-72 sm:h-80"
			: linkClassification.kind === "video"
				? "h-48 sm:h-56"
				: linkClassification.kind === "youtube_playlist"
					? "h-40 sm:h-44"
					: linkClassification.kind === "spotify"
						? "h-36 sm:h-40"
						: "h-36 sm:h-44";

	useEffect(() => {
		if (!mediaCandidateSignature) {
			setFailedPreviewMediaUrls([]);
			return;
		}

		setFailedPreviewMediaUrls([]);
	}, [mediaCandidateSignature]);

	useEffect(() => {
		if (!locationSnapshotSignature) {
			setMapSnapshotFailed(false);
			return;
		}

		setMapSnapshotFailed(false);
	}, [locationSnapshotSignature]);

	const openLinkTarget = () => {
		if (!viewerIframeUrl) {
			return;
		}

		openLinkViewer({
			iframeUrl: viewerIframeUrl,
			externalUrl: externalLinkUrl ?? viewerIframeUrl,
			title: previewTitle,
			hostname: displayHostname,
		});
	};

	const onPreviewMediaError = () => {
		if (!activePreviewMedia) {
			return;
		}

		setFailedPreviewMediaUrls((currentUrls) => {
			if (currentUrls.includes(activePreviewMedia.url)) {
				return currentUrls;
			}

			return [...currentUrls, activePreviewMedia.url];
		});
	};

	const onMapSnapshotError = () => {
		setMapSnapshotFailed(true);
	};

	const onCardClick = (event: MouseEvent<HTMLDivElement>) => {
		if (!viewerIframeUrl) {
			return;
		}

		if (
			event.target instanceof HTMLElement &&
			event.target.closest("button, a, input, textarea, select")
		) {
			return;
		}

		openLinkTarget();
	};

	const onCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!viewerIframeUrl || event.target !== event.currentTarget) {
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openLinkTarget();
		}
	};

	return {
		linkKind: linkClassification.kind,
		styles,
		linkKindLabel,
		LinkKindIcon,
		linkPlatform,
		previewSourceLabel,
		displayHostname,
		displayLinkUrl,
		previewTitle,
		previewDescription,
		linkKindHint,
		showPlayOverlay,
		showLocationPlaceholder,
		showSocialPlaceholder,
		spotifyResourceType: spotifyResource?.type ?? null,
		showYouTubePlaylistPlaceholder,
		inlinePlayerEmbedUrl,
		inlinePlayerHeightClass,
		mediaHeightClass,
		hasLocationSnapshot,
		locationSnapshotTiles,
		showPreviewImage,
		isIconLikeMedia,
		activePreviewMediaUrl,
		isPreviewLoading,
		isPreviewRefreshing,
		hasPreviewPayload,
		viewerIframeUrl,
		onPreviewMediaError,
		onMapSnapshotError,
		onCardClick,
		onCardKeyDown,
	};
}
