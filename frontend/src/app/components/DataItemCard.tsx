import { useSetAtom } from "jotai";
import {
	Calendar,
	Check,
	Clapperboard,
	Clock,
	Copy,
	ExternalLink,
	FileText,
	Globe,
	Link2,
	Loader2,
	type LucideIcon,
	MapPin,
	MessageCircle,
	Play,
	Sparkles,
	StickyNote,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
	type KeyboardEvent,
	type MouseEvent,
	useEffect,
	useState,
} from "react";
import { openLinkViewerAtom } from "@/app/atoms";
import { useCountdown } from "@/app/hooks/useCountdown";
import { useItemLinkPreview } from "@/app/hooks/useDataItems";
import { MOTION_DURATION, MOTION_EASE } from "@/app/motion/tokens";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import type { DataItem } from "@/app/types/data";
import {
	buildOpenStreetMapEmbedUrl,
	buildOpenStreetMapTileSnapshotUrls,
	classifyLinkTarget,
	extractLocationCoordinates,
	extractYouTubeVideoId,
	getDisplayHostname,
	isConsentGatewayUrl,
	isConsentLikeTitle,
	type LinkCardKind,
	normalizeLinkTarget,
} from "@/app/utils/link-classifier";
import { Badge } from "@/components/ui/badge";

interface DataItemCardProps {
	item: DataItem;
}

const LINK_SOURCE_LABELS = {
	extruct: "OG",
	yt_dlp: "YT-DLP",
	mixed: "Mixto",
} as const;

type LinkMediaKind = "image" | "logo" | "favicon";

const LINK_KIND_LABELS: Record<LinkCardKind, string> = {
	web: "Web",
	video: "Video",
	location: "Ubicacion",
	reel: "Reel",
	social: "Social",
};

const LINK_KIND_ICONS: Record<LinkCardKind, LucideIcon> = {
	web: Globe,
	video: Clapperboard,
	location: MapPin,
	reel: Play,
	social: MessageCircle,
};

const LINK_KIND_STYLES: Record<
	LinkCardKind,
	{
		bg: string;
		border: string;
		iconBg: string;
		iconColor: string;
		tagBg: string;
	}
> = {
	web: {
		bg: "bg-gradient-to-br from-sky-50 via-cyan-50 to-indigo-100 dark:from-slate-900 dark:via-sky-950/30 dark:to-indigo-950/30",
		border: "border-sky-200 dark:border-sky-800",
		iconBg: "bg-sky-100 dark:bg-sky-900/40",
		iconColor: "text-sky-700 dark:text-sky-300",
		tagBg: "bg-sky-100/60 dark:bg-sky-900/30",
	},
	video: {
		bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-100 dark:from-slate-900 dark:via-rose-950/30 dark:to-amber-950/30",
		border: "border-orange-200 dark:border-orange-800",
		iconBg: "bg-orange-100 dark:bg-orange-900/40",
		iconColor: "text-orange-700 dark:text-orange-300",
		tagBg: "bg-orange-100/60 dark:bg-orange-900/30",
	},
	location: {
		bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-emerald-950/25 dark:to-cyan-950/30",
		border: "border-emerald-200 dark:border-emerald-800",
		iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
		iconColor: "text-emerald-700 dark:text-emerald-300",
		tagBg: "bg-emerald-100/60 dark:bg-emerald-900/30",
	},
	reel: {
		bg: "bg-gradient-to-br from-rose-50 via-fuchsia-50 to-orange-100 dark:from-slate-900 dark:via-fuchsia-950/25 dark:to-rose-950/30",
		border: "border-rose-200 dark:border-rose-800",
		iconBg: "bg-rose-100 dark:bg-rose-900/40",
		iconColor: "text-rose-700 dark:text-rose-300",
		tagBg: "bg-rose-100/60 dark:bg-rose-900/30",
	},
	social: {
		bg: "bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-100 dark:from-slate-900 dark:via-indigo-950/25 dark:to-cyan-950/30",
		border: "border-indigo-200 dark:border-indigo-800",
		iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
		iconColor: "text-indigo-700 dark:text-indigo-300",
		tagBg: "bg-indigo-100/60 dark:bg-indigo-900/30",
	},
};

const LINK_KIND_ACCENT_BAR: Record<LinkCardKind, string> = {
	web: "bg-gradient-to-r from-sky-300/80 via-cyan-300/80 to-indigo-300/80 dark:from-sky-700/70 dark:via-cyan-700/70 dark:to-indigo-700/70",
	video:
		"bg-gradient-to-r from-orange-300/80 via-rose-300/80 to-amber-300/80 dark:from-orange-700/70 dark:via-rose-700/70 dark:to-amber-700/70",
	location:
		"bg-gradient-to-r from-emerald-300/80 via-teal-300/80 to-cyan-300/80 dark:from-emerald-700/70 dark:via-teal-700/70 dark:to-cyan-700/70",
	reel: "bg-gradient-to-r from-rose-300/80 via-fuchsia-300/80 to-orange-300/80 dark:from-rose-700/70 dark:via-fuchsia-700/70 dark:to-orange-700/70",
	social:
		"bg-gradient-to-r from-indigo-300/80 via-sky-300/80 to-cyan-300/80 dark:from-indigo-700/70 dark:via-sky-700/70 dark:to-cyan-700/70",
};

export function DataItemCard({ item }: DataItemCardProps) {
	const [copied, setCopied] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const { prefersReducedMotion } = useMotionPreferences();
	const openLinkViewer = useSetAtom(openLinkViewerAtom);

	const cardHoverMotion = prefersReducedMotion
		? {}
		: {
				whileHover: { y: -3, scale: 1.005 },
				whileTap: { scale: 0.998 },
			};

	const handleCopy = () => {
		navigator.clipboard.writeText(item.texto);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const formattedDate = new Date(item.fecha).toLocaleDateString("es-ES", {
		month: "short",
		day: "numeric",
	});

	const isNota = item.formato === "nota";
	const isLink = item.formato === "link";
	const isEvento = item.formato === "evento";
	const Icon = isNota
		? StickyNote
		: isLink
			? Link2
			: isEvento
				? Calendar
				: FileText;
	const MAX_VISIBLE_TAGS = 3;
	const visibleTags = item.tags.slice(0, MAX_VISIBLE_TAGS);
	const hiddenTags = item.tags.slice(MAX_VISIBLE_TAGS);
	const remainingCount = hiddenTags.length;
	const countdown = useCountdown(item.eventDate ?? item.fecha, item.eventTime);
	const [failedPreviewMediaUrls, setFailedPreviewMediaUrls] = useState<
		string[]
	>([]);
	const [mapSnapshotFailed, setMapSnapshotFailed] = useState(false);
	const { data: linkPreview, isLoading: isLinkPreviewLoading } =
		useItemLinkPreview(item.id, isLink);

	const fallbackLinkUrl = normalizeLinkTarget(item.texto);
	const previewSourceUrl = normalizeLinkTarget(linkPreview?.url ?? null);
	const rawPreviewTarget = normalizeLinkTarget(
		linkPreview?.final_url ?? linkPreview?.url ?? item.texto,
	);
	const resolvedPreviewTarget =
		rawPreviewTarget && !isConsentGatewayUrl(rawPreviewTarget)
			? rawPreviewTarget
			: null;
	const linkTargetUrl =
		resolvedPreviewTarget ??
		previewSourceUrl ??
		fallbackLinkUrl ??
		rawPreviewTarget;
	const externalLinkUrl =
		fallbackLinkUrl ?? previewSourceUrl ?? rawPreviewTarget ?? linkTargetUrl;
	const rawLinkClassification = classifyLinkTarget(item.texto);
	const resolvedLinkClassification = classifyLinkTarget(
		resolvedPreviewTarget ?? previewSourceUrl ?? item.texto,
	);
	const linkClassification =
		rawLinkClassification.kind === "web" &&
		resolvedLinkClassification.kind !== "web"
			? resolvedLinkClassification
			: rawLinkClassification;
	const locationCoordinates =
		linkClassification.kind === "location"
			? extractLocationCoordinates(externalLinkUrl ?? item.texto)
			: null;
	const locationEmbedUrl =
		linkClassification.kind === "location"
			? buildOpenStreetMapEmbedUrl(
					externalLinkUrl ?? linkPreview?.url ?? item.texto,
				)
			: null;
	const viewerIframeUrl =
		linkClassification.kind === "location"
			? (locationEmbedUrl ?? linkTargetUrl)
			: linkTargetUrl;
	const LinkKindIcon = LINK_KIND_ICONS[linkClassification.kind];
	const linkKindLabel = LINK_KIND_LABELS[linkClassification.kind];
	const linkStyles = LINK_KIND_STYLES[linkClassification.kind];
	const displayLinkUrl = (
		externalLinkUrl ??
		viewerIframeUrl ??
		item.texto
	).replace(/^https?:\/\//i, "");
	const fallbackHostname = getDisplayHostname(item.texto);
	const previewHostname = getDisplayHostname(
		resolvedPreviewTarget ?? previewSourceUrl ?? externalLinkUrl ?? item.texto,
	);
	const displayHostname = previewHostname ?? fallbackHostname ?? "enlace";
	const previewTitleCandidate = linkPreview?.title?.trim() ?? null;
	const safePreviewTitle =
		previewTitleCandidate && !isConsentLikeTitle(previewTitleCandidate)
			? previewTitleCandidate
			: null;
	const locationTitleFallback =
		linkClassification.kind === "location"
			? locationCoordinates
				? `Ubicacion ${locationCoordinates.lat.toFixed(4)}, ${locationCoordinates.lon.toFixed(4)}`
				: `Ubicacion en ${linkClassification.platform ?? displayHostname}`
			: null;
	const previewTitle =
		safePreviewTitle ||
		item.title?.trim() ||
		locationTitleFallback ||
		displayHostname;
	const previewDescriptionCandidate = linkPreview?.description?.trim() ?? null;
	const safePreviewDescription =
		previewDescriptionCandidate &&
		!isConsentLikeTitle(previewDescriptionCandidate)
			? previewDescriptionCandidate
			: null;
	const itemDescription = item.description?.trim() ?? null;
	const isGenericSeedDescription = Boolean(
		itemDescription?.startsWith(
			"Referencia externa para pruebas de formato link.",
		),
	);
	const previewDescription =
		safePreviewDescription ||
		(linkClassification.kind === "location" || isGenericSeedDescription
			? null
			: itemDescription);
	const previewImageUrl =
		linkPreview?.image?.trim() || item.image?.trim() || null;
	const previewLogoUrl = linkPreview?.logo?.trim() || null;
	const previewFaviconUrl = linkPreview?.favicon?.trim() || null;
	const previewSiteNameCandidate = linkPreview?.site_name?.trim() ?? null;
	const safePreviewSiteName =
		previewSiteNameCandidate && !isConsentLikeTitle(previewSiteNameCandidate)
			? previewSiteNameCandidate
			: null;
	const youtubeVideoId = extractYouTubeVideoId(
		linkPreview?.final_url ?? linkPreview?.url ?? item.texto,
	);
	const youtubeHdImageCandidates =
		(linkClassification.kind === "video" ||
			linkClassification.kind === "reel") &&
		youtubeVideoId
			? [
					`https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
					`https://i.ytimg.com/vi/${youtubeVideoId}/sddefault.jpg`,
					`https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
				]
			: [];

	const previewMediaCandidates: Array<{ kind: LinkMediaKind; url: string }> =
		[];
	const seenMediaCandidates = new Set<string>();
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

	for (const youtubeCandidate of youtubeHdImageCandidates) {
		pushMediaCandidate("image", youtubeCandidate);
	}

	pushMediaCandidate("image", previewImageUrl);
	pushMediaCandidate("logo", previewLogoUrl);
	pushMediaCandidate("favicon", previewFaviconUrl);

	const locationSnapshotTiles =
		linkClassification.kind === "location"
			? buildOpenStreetMapTileSnapshotUrls(
					externalLinkUrl ?? linkPreview?.url ?? item.texto,
				)
			: null;
	const hasLocationSnapshot = Boolean(
		locationSnapshotTiles &&
			locationSnapshotTiles.length === 4 &&
			!mapSnapshotFailed,
	);
	const locationSnapshotSignature = locationSnapshotTiles?.join("|") ?? "";
	const mediaCandidateSignature = previewMediaCandidates
		.map((candidate) => `${candidate.kind}:${candidate.url}`)
		.join("|");
	const activePreviewMedia =
		previewMediaCandidates.find(
			(candidate) => !failedPreviewMediaUrls.includes(candidate.url),
		) ?? null;
	const showPreviewImage = Boolean(activePreviewMedia?.url);
	const isIconLikeMedia =
		activePreviewMedia?.kind === "logo" ||
		activePreviewMedia?.kind === "favicon";
	const hasPreviewPayload = Boolean(
		safePreviewTitle ||
			safePreviewDescription ||
			linkPreview?.image ||
			linkPreview?.logo ||
			linkPreview?.favicon ||
			safePreviewSiteName,
	);
	const hasFallbackPreview = Boolean(
		item.title || item.description || item.image,
	);
	const isPreviewLoading =
		isLink && isLinkPreviewLoading && !hasFallbackPreview;
	const isPreviewRefreshing =
		isLink && isLinkPreviewLoading && hasFallbackPreview;
	const previewSourceLabel = linkPreview?.source
		? LINK_SOURCE_LABELS[linkPreview.source]
		: null;
	const linkKindHint =
		linkClassification.kind === "video"
			? "Contenido audiovisual"
			: linkClassification.kind === "location"
				? locationCoordinates
					? `Vista de ubicacion · ${locationCoordinates.lat.toFixed(4)}, ${locationCoordinates.lon.toFixed(4)}`
					: "Vista de ubicacion"
				: linkClassification.kind === "reel"
					? "Contenido corto"
					: linkClassification.kind === "social"
						? "Publicacion social"
						: "Sitio o documentacion";
	const showPlayOverlay =
		linkClassification.kind === "video" || linkClassification.kind === "reel";
	const showLocationPlaceholder =
		linkClassification.kind === "location" && !hasLocationSnapshot;
	const showSocialPlaceholder = linkClassification.kind === "social";
	const mediaHeightClass =
		linkClassification.kind === "reel"
			? "h-72 sm:h-80"
			: linkClassification.kind === "video"
				? "h-48 sm:h-56"
				: "h-36 sm:h-44";

	useEffect(() => {
		if (!mediaCandidateSignature) {
			setFailedPreviewMediaUrls([]);
			return;
		}

		setFailedPreviewMediaUrls([]);
	}, [mediaCandidateSignature]);

	useEffect(() => {
		if (!locationSnapshotSignature) {
			setMapSnapshotFailed(false);
			return;
		}

		setMapSnapshotFailed(false);
	}, [locationSnapshotSignature]);

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

	const handlePreviewMediaError = () => {
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

	const handleMapSnapshotError = () => {
		setMapSnapshotFailed(true);
	};

	const handleLinkCardClick = (event: MouseEvent<HTMLDivElement>) => {
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

	const handleLinkCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!viewerIframeUrl || event.target !== event.currentTarget) {
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openLinkTarget();
		}
	};

	// Configuración de colores según formato
	const formatStyles = {
		dato: {
			bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40",
			border: "border-blue-200 dark:border-blue-800",
			iconBg: "bg-blue-100 dark:bg-blue-900/40",
			iconColor: "text-blue-600 dark:text-blue-400",
			tagBg: "bg-blue-100/50 dark:bg-blue-900/30",
		},
		nota: {
			bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/40",
			border: "border-amber-200 dark:border-amber-800",
			iconBg: "bg-amber-100 dark:bg-amber-900/40",
			iconColor: "text-amber-600 dark:text-amber-400",
			tagBg: "bg-amber-100/50 dark:bg-amber-900/30",
		},
		link: {
			...LINK_KIND_STYLES.web,
		},
		evento: {
			bg: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/40 dark:to-cyan-900/40",
			border: "border-cyan-200 dark:border-cyan-800",
			iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
			iconColor: "text-cyan-600 dark:text-cyan-400",
			tagBg: "bg-cyan-100/50 dark:bg-cyan-900/30",
		},
	};

	const styles = isLink
		? linkStyles
		: formatStyles[item.formato as keyof typeof formatStyles] ||
			formatStyles.dato;

	// Componente Footer reutilizable
	const Footer = () => (
		<div className="space-y-2">
			{/* Tags */}
			<div className="flex flex-wrap gap-1.5">
				{visibleTags.map((tag) => (
					<Badge
						key={tag}
						variant="secondary"
						className={`text-[10px] px-2 py-0.5 border-0 ${styles.tagBg}`}
					>
						{tag}
					</Badge>
				))}
				{remainingCount > 0 && (
					<button
						type="button"
						className="relative cursor-help"
						aria-label="Mostrar tags restantes"
						onMouseEnter={() => setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
						onFocus={() => setShowTooltip(true)}
						onBlur={() => setShowTooltip(false)}
					>
						<Badge
							variant="secondary"
							className={`text-[10px] px-2 py-0.5 border-0 cursor-help transition-colors ${styles.tagBg} opacity-70 hover:opacity-100`}
						>
							+{remainingCount}
						</Badge>

						<AnimatePresence>
							{showTooltip ? (
								<motion.div
									initial={
										prefersReducedMotion
											? { opacity: 1 }
											: { opacity: 0, y: 6, scale: 0.98 }
									}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={
										prefersReducedMotion
											? { opacity: 1 }
											: { opacity: 0, y: 4, scale: 0.98 }
									}
									transition={{
										duration: prefersReducedMotion ? 0 : MOTION_DURATION.fast,
										ease: MOTION_EASE.standard,
									}}
									className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
								>
									<div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
										<div className="flex flex-wrap gap-1.5 max-w-[200px]">
											{hiddenTags.map((tag) => (
												<span key={tag} className="inline-block">
													{tag}
												</span>
											))}
										</div>
										<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
											<div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
										</div>
									</div>
								</motion.div>
							) : null}
						</AnimatePresence>
					</button>
				)}
			</div>

			{/* Fecha */}
			<div className={`text-xs font-medium ${styles.iconColor}`}>
				{formattedDate}
			</div>
		</div>
	);

	// Para eventos, renderizar con fecha y hora y countdown
	if (isEvento && item.eventDate) {
		const eventDate = new Date(item.eventDate);
		const formattedEventDate = eventDate.toLocaleDateString("es-ES", {
			weekday: "long",
			month: "long",
			day: "numeric",
		});

		return (
			<motion.div
				{...cardHoverMotion}
				transition={{
					duration: prefersReducedMotion ? 0 : MOTION_DURATION.fast,
					ease: MOTION_EASE.standard,
				}}
				className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-[box-shadow,filter] duration-200 hover:shadow-lg hover:brightness-105 flex flex-col`}
			>
				<div className="p-5 flex flex-col">
					{/* Icono flotante */}
					<div className="absolute top-4 right-4">
						<div
							className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconColor}`}
						>
							<Calendar className="w-4 h-4" />
						</div>
					</div>

					{/* Título del evento */}
					<h3 className="font-bold text-base leading-tight text-slate-900 dark:text-slate-100 pr-12 mb-4">
						{item.texto}
					</h3>

					{/* Cuenta atrás */}
					{!countdown.isExpired ? (
						<div className="flex-1 flex items-center justify-center my-4">
							<div className="grid grid-cols-3 gap-3 w-full">
								{/* Días */}
								<div
									className={`flex flex-col items-center p-3 rounded-xl ${styles.iconBg}`}
								>
									<div className={`text-2xl font-bold ${styles.iconColor}`}>
										{countdown.days}
									</div>
									<div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
										{countdown.days === 1 ? "día" : "días"}
									</div>
								</div>
								{/* Horas */}
								<div
									className={`flex flex-col items-center p-3 rounded-xl ${styles.iconBg}`}
								>
									<div className={`text-2xl font-bold ${styles.iconColor}`}>
										{countdown.hours.toString().padStart(2, "0")}
									</div>
									<div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
										hrs
									</div>
								</div>
								{/* Minutos */}
								<div
									className={`flex flex-col items-center p-3 rounded-xl ${styles.iconBg}`}
								>
									<div className={`text-2xl font-bold ${styles.iconColor}`}>
										{countdown.minutes.toString().padStart(2, "0")}
									</div>
									<div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
										min
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="flex-1 flex items-center justify-center my-4">
							<div className={`text-center p-4 rounded-xl ${styles.iconBg}`}>
								<Clock className={`w-8 h-8 mx-auto mb-2 ${styles.iconColor}`} />
								<p className={`text-sm font-semibold ${styles.iconColor}`}>
									Evento finalizado
								</p>
							</div>
						</div>
					)}

					{/* Fecha y hora exacta */}
					<div
						className={`text-center py-3 px-4 rounded-lg ${styles.iconBg} mb-3`}
					>
						<div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
							{formattedEventDate}
						</div>
						{item.eventTime && (
							<div className={`text-sm font-bold ${styles.iconColor}`}>
								{item.eventTime}
							</div>
						)}
					</div>

					{/* Footer con tags */}
					<div className="flex flex-wrap gap-1.5">
						{visibleTags.map((tag) => (
							<Badge
								key={tag}
								variant="secondary"
								className={`text-[10px] px-2 py-0.5 border-0 ${styles.tagBg}`}
							>
								{tag}
							</Badge>
						))}
						{remainingCount > 0 && (
							<button
								type="button"
								className="relative cursor-help"
								aria-label="Mostrar tags restantes"
								onMouseEnter={() => setShowTooltip(true)}
								onMouseLeave={() => setShowTooltip(false)}
								onFocus={() => setShowTooltip(true)}
								onBlur={() => setShowTooltip(false)}
							>
								<Badge
									variant="secondary"
									className={`text-[10px] px-2 py-0.5 border-0 cursor-help transition-colors ${styles.tagBg} opacity-70 hover:opacity-100`}
								>
									+{remainingCount}
								</Badge>

								<AnimatePresence>
									{showTooltip ? (
										<motion.div
											initial={
												prefersReducedMotion
													? { opacity: 1 }
													: { opacity: 0, y: 6, scale: 0.98 }
											}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={
												prefersReducedMotion
													? { opacity: 1 }
													: { opacity: 0, y: 4, scale: 0.98 }
											}
											transition={{
												duration: prefersReducedMotion
													? 0
													: MOTION_DURATION.fast,
												ease: MOTION_EASE.standard,
											}}
											className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
										>
											<div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
												<div className="flex flex-wrap gap-1.5 max-w-[200px]">
													{hiddenTags.map((tag) => (
														<span key={tag} className="inline-block">
															{tag}
														</span>
													))}
												</div>
												<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
													<div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
												</div>
											</div>
										</motion.div>
									) : null}
								</AnimatePresence>
							</button>
						)}
					</div>
				</div>
			</motion.div>
		);
	}

	// Para links, renderizar con preview backend + fallback
	if (isLink) {
		return (
			<motion.div
				{...cardHoverMotion}
				transition={{
					duration: prefersReducedMotion ? 0 : MOTION_DURATION.fast,
					ease: MOTION_EASE.standard,
				}}
				className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-[box-shadow,filter] duration-200 hover:shadow-lg hover:brightness-105 flex flex-col group ${
					viewerIframeUrl ? "cursor-pointer" : "cursor-default"
				}`}
				onClick={viewerIframeUrl ? handleLinkCardClick : undefined}
				onKeyDown={viewerIframeUrl ? handleLinkCardKeyDown : undefined}
				role={viewerIframeUrl ? "link" : undefined}
				tabIndex={viewerIframeUrl ? 0 : undefined}
				aria-label={
					viewerIframeUrl ? `Abrir enlace ${previewTitle}` : undefined
				}
			>
				{hasLocationSnapshot ? (
					<div
						className={`relative w-full ${mediaHeightClass} overflow-hidden border-b border-emerald-200/80 dark:border-emerald-900/70`}
					>
						<div className="grid h-full w-full grid-cols-2 grid-rows-2">
							{(locationSnapshotTiles ?? []).map((tileUrl) => (
								<img
									key={tileUrl}
									src={tileUrl}
									alt="Mapa"
									className="h-full w-full object-cover"
									onError={handleMapSnapshotError}
								/>
							))}
						</div>
						<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent dark:from-slate-950/40" />
						<div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
							<MapPin className="size-3.5" />
							Mapa
						</div>
					</div>
				) : showPreviewImage ? (
					isIconLikeMedia ? (
						<div
							className={`relative w-full h-24 overflow-hidden border-b ${styles.border} bg-white/40 dark:bg-slate-900/50`}
						>
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_60%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
							<div className="relative z-10 flex h-full items-center justify-center px-4">
								<img
									src={activePreviewMedia?.url}
									alt={previewTitle}
									className="max-h-14 w-full object-contain drop-shadow-sm"
									onError={handlePreviewMediaError}
								/>
							</div>
						</div>
					) : (
						<div
							className={`relative w-full ${mediaHeightClass} overflow-hidden bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800`}
						>
							<img
								src={activePreviewMedia?.url}
								alt={previewTitle}
								className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
								onError={handlePreviewMediaError}
							/>
							{showPlayOverlay ? (
								<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/25 dark:bg-slate-950/35">
									<span className="inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-slate-900 shadow-md dark:bg-slate-900/85 dark:text-white">
										<Play className="size-4 fill-current" />
									</span>
								</div>
							) : null}
							<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/20 to-transparent dark:from-slate-950/35" />
						</div>
					)
				) : showLocationPlaceholder ? (
					<div className="relative h-24 w-full overflow-hidden border-b border-emerald-200/70 bg-gradient-to-br from-emerald-100/90 to-cyan-100/70 dark:border-emerald-900/70 dark:from-emerald-950/35 dark:to-cyan-950/30">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.28),transparent_60%)] dark:bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.18),transparent_60%)]" />
						<div className="relative z-10 flex h-full items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300">
							<MapPin className="size-4" />
							<span className="text-xs font-semibold">
								{linkClassification.platform ?? "Ubicacion"}
							</span>
						</div>
					</div>
				) : showSocialPlaceholder ? (
					<div className="relative h-24 w-full overflow-hidden border-b border-indigo-200/70 bg-gradient-to-br from-indigo-100/85 to-cyan-100/70 dark:border-indigo-900/70 dark:from-indigo-950/35 dark:to-cyan-950/30">
						<div className="relative z-10 flex h-full items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300">
							<MessageCircle className="size-4" />
							<span className="text-xs font-semibold">
								{linkClassification.platform ?? "Social"}
							</span>
						</div>
					</div>
				) : showPlayOverlay ? (
					<div className="relative h-24 w-full overflow-hidden border-b border-orange-200/70 bg-gradient-to-br from-orange-100/90 to-rose-100/70 dark:border-orange-900/70 dark:from-orange-950/35 dark:to-rose-950/30">
						<div className="relative z-10 flex h-full items-center justify-center gap-2 text-orange-700 dark:text-orange-300">
							<Clapperboard className="size-4" />
							<span className="text-xs font-semibold">
								{linkClassification.platform ?? "Video"}
							</span>
						</div>
					</div>
				) : (
					<div
						className={`h-1.5 w-full ${LINK_KIND_ACCENT_BAR[linkClassification.kind]}`}
					/>
				)}

				<div className="p-4 space-y-3 flex flex-col">
					<div className="flex items-start justify-between gap-2">
						<div
							className={`p-1.5 rounded-lg ${styles.iconBg} ${styles.iconColor} flex-shrink-0`}
						>
							<LinkKindIcon className="w-3.5 h-3.5" />
						</div>

						<div className="flex items-center flex-wrap justify-end gap-1.5">
							<Badge
								variant="secondary"
								className={`text-[10px] border-0 ${styles.tagBg}`}
							>
								{linkKindLabel}
							</Badge>
							{linkClassification.platform ? (
								<Badge
									variant="secondary"
									className="text-[10px] border-0 bg-white/70 dark:bg-slate-900/60"
								>
									{linkClassification.platform}
								</Badge>
							) : null}
							{previewSourceLabel ? (
								<Badge
									variant="secondary"
									className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800/70"
								>
									{previewSourceLabel}
								</Badge>
							) : null}
						</div>
					</div>

					{isPreviewLoading ? (
						<div className="space-y-2 animate-pulse">
							<div className="h-3 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
							<div className="h-4 w-full rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
							<div className="h-4 w-11/12 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
							<div className="h-3 w-2/3 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
						</div>
					) : (
						<div className="space-y-2">
							<h3 className="font-semibold text-sm leading-snug text-slate-900 dark:text-slate-100 line-clamp-3">
								{previewTitle}
							</h3>

							{previewDescription ? (
								<p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
									{previewDescription}
								</p>
							) : null}

							<div className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
								<Globe className="size-3.5" />
								<span className="truncate">{displayHostname}</span>
							</div>

							<p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
								{displayLinkUrl}
							</p>

							<p className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
								<LinkKindIcon className="size-3.5" />
								{linkKindHint}
							</p>
						</div>
					)}

					<div className="flex items-center justify-between gap-2">
						<p className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
							{isPreviewLoading ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<Sparkles className="size-3.5" />
							)}
							{isPreviewLoading
								? "Generando preview..."
								: isPreviewRefreshing
									? "Actualizando preview..."
									: hasPreviewPayload
										? "Preview enriquecida"
										: "Preview limitada"}
						</p>

						{viewerIframeUrl ? (
							<span
								className={`inline-flex items-center gap-1 text-xs font-medium ${styles.iconColor}`}
							>
								<ExternalLink className="size-3.5" />
								Ver dentro
							</span>
						) : (
							<span className="text-[11px] font-medium text-rose-600 dark:text-rose-300">
								URL invalida
							</span>
						)}
					</div>

					<Footer />
				</div>
			</motion.div>
		);
	}

	// Para datos y notas
	return (
		<motion.div
			{...cardHoverMotion}
			transition={{
				duration: prefersReducedMotion ? 0 : MOTION_DURATION.fast,
				ease: MOTION_EASE.standard,
			}}
			className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-[box-shadow,filter] duration-200 hover:shadow-lg hover:brightness-105 flex flex-col`}
		>
			<div className="p-5 space-y-4 flex flex-col">
				{/* Header con icono y botón copiar */}
				<div className="flex items-start justify-between gap-3">
					<div
						className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconColor}`}
					>
						<Icon className="w-4 h-4" />
					</div>
					<button
						type="button"
						onClick={handleCopy}
						className={`p-2 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 transition-colors duration-200 ${styles.iconColor}`}
						title="Copiar"
					>
						{copied ? (
							<Check className="w-4 h-4 text-green-600 dark:text-green-500" />
						) : (
							<Copy className="w-4 h-4" />
						)}
					</button>
				</div>

				{/* Contenido principal */}
				<p className="font-medium text-sm leading-relaxed text-slate-900 dark:text-slate-100">
					{item.texto}
				</p>

				{/* Footer */}
				<Footer />
			</div>
		</motion.div>
	);
}
