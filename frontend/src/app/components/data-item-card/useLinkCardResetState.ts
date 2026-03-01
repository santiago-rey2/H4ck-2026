import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";

interface UseLinkCardResetStateOptions {
	mediaCandidateSignature: string;
	locationSnapshotSignature: string;
	setFailedPreviewMediaUrls: Dispatch<SetStateAction<string[]>>;
	setMapSnapshotFailed: Dispatch<SetStateAction<boolean>>;
}

export function useLinkCardResetState({
	mediaCandidateSignature,
	locationSnapshotSignature,
	setFailedPreviewMediaUrls,
	setMapSnapshotFailed,
}: UseLinkCardResetStateOptions) {
	useEffect(() => {
		void mediaCandidateSignature;
		setFailedPreviewMediaUrls([]);
	}, [mediaCandidateSignature, setFailedPreviewMediaUrls]);

	useEffect(() => {
		void locationSnapshotSignature;
		setMapSnapshotFailed(false);
	}, [locationSnapshotSignature, setMapSnapshotFailed]);
}
