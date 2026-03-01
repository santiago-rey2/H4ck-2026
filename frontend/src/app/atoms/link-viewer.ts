import { atom } from "jotai";

export interface LinkViewerState {
	open: boolean;
	iframeUrl: string | null;
	externalUrl: string | null;
	title: string | null;
	hostname: string | null;
}

export const linkViewerAtom = atom<LinkViewerState>({
	open: false,
	iframeUrl: null,
	externalUrl: null,
	title: null,
	hostname: null,
});

export const openLinkViewerAtom = atom(
	null,
	(
		_get,
		set,
		payload: {
			iframeUrl: string;
			externalUrl?: string | null;
			title?: string | null;
			hostname?: string | null;
		},
	) => {
		set(linkViewerAtom, {
			open: true,
			iframeUrl: payload.iframeUrl,
			externalUrl: payload.externalUrl ?? payload.iframeUrl,
			title: payload.title ?? null,
			hostname: payload.hostname ?? null,
		});
	},
);

export const closeLinkViewerAtom = atom(null, (get, set) => {
	const current = get(linkViewerAtom);
	set(linkViewerAtom, {
		...current,
		open: false,
	});
});
