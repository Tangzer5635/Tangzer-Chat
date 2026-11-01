/**
 * Petit client HTTP pour l'API du serveur.
 *
 * - ajoute automatiquement le JWT ;
 * - transforme les erreurs {"message": "..."} du backend en ApiError ;
 * - prévient l'application quand la session n'est plus valide (401).
 */

const TOKEN_KEY = "tangzer.token";

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

let unauthorizedHandler: (() => void) | null = null;

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/** Appelé quand le serveur répond 401 alors qu'on envoyait un token. */
export function onUnauthorized(handler: (() => void) | null) {
    unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
    unauthorizedHandler?.();
}

interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(path, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
        if (response.status === 401 && token) {
            notifyUnauthorized();
        }
        throw new ApiError(response.status, await readErrorMessage(response));
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();
        if (data && typeof data.message === "string") {
            return data.message;
        }
    } catch {
        // Corps vide ou non JSON : on garde le message générique.
    }
    return response.status >= 500
        ? "Le serveur ne répond pas, réessayez dans un instant."
        : "Une erreur est survenue.";
}
