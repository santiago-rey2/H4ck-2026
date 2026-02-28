import { useAtomValue } from "jotai";
import { motion } from "motion/react";
import {
	dataSearchQueryAtom,
	selectedFormatsAtom,
	selectedTagsAtom,
} from "@/app/atoms";
import { MOTION_DURATION, MOTION_EASE } from "@/app/motion/tokens";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { DataItemsList } from "../components/DataItemsList";

export function HomePage() {
	const { prefersReducedMotion } = useMotionPreferences();
	const searchQuery = useAtomValue(dataSearchQueryAtom);
	const selectedFormats = useAtomValue(selectedFormatsAtom);
	const selectedTags = useAtomValue(selectedTagsAtom);

	const activeFiltersCount =
		selectedFormats.length +
		selectedTags.length +
		(searchQuery.trim().length > 0 ? 1 : 0);

	return (
		<div className="w-full min-h-full">
			<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
				<motion.div
					initial={
						prefersReducedMotion ? { opacity: 1 } : { y: 12, opacity: 0 }
					}
					animate={{ y: 0, opacity: 1 }}
					transition={{
						delay: prefersReducedMotion ? 0 : 0.06,
						duration: prefersReducedMotion ? 0 : MOTION_DURATION.base,
						ease: MOTION_EASE.decelerate,
					}}
					className="space-y-8"
				>
					<div className="space-y-3">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
							Knowledge board
						</p>
						<h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
							Digital Brain
						</h1>
						<p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
							Busca, filtra y organiza tus datos desde el sidebar izquierdo. Usa
							el panel derecho para crear items reales (dato, nota o link) y
							para simular preguntas al chatbot; las categorias se asignan de
							forma automatica en backend. El tablero central usa una cuadricula
							densa con tarjetas de ancho variable e infinite scroll para una
							exploracion mas dinamica.
						</p>

						{activeFiltersCount > 0 ? (
							<div className="inline-flex items-center rounded-full border border-cyan-300/70 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
								Filtros activos: {activeFiltersCount}
							</div>
						) : null}
					</div>

					<DataItemsList />
				</motion.div>
			</div>
		</div>
	);
}
