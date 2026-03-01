import type { LinkCardKind, SpotifyResourceType } from "@/app/utils/link-types";
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

interface BuildLinkKindHintOptions {
	linkKind: LinkCardKind;
	hasYouTubeVideoEmbed: boolean;
	spotifyResourceType: SpotifyResourceType | null;
	locationName: string | null;
}

interface BuildInlinePlayerHeightClassOptions {
	linkKind: LinkCardKind;
	hasInlinePlayerEmbedUrl: boolean;
	spotifyResourceType: SpotifyResourceType | null;
}

interface BuildPreviewMediaCandidatesOptions {
	linkKind: LinkCardKind;
	youtubeVideoId: string | null;
	previewImageUrl: string | null;
	previewLogoUrl: string | null;
	previewFaviconUrl: string | null;
}

export function isGenericSeedLinkDescription(
	description: string | null,
): boolean {
	return Boolean(description?.startsWith(GENERIC_SEED_LINK_DESCRIPTION_PREFIX));
}

export function buildLinkKindHint({
	linkKind,
	hasYouTubeVideoEmbed,
	spotifyResourceType,
	locationName,
}: BuildLinkKindHintOptions): string {
	if (linkKind === "video") {
		return hasYouTubeVideoEmbed ? "Video de YouTube" : "Contenido audiovisual";
	}

	if (linkKind === "youtube_playlist") {
		return "Playlist de YouTube";
	}

	if (linkKind === "spotify") {
		return spotifyResourceType
			? `Spotify · ${SPOTIFY_RESOURCE_HINTS[spotifyResourceType]}`
			: "Musica o podcast";
	}

	if (linkKind === "location") {
		return locationName
			? `Vista de ubicacion · ${locationName}`
			: "Vista de ubicacion";
	}

	if (linkKind === "reel") {
		return hasYouTubeVideoEmbed ? "Short de YouTube" : "Contenido corto";
	}

	if (linkKind === "social") {
		return "Publicacion social";
	}

	return "Sitio o documentacion";
}

export function buildInlinePlayerHeightClass({
	linkKind,
	hasInlinePlayerEmbedUrl,
	spotifyResourceType,
}: BuildInlinePlayerHeightClassOptions): string | null {
	if (linkKind === "spotify") {
		if (
			hasInlinePlayerEmbedUrl &&
			spotifyResourceType &&
			SPOTIFY_TALL_EMBED_TYPES.has(spotifyResourceType)
		) {
			return "h-[352px]";
		}

		return "h-[152px]";
	}

	if (linkKind === "youtube_playlist") {
		return "h-[312px]";
	}

	return null;
}

export function buildMediaHeightClass(linkKind: LinkCardKind): string {
	if (linkKind === "reel") {
		return "h-72 sm:h-80";
	}

	if (linkKind === "video") {
		return "h-48 sm:h-56";
	}

	if (linkKind === "youtube_playlist") {
		return "h-40 sm:h-44";
	}

	if (linkKind === "spotify") {
		return "h-36 sm:h-40";
	}

	return "h-36 sm:h-44";
}

export function buildPreviewMediaCandidates({
	linkKind,
	youtubeVideoId,
	previewImageUrl,
	previewLogoUrl,
	previewFaviconUrl,
}: BuildPreviewMediaCandidatesOptions): LinkMediaCandidate[] {
	const previewMediaCandidates: LinkMediaCandidate[] = [];
	const seenMediaCandidates = new Set<string>();
	const youtubeHdImageCandidates =
		(linkKind === "video" || linkKind === "reel") && youtubeVideoId
			? [
					`https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
					`https://i.ytimg.com/vi/${youtubeVideoId}/sddefault.jpg`,
					`https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
				]
			: [];

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

	return previewMediaCandidates;
}
