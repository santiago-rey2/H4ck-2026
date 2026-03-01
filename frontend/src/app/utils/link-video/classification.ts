import { hostMatches, hostMatchesAny } from "../link-url-utils";
import { isTwitchVideoUrl } from "./twitch";
import { isYouTubePlaylistUrl, isYouTubeVideoUrl } from "./youtube";

const VIDEO_DOMAINS = [
	"youtube.com",
	"youtu.be",
	"twitch.tv",
	"dailymotion.com",
];

export function isReelUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	const pathname = url.pathname.toLowerCase();

	if (hostMatches(hostname, "instagram.com")) {
		return pathname.startsWith("/reel/") || pathname.startsWith("/reels/");
	}

	if (hostMatches(hostname, "tiktok.com")) {
		return pathname.includes("/video/") || pathname.startsWith("/t/");
	}

	if (
		hostMatches(hostname, "youtube.com") ||
		hostMatches(hostname, "youtu.be")
	) {
		return pathname.startsWith("/shorts/");
	}

	if (hostMatches(hostname, "facebook.com")) {
		return pathname.includes("/reel/") || pathname.includes("/reels/");
	}

	return false;
}

export function isVideoUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();

	if (isYouTubePlaylistUrl(url) || isYouTubeVideoUrl(url)) {
		return true;
	}

	if (isTwitchVideoUrl(url)) {
		return true;
	}

	return hostMatchesAny(hostname, VIDEO_DOMAINS);
}
