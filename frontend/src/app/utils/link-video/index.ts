import { buildTwitchEmbedUrl } from "./twitch";
import { buildYouTubeEmbedUrl } from "./youtube";

export { isReelUrl, isVideoUrl } from "./classification";
export {
	buildYouTubeEmbedUrl,
	buildYouTubePlaylistEmbedUrl,
	extractYouTubeVideoId,
	isYouTubePlaylistUrl,
} from "./youtube";

export function buildVideoEmbedUrl(
	rawValue: string | null | undefined,
): string | null {
	return buildYouTubeEmbedUrl(rawValue) ?? buildTwitchEmbedUrl(rawValue);
}
