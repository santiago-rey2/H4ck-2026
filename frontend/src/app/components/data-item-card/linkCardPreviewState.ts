import type { LinkPreviewDto } from "@/app/api/items.service";
import type { DataItem } from "@/app/types/data";
import {
	buildOpenStreetMapTileSnapshotUrls,
	extractYouTubeVideoId,
	getDisplayHostname,
	isConsentLikeTitle,
} from "@/app/utils/link-classifier";
import type { LinkClassification } from "@/app/utils/link-types";
import {
	buildPreviewMediaCandidates,
	isGenericSeedLinkDescription,
} from "./linkCardModelHelpers";
import type { LinkMediaCandidate } from "./types";

interface BuildLinkCardPreviewStateOptions {
	item: DataItem;
	linkPreview: LinkPreviewDto | null | undefined;
	linkClassification: LinkClassification;
	linkPlatform: string | null;
	locationName: string | null;
	externalLinkUrl: string | null;
	viewerIframeUrl: string | null;
	resolvedPreviewTarget: string | null;
	previewSourceUrl: string | null;
	mapSnapshotFailed: boolean;
	failedPreviewMediaUrls: string[];
	isLinkPreviewLoading: boolean;
}

export interface LinkCardPreviewState {
	displayLinkUrl: string;
	displayHostname: string;
	previewTitle: string;
	previewDescription: string | null;
	activePreviewMedia: LinkMediaCandidate | null;
	showPreviewImage: boolean;
	activePreviewMediaUrl: string | null;
	isIconLikeMedia: boolean;
	hasPreviewPayload: boolean;
	isPreviewLoading: boolean;
	isPreviewRefreshing: boolean;
	locationSnapshotTiles: string[] | null;
	hasLocationSnapshot: boolean;
	mediaCandidateSignature: string;
	locationSnapshotSignature: string;
}

export function buildLinkCardPreviewState({
	item,
	linkPreview,
	linkClassification,
	linkPlatform,
	locationName,
	externalLinkUrl,
	viewerIframeUrl,
	resolvedPreviewTarget,
	previewSourceUrl,
	mapSnapshotFailed,
	failedPreviewMediaUrls,
	isLinkPreviewLoading,
}: BuildLinkCardPreviewStateOptions): LinkCardPreviewState {
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
	const isGenericSeedDescription =
		isGenericSeedLinkDescription(itemDescription);
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
	const previewMediaCandidates = buildPreviewMediaCandidates({
		linkKind: linkClassification.kind,
		youtubeVideoId,
		previewImageUrl,
		previewLogoUrl,
		previewFaviconUrl,
	});

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

	return {
		displayLinkUrl,
		displayHostname,
		previewTitle,
		previewDescription,
		activePreviewMedia,
		showPreviewImage,
		activePreviewMediaUrl,
		isIconLikeMedia,
		hasPreviewPayload,
		isPreviewLoading,
		isPreviewRefreshing,
		locationSnapshotTiles,
		hasLocationSnapshot,
		mediaCandidateSignature,
		locationSnapshotSignature,
	};
}
