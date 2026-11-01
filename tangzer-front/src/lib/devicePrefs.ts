/**
 * Réglages propres à cet appareil (pas au compte) : notifications du bureau,
 * sons, micro et caméra choisis.
 */

export interface DevicePrefs {
    desktopNotifications: boolean;
    sounds: boolean;
    microphoneId: string | null;
    cameraId: string | null;
}

const KEY = "tangzer.device";
const DEFAULTS: DevicePrefs = { desktopNotifications: false, sounds: true, microphoneId: null, cameraId: null };

export function loadDevicePrefs(): DevicePrefs {
    try {
        const stored = localStorage.getItem(KEY);
        return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
        return DEFAULTS;
    }
}

export function saveDevicePrefs(prefs: DevicePrefs) {
    try {
        localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
        // tant pis : réglages perdus au rechargement
    }
}

/** Contrainte getUserMedia pour un appareil choisi (ou celui par défaut). */
export function deviceConstraint(deviceId: string | null): { deviceId?: { exact: string } } {
    return deviceId ? { deviceId: { exact: deviceId } } : {};
}
