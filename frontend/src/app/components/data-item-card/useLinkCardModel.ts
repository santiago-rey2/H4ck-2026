import { useSetAtom } from "jotai";
import type { KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";
import { openLinkViewerAtom } from "@/app/atoms";
import { useItemLinkPreview } from "@/app/hooks/useItemLinkPreview";
import type { DataItem } from "@/app/types/data";
import type { LinkCardKind, SpotifyResourceType } from "@/app/utils/link-types";
import {
	buildInlinePlayerHeightClass,
	buildLinkKindHint,
	buildMediaHeightClass,
} from "./linkCardModelHelpers";
import { buildLinkCardPreviewState } from "./linkCardPreviewState";
import { resolveLinkCardContent } from "./linkCardResolution";
import {
	LINK_KIND_ICONS,
	LINK_KIND_LABELS,
	LINK_KIND_STYLES,
	LINK_SOURCE_LABELS,
} from "./styles";
import { useLinkCardInteractions } from "./useLinkCardInteractions";
import { useLinkCardResetState } from "./useLinkCardResetState";

export interface LinkCardModel {
	linkKind: LinkCardKind;
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

	const {
		previewSourceUrl,
		resolvedPreviewTarget,
		externalLinkUrl,
		linkClassification,
		locationName,
		youTubeVideoEmbedUrl,
		spotifyResource,
		inlinePlayerEmbedUrl,
		viewerIframeUrl,
	} = resolveLinkCardContent(item, linkPreview);

	const styles = LINK_KIND_STYLES[linkClassification.kind];
	const linkKindLabel = LINK_KIND_LABELS[linkClassification.kind];
	const LinkKindIcon = LINK_KIND_ICONS[linkClassification.kind];
	const linkPlatform = linkClassification.platform;

	const {
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
	} = buildLinkCardPreviewState({
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
	});
	const previewSourceLabel = linkPreview?.source
		? LINK_SOURCE_LABELS[linkPreview.source]
		: null;

	const linkKindHint = buildLinkKindHint({
		linkKind: linkClassification.kind,
		hasYouTubeVideoEmbed: Boolean(youTubeVideoEmbedUrl),
		spotifyResourceType: spotifyResource?.type ?? null,
		locationName,
	});

	const showPlayOverlay =
		linkClassification.kind === "video" || linkClassification.kind === "reel";
	const showLocationPlaceholder =
		linkClassification.kind === "location" && !hasLocationSnapshot;
	const showSocialPlaceholder = linkClassification.kind === "social";
	const showYouTubePlaylistPlaceholder =
		linkClassification.kind === "youtube_playlist" && !inlinePlayerEmbedUrl;
	const inlinePlayerHeightClass = buildInlinePlayerHeightClass({
		linkKind: linkClassification.kind,
		hasInlinePlayerEmbedUrl: Boolean(inlinePlayerEmbedUrl),
		spotifyResourceType: spotifyResource?.type ?? null,
	});
	const mediaHeightClass = buildMediaHeightClass(linkClassification.kind);

	useLinkCardResetState({
		mediaCandidateSignature,
		locationSnapshotSignature,
		setFailedPreviewMediaUrls,
		setMapSnapshotFailed,
	});

	const {
		onPreviewMediaError,
		onMapSnapshotError,
		onCardClick,
		onCardKeyDown,
	} = useLinkCardInteractions({
		openLinkViewer,
		viewerIframeUrl,
		externalLinkUrl,
		previewTitle,
		displayHostname,
		activePreviewMedia,
		setFailedPreviewMediaUrls,
		setMapSnapshotFailed,
	});

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
