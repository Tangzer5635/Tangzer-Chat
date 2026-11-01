import { useCallback, useMemo, useState, type ReactNode } from "react";

import { ToastContext, type Toast, type ToastContextValue, type ToastTone } from "./toasts";

const TOAST_DURATION_MS = 5000;

let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: number) => {
        setToasts((current) => current.filter((t) => t.id !== id));
    }, []);

    const pushToast = useCallback((text: string, options?: { tone?: ToastTone; link?: string }) => {
        const id = ++nextToastId;
        setToasts((current) => [...current.slice(-3), { id, text, tone: options?.tone ?? "info", link: options?.link }]);
        setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    }, [dismissToast]);

    const value = useMemo<ToastContextValue>(
        () => ({ toasts, pushToast, dismissToast }),
        [toasts, pushToast, dismissToast]
    );

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
