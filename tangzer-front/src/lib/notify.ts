import { playMessageSound } from "../calls/audio";
import { loadDevicePrefs } from "./devicePrefs";

/**
 * Prévient l'utilisateur d'un nouveau message privé ou d'une mention :
 * un petit son (si activé) et une notification du système quand l'onglet
 * n'est pas affiché (si autorisé).
 */
export function notify(title: string, body: string, onClick?: () => void) {
    const prefs = loadDevicePrefs();

    if (prefs.sounds) {
        try {
            playMessageSound();
        } catch {
            // Son bloqué par le navigateur tant qu'on n'a pas cliqué dans la page.
        }
    }

    if (prefs.desktopNotifications && document.visibilityState === "hidden"
        && "Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(title, { body, icon: "/icon-192.png" });
        notification.onclick = () => {
            window.focus();
            onClick?.();
            notification.close();
        };
    }
}
