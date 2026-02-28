export type AppToastTone = "success" | "info" | "warning" | "error";

export interface AppToastPayload {
	tone?: AppToastTone;
	title?: string;
	message: string;
	durationMs?: number;
}

type ToastListener = (payload: AppToastPayload) => void;

let listener: ToastListener | null = null;

export function registerToastListener(nextListener: ToastListener) {
	listener = nextListener;
}

export function unregisterToastListener() {
	listener = null;
}

export function emitToast(payload: AppToastPayload) {
	if (!listener) {
		return;
	}

	listener(payload);
}
