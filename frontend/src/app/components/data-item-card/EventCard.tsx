import { Calendar, Clock } from "lucide-react";
import { useCountdown } from "@/app/hooks/useCountdown";
import type { DataItem } from "@/app/types/data";
import { CardFooter } from "./CardFooter";
import { CardShell } from "./CardShell";
import { getBaseStyleForItem } from "./styles";

interface EventCardProps {
	item: DataItem;
	prefersReducedMotion: boolean;
}

export function EventCard({ item, prefersReducedMotion }: EventCardProps) {
	const styles = getBaseStyleForItem(item.formato);
	const countdown = useCountdown(item.eventDate ?? item.fecha, item.eventTime);
	const eventDate = new Date(item.eventDate ?? item.fecha);
	const formattedEventDate = eventDate.toLocaleDateString("es-ES", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

	return (
		<CardShell styles={styles} prefersReducedMotion={prefersReducedMotion}>
			<div className="p-5 flex flex-col">
				<div className="absolute top-4 right-4">
					<div
						className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconColor}`}
					>
						<Calendar className="w-4 h-4" />
					</div>
				</div>

				<h3 className="font-bold text-base leading-tight text-slate-900 dark:text-slate-100 pr-12 mb-4">
					{item.texto}
				</h3>

				{!countdown.isExpired ? (
					<div className="flex-1 flex items-center justify-center my-4">
						<div className="grid grid-cols-3 gap-3 w-full">
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

				<div
					className={`text-center py-3 px-4 rounded-lg ${styles.iconBg} mb-3`}
				>
					<div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
						{formattedEventDate}
					</div>
					{item.eventTime ? (
						<div className={`text-sm font-bold ${styles.iconColor}`}>
							{item.eventTime}
						</div>
					) : null}
				</div>

				<CardFooter
					item={item}
					styles={styles}
					prefersReducedMotion={prefersReducedMotion}
					showDate={false}
				/>
			</div>
		</CardShell>
	);
}
