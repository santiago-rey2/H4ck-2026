import { hostMatches } from "./link-url-utils";

export function getPlatformByHostname(hostname: string): string | null {
	if (
		hostMatches(hostname, "youtube.com") ||
		hostMatches(hostname, "youtu.be")
	) {
		return "YouTube";
	}
	if (hostMatches(hostname, "twitch.tv")) {
		return "Twitch";
	}
	if (hostMatches(hostname, "instagram.com")) {
		return "Instagram";
	}
	if (hostMatches(hostname, "tiktok.com")) {
		return "TikTok";
	}
	if (hostMatches(hostname, "facebook.com")) {
		return "Facebook";
	}
	if (hostMatches(hostname, "x.com") || hostMatches(hostname, "twitter.com")) {
		return "X";
	}
	if (hostMatches(hostname, "threads.net")) {
		return "Threads";
	}
	if (hostMatches(hostname, "linkedin.com")) {
		return "LinkedIn";
	}
	if (hostMatches(hostname, "spotify.com")) {
		return "Spotify";
	}
	if (
		hostMatches(hostname, "maps.google.com") ||
		hostMatches(hostname, "maps.app.goo.gl") ||
		hostMatches(hostname, "google.com")
	) {
		return "Google Maps";
	}
	if (hostMatches(hostname, "openstreetmap.org")) {
		return "OpenStreetMap";
	}
	if (hostMatches(hostname, "waze.com")) {
		return "Waze";
	}
	if (
		hostMatches(hostname, "maps.apple.com") ||
		hostMatches(hostname, "apple.com")
	) {
		return "Apple Maps";
	}

	return null;
}
