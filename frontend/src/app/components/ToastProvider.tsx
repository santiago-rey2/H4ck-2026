import {
	AlertCircle,
	CheckCircle2,
	Info,
	TriangleAlert,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import type { AppToastPayload, AppToastTone } from "@/app/utils/toast-sink";
import {
	registerToastListener,
	unregisterToastListener,
} from "@/app/utils/toast-sink";
import { cn } from "@/lib/utils";

interface ToastItem {
	id: number;
	tone: AppToastTone;
	title?: string;
	message: string;
	durationMs: number;
}

const DEFAULT_TOAST_DURATION_MS = 3200;

const TONE_STYLES: Record<AppToastTone, string> = {
	success:
		"border-emerald-300 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100",
	info: "border-sky-300 bg-sky-50/95 text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100",
	warning:
		"border-amber-300 bg-amber-50/95 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100",
	error:
		"border-rose-300 bg-rose-50/95 text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100",
};

const TONE_ICONS = {
	success: CheckCircle2,
	info: Info,
	warning: TriangleAlert,
	error: AlertCircle,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
	const { prefersReducedMotion } = useMotionPreferences();
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timeoutMapRef = useRef<Map<number, number>>(new Map());

	const dismissToast = useCallback((toastId: number) => {
		const timeoutId = timeoutMapRef.current.get(toastId);
		if (timeoutId !== undefined) {
			window.clearTimeout(timeoutId);
			timeoutMapRef.current.delete(toastId);
		}

		setToasts((currentToasts) =>
			currentToasts.filter((toast) => toast.id !== toastId),
		);
	}, []);

	const pushToast = useCallback(
		(payload: AppToastPayload) => {
			const generatedId = Date.now() + Math.floor(Math.random() * 10000);
			const tone = payload.tone ?? "info";
			const durationMs = Math.max(
				800,
				payload.durationMs ?? DEFAULT_TOAST_DURATION_MS,
			);

			setToasts((currentToasts) => [
				...currentToasts,
				{
					id: generatedId,
					tone,
					title: payload.title,
					message: payload.message,
					durationMs,
				},
			]);

			const timeoutId = window.setTimeout(() => {
				dismissToast(generatedId);
			}, durationMs);
			timeoutMapRef.current.set(generatedId, timeoutId);
		},
		[dismissToast],
	);

	useEffect(() => {
		registerToastListener(pushToast);
		return () => {
			unregisterToastListener();
			for (const timeoutId of timeoutMapRef.current.values()) {
				window.clearTimeout(timeoutId);
			}
			timeoutMapRef.current.clear();
		};
	}, [pushToast]);

	return (
		<>
			{children}

			<div className="pointer-events-none fixed bottom-4 right-4 z-[95] flex w-[min(92vw,360px)] flex-col gap-2">
				<AnimatePresence initial={false}>
					{toasts.map((toast) => {
						const ToneIcon = TONE_ICONS[toast.tone];

						return (
							<motion.div
								key={toast.id}
								initial={
									prefersReducedMotion
										? { opacity: 1 }
										: { opacity: 0, y: 12, scale: 0.98 }
								}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={
									prefersReducedMotion
										? { opacity: 1 }
										: { opacity: 0, y: 8, scale: 0.98 }
								}
								transition={{
									duration: prefersReducedMotion ? 0 : 0.2,
								}}
								className={cn(
									"pointer-events-auto rounded-xl border p-3 shadow-lg backdrop-blur",
									TONE_STYLES[toast.tone],
								)}
							>
								<div className="flex items-start gap-2.5">
									<ToneIcon className="mt-0.5 size-4 shrink-0" />
									<div className="min-w-0 flex-1">
										{toast.title ? (
											<p className="text-sm font-semibold leading-tight">
												{toast.title}
											</p>
										) : null}
										<p className="text-xs leading-relaxed opacity-95">
											{toast.message}
										</p>
									</div>

									<button
										type="button"
										onClick={() => dismissToast(toast.id)}
										className="inline-flex size-6 items-center justify-center rounded-md border border-black/10 bg-white/30 transition-colors hover:bg-white/50 dark:border-white/15 dark:bg-black/20 dark:hover:bg-black/30"
										aria-label="Cerrar notificacion"
									>
										<X className="size-3.5" />
									</button>
								</div>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</>
	);
}
