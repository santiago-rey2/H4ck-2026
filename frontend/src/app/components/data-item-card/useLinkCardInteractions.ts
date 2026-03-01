import type {
	Dispatch,
	KeyboardEvent,
	MouseEvent,
	SetStateAction,
} from "react";
import type { LinkMediaCandidate } from "./types";

interface OpenLinkViewerPayload {
	iframeUrl: string;
	externalUrl: string;
	title: string;
	hostname: string;
}

interface UseLinkCardInteractionsOptions {
	openLinkViewer: (payload: OpenLinkViewerPayload) => void;
	viewerIframeUrl: string | null;
	externalLinkUrl: string | null;
	previewTitle: string;
	displayHostname: string;
	activePreviewMedia: LinkMediaCandidate | null;
	setFailedPreviewMediaUrls: Dispatch<SetStateAction<string[]>>;
	setMapSnapshotFailed: Dispatch<SetStateAction<boolean>>;
}

interface LinkCardInteractionHandlers {
	onPreviewMediaError: () => void;
	onMapSnapshotError: () => void;
	onCardClick: (event: MouseEvent<HTMLDivElement>) => void;
	onCardKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function useLinkCardInteractions({
	openLinkViewer,
	viewerIframeUrl,
	externalLinkUrl,
	previewTitle,
	displayHostname,
	activePreviewMedia,
	setFailedPreviewMediaUrls,
	setMapSnapshotFailed,
}: UseLinkCardInteractionsOptions): LinkCardInteractionHandlers {
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
		onPreviewMediaError,
		onMapSnapshotError,
		onCardClick,
		onCardKeyDown,
	};
}
