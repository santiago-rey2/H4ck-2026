import { useAtom } from "jotai";
import { Bot, Eraser, MessageCircle, Send, SquarePen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
	chatbotDraftAtom,
	entryDraftAtom,
	rightSidebarModeAtom,
} from "@/app/atoms";
import { MOTION_SPRING } from "@/app/motion/tokens";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getViewSwitchVariants } from "@/app/motion/variants";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ChatMessage {
	id: number;
	role: "assistant" | "user";
	content: string;
}

const ENTRY_TEMPLATES = [
	"Guardar un dato rapido",
	"Escribir una nota corta",
	"Pegar un link importante",
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
	{
		id: 1,
		role: "assistant",
		content:
			"Hola, soy tu chatbot de apoyo. Esta es solo la UI para pruebas de experiencia.",
	},
	{
		id: 2,
		role: "assistant",
		content: "Puedes escribir preguntas en el cuadro inferior.",
	},
];

interface RightWorkbenchSidebarProps {
	className?: string;
	surface?: "default" | "drawer" | "tablet";
}

export function RightWorkbenchSidebar({
	className,
	surface = "default",
}: RightWorkbenchSidebarProps) {
	const { prefersReducedMotion, motionEnabled } = useMotionPreferences();
	const [mode, setMode] = useAtom(rightSidebarModeAtom);
	const [entryDraft, setEntryDraft] = useAtom(entryDraftAtom);
	const [chatbotDraft, setChatbotDraft] = useAtom(chatbotDraftAtom);
	const [messages, setMessages] = useState<ChatMessage[]>(
		INITIAL_CHAT_MESSAGES,
	);
	const modeContentVariants = getViewSwitchVariants(prefersReducedMotion);

	const appendTemplate = (template: string) => {
		setEntryDraft((currentValue) =>
			currentValue.trim().length > 0
				? `${currentValue}\n- ${template}`
				: `- ${template}`,
		);
	};

	const submitChatMessage = () => {
		const question = chatbotDraft.trim();
		if (!question) {
			return;
		}

		const timestamp = Date.now();
		setMessages((currentMessages) => [
			...currentMessages,
			{ id: timestamp, role: "user", content: question },
			{
				id: timestamp + 1,
				role: "assistant",
				content:
					"Respuesta simulada: integraremos el backend del chatbot en una siguiente iteracion.",
			},
		]);
		setChatbotDraft("");
	};

	return (
		<div
			className={cn(
				"h-full flex flex-col bg-gradient-to-b",
				surface === "drawer"
					? "border-l-0 from-amber-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
					: surface === "tablet"
						? "border-l border-slate-200 from-white via-amber-50/40 to-orange-50/60 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
						: "border-l border-slate-200/70 from-amber-50/40 via-white to-orange-50/40 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950",
				className,
			)}
		>
			<div className="p-5 border-b border-slate-200/70 dark:border-slate-800/80 space-y-3">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
					Workspace
				</p>
				<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
					Panel derecho
				</h2>

				<div className="relative grid grid-cols-2 rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80">
					{motionEnabled ? (
						<motion.span
							className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white dark:bg-slate-900 shadow-sm"
							animate={{ x: mode === "entry" ? "0%" : "100%" }}
							transition={MOTION_SPRING.soft}
						/>
					) : null}

					<button
						type="button"
						onClick={() => setMode("entry")}
						className={cn(
							"relative z-10 h-9 rounded-lg text-sm font-medium transition-colors",
							mode === "entry"
								? "text-slate-900 dark:text-slate-100"
								: "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100",
							!motionEnabled &&
								mode === "entry" &&
								"bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100",
						)}
					>
						<span className="inline-flex items-center gap-2">
							<SquarePen className="w-4 h-4" />
							Entrada
						</span>
					</button>

					<button
						type="button"
						onClick={() => setMode("chatbot")}
						className={cn(
							"relative z-10 h-9 rounded-lg text-sm font-medium transition-colors",
							mode === "chatbot"
								? "text-slate-900 dark:text-slate-100"
								: "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100",
							!motionEnabled &&
								mode === "chatbot" &&
								"bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100",
						)}
					>
						<span className="inline-flex items-center gap-2">
							<MessageCircle className="w-4 h-4" />
							Chatbot
						</span>
					</button>
				</div>
			</div>

			<AnimatePresence initial={false} mode="wait">
				{mode === "entry" ? (
					<motion.div
						key="entry"
						variants={modeContentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						className="flex-1 p-5 overflow-y-auto space-y-4"
					>
						<div className="space-y-1">
							<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
								Introducir informacion
							</p>
							<p className="text-xs text-slate-600 dark:text-slate-400">
								Panel de captura manual. Solo interfaz por ahora.
							</p>
						</div>

						<textarea
							value={entryDraft}
							onChange={(event) => setEntryDraft(event.target.value)}
							placeholder="Escribe aqui la informacion que quieres guardar..."
							className="w-full min-h-[220px] resize-y rounded-2xl border border-slate-300/80 bg-white/80 p-4 text-sm leading-relaxed text-slate-900 dark:text-slate-100 dark:bg-slate-900/70 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
						/>

						<div className="space-y-2">
							<p className="text-xs font-medium text-slate-600 dark:text-slate-400">
								Plantillas rapidas
							</p>
							<div className="flex flex-wrap gap-2">
								{ENTRY_TEMPLATES.map((template) => (
									<button
										key={template}
										type="button"
										onClick={() => appendTemplate(template)}
										className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-amber-500/60 dark:hover:bg-amber-950/40 transition-colors"
									>
										{template}
									</button>
								))}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2 pt-1">
							<Button
								type="button"
								variant="outline"
								onClick={() => setEntryDraft("")}
								disabled={entryDraft.trim().length === 0}
							>
								<Eraser className="size-3.5" />
								Limpiar
							</Button>
							<Button
								type="button"
								className="bg-amber-600 hover:bg-amber-700 text-white"
							>
								Guardar (UI)
							</Button>
						</div>
					</motion.div>
				) : (
					<motion.div
						key="chatbot"
						variants={modeContentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						className="flex-1 flex flex-col min-h-0 p-5 gap-4"
					>
						<div className="space-y-1">
							<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
								Preguntar al chatbot
							</p>
							<p className="text-xs text-slate-600 dark:text-slate-400">
								Conversacion mock para validar la experiencia.
							</p>
						</div>

						<div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-300/70 bg-white/75 dark:border-slate-700 dark:bg-slate-900/70 p-3 space-y-3">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
											message.role === "user"
												? "bg-amber-600 text-white"
												: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
										}`}
									>
										{message.role === "assistant" ? (
											<span className="inline-flex items-center gap-1.5 mb-1 text-xs opacity-80">
												<Bot className="w-3 h-3" />
												Asistente
											</span>
										) : null}
										<p>{message.content}</p>
									</div>
								</div>
							))}
						</div>

						<div className="space-y-2">
							<textarea
								value={chatbotDraft}
								onChange={(event) => setChatbotDraft(event.target.value)}
								placeholder="Escribe tu pregunta..."
								className="w-full h-20 resize-none rounded-2xl border border-slate-300/80 bg-white/80 p-3 text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900/70 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
							/>
							<Button
								type="button"
								onClick={submitChatMessage}
								disabled={chatbotDraft.trim().length === 0}
								className="w-full bg-amber-600 hover:bg-amber-700 text-white"
							>
								<Send className="size-3.5" />
								Enviar pregunta
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
