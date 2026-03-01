import { atom } from "jotai";

export type MobileActiveView = "filters" | "home" | "panel";

export const mobileActiveViewAtom = atom<MobileActiveView>("home");
