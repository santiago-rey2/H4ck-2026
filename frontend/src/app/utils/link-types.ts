export type LinkCardKind =
	| "web"
	| "video"
	| "youtube_playlist"
	| "location"
	| "reel"
	| "social"
	| "spotify";

export interface LinkClassification {
	kind: LinkCardKind;
	platform: string | null;
	normalizedUrl: string | null;
	hostname: string | null;
}

export type SpotifyResourceType =
	| "track"
	| "album"
	| "playlist"
	| "artist"
	| "show"
	| "episode";

export interface SpotifyResource {
	type: SpotifyResourceType;
	id: string;
}
