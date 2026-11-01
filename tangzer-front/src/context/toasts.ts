import { createContext, useContext } from "react";

export type ToastTone = "info" | "success" | "error";

export interface Toast {
    id: number;
    text: string;
    tone: ToastTone;
    /** Page ouverte quand on clique sur la notification. */
    link?: string;
}

export interface ToastContextValue {
    toasts: Toast[];
    pushToast: (text: string, options?: { tone?: ToastTone; link?: string }) => void;
    dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToasts(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToasts doit être utilisé dans <ToastProvider>");
    }
    return ctx;
}
