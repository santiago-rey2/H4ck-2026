import { useSetAtom } from "jotai";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { openLinkViewerAtom } from "@/app/atoms";
import { useItemLinkPreview } from "@/app/hooks/useDataItems";
import type { DataItem } from "@/app/types/data";
import {
	buildOpenStreetMapEmbedUrl,
	buildOpenStreetMapTileSnapshotUrls,
	buildYouTubeEmbedUrl,
	classifyLinkTarget,
	extractLocationName,
	extractYouTubeVideoId,
	getDisplayHostname,
	isConsentGatewayUrl,
	isConsentLikeTitle,
	normalizeLinkTarget,
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

export interface LinkCardModel {
	linkKind: "web" | "video" | "location" | "reel" | "social";
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

	const fallbackLinkUrl = normalizeLinkTarget(item.texto);
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
	const youtubeEmbedUrl =
		linkClassification.kind === "video" || linkClassification.kind === "reel"
			? buildYouTubeEmbedUrl(
					resolvedPreviewTarget ??
						previewSourceUrl ??
						externalLinkUrl ??
						item.texto,
				)
			: null;
	const viewerIframeUrl =
		linkClassification.kind === "location"
			? (locationEmbedUrl ?? linkTargetUrl)
			: (youtubeEmbedUrl ?? linkTargetUrl);

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
			? "Contenido audiovisual"
			: linkClassification.kind === "location"
				? locationName
					? `Vista de ubicacion · ${locationName}`
					: "Vista de ubicacion"
				: linkClassification.kind === "reel"
					? "Contenido corto"
					: linkClassification.kind === "social"
						? "Publicacion social"
						: "Sitio o documentacion";

	const showPlayOverlay =
		linkClassification.kind === "video" || linkClassification.kind === "reel";
	const showLocationPlaceholder =
		linkClassification.kind === "location" && !hasLocationSnapshot;
	const showSocialPlaceholder = linkClassification.kind === "social";
	const mediaHeightClass =
		linkClassification.kind === "reel"
			? "h-72 sm:h-80"
			: linkClassification.kind === "video"
				? "h-48 sm:h-56"
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
