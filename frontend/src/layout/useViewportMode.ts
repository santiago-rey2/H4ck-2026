import { useEffect, useState } from "react";
import type { ViewportMode } from "./types";

const TABLET_MIN_WIDTH = 768;
const DESKTOP_MIN_WIDTH = 1024;

function getViewportMode(width: number): ViewportMode {
	if (width >= DESKTOP_MIN_WIDTH) {
		return "desktop";
	}

	if (width >= TABLET_MIN_WIDTH) {
		return "tablet";
	}

	return "mobile";
}

export function useViewportMode(): ViewportMode {
	const [viewportMode, setViewportMode] = useState<ViewportMode>(() => {
		if (typeof window === "undefined") {
			return "desktop";
		}

		return getViewportMode(window.innerWidth);
	});

	useEffect(() => {
		const updateViewportMode = () => {
			setViewportMode(getViewportMode(window.innerWidth));
		};

		window.addEventListener("resize", updateViewportMode);
		return () => {
			window.removeEventListener("resize", updateViewportMode);
		};
	}, []);

	return viewportMode;
}
