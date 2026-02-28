import { AlertTriangle, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getModalVariants } from "@/app/motion/variants";

interface ConfirmActionModalProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	pending?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmActionModal({
	open,
	title,
	description,
	confirmLabel = "Confirmar",
	cancelLabel = "Cancelar",
	pending = false,
	onConfirm,
	onCancel,
}: ConfirmActionModalProps) {
	const { prefersReducedMotion } = useMotionPreferences();
	const modalVariants = getModalVariants(prefersReducedMotion);

	useEffect(() => {
		if (!open) {
			return;
		}

		const onEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !pending) {
				onCancel();
			}
		};

		window.addEventListener("keydown", onEscape);
		return () => {
			window.removeEventListener("keydown", onEscape);
		};
	}, [onCancel, open, pending]);

	if (typeof document === "undefined") {
		return null;
	}

	return createPortal(
		<AnimatePresence>
			{open ? (
				<motion.div
					className="fixed inset-0 z-[90] flex items-center justify-center p-4"
					role="dialog"
					aria-modal="true"
					aria-labelledby="confirm-action-modal-title"
				>
					<motion.button
						type="button"
						aria-label="Cerrar confirmacion"
						variants={modalVariants.backdrop}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
						onClick={() => {
							if (!pending) {
								onCancel();
							}
						}}
					/>

					<motion.div
						variants={modalVariants.panel}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
					>
						<div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/85">
							<p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
								<AlertTriangle className="size-3.5" />
								Accion destructiva
							</p>
							<button
								type="button"
								onClick={() => {
									if (!pending) {
										onCancel();
									}
								}}
								disabled={pending}
								className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
								aria-label="Cerrar modal"
							>
								<X className="size-4" />
							</button>
						</div>

						<div className="space-y-3 px-4 py-4">
							<h2
								id="confirm-action-modal-title"
								className="text-base font-semibold text-slate-900 dark:text-slate-100"
							>
								{title}
							</h2>
							<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								{description}
							</p>
						</div>

						<div className="flex items-center justify-end gap-2 border-t border-slate-200/90 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
							<button
								type="button"
								onClick={onCancel}
								disabled={pending}
								className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
							>
								{cancelLabel}
							</button>
							<button
								type="button"
								onClick={onConfirm}
								disabled={pending}
								className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-700 bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-70 dark:border-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500"
							>
								{pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
								{pending ? "Eliminando..." : confirmLabel}
							</button>
						</div>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>,
		document.body,
	);
}
