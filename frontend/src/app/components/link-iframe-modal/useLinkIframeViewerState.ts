import { useCallback, useEffect, useRef, useState } from "react";

const IFRAME_BLOCK_DETECTION_MS = 4500;

interface UseLinkIframeViewerStateOptions {
	open: boolean;
	iframeUrl: string | null;
	onClose: () => void;
}

export function useLinkIframeViewerState({
	open,
	iframeUrl,
	onClose,
}: UseLinkIframeViewerStateOptions) {
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const timeoutRef = useRef<number | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);

	const clearFallbackTimeout = useCallback(() => {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	useEffect(() => {
		void reloadKey;

		if (!open || !iframeUrl) {
			clearFallbackTimeout();
			setIsLoading(false);
			setIsBlocked(false);
			return;
		}

		setIsLoading(true);
		setIsBlocked(false);
		clearFallbackTimeout();

		timeoutRef.current = window.setTimeout(() => {
			setIsLoading(false);
			setIsBlocked(true);
		}, IFRAME_BLOCK_DETECTION_MS);

		return clearFallbackTimeout;
	}, [open, iframeUrl, reloadKey, clearFallbackTimeout]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const onEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", onEscape);
		return () => {
			window.removeEventListener("keydown", onEscape);
		};
	}, [onClose, open]);

	const handleFrameLoad = () => {
		clearFallbackTimeout();
		setIsLoading(false);

		const iframe = iframeRef.current;
		if (!iframe) {
			return;
		}

		try {
			const href = iframe.contentWindow?.location.href;
			if (href === "about:blank") {
				setIsBlocked(true);
				return;
			}
		} catch {}

		setIsBlocked(false);
	};

	const handleFrameError = () => {
		clearFallbackTimeout();
		setIsLoading(false);
		setIsBlocked(true);
	};

	const handleRetry = () => {
		setReloadKey((currentKey) => currentKey + 1);
	};

	return {
		iframeRef,
		reloadKey,
		isLoading,
		isBlocked,
		handleFrameLoad,
		handleFrameError,
		handleRetry,
	};
}
