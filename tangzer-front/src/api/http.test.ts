import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, ApiError, clearToken, onUnauthorized, setToken } from "./http";

function mockFetch(status: number, body?: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(
        new Response(body === undefined ? null : JSON.stringify(body), { status })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("api()", () => {
    beforeEach(() => {
        const store = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => store.set(k, v),
            removeItem: (k: string) => store.delete(k),
        });
    });

    afterEach(() => {
        onUnauthorized(null);
        vi.unstubAllGlobals();
    });

    it("envoie le JWT et le corps JSON", async () => {
        setToken("abc");
        const fetchMock = mockFetch(200, { ok: true });

        const result = await api<{ ok: boolean }>("/api/test", { method: "POST", body: { a: 1 } });

        expect(result).toEqual({ ok: true });
        const [, init] = fetchMock.mock.calls[0];
        expect(init.headers.Authorization).toBe("Bearer abc");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(init.body).toBe('{"a":1}');
    });

    it("n'envoie pas de header Authorization sans token", async () => {
        clearToken();
        const fetchMock = mockFetch(200, []);

        await api("/api/test");

        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });

    it("transforme le message d'erreur du backend en ApiError", async () => {
        mockFetch(409, { message: "Ce nom d'utilisateur est déjà pris" });

        await expect(api("/api/test")).rejects.toEqual(
            new ApiError(409, "Ce nom d'utilisateur est déjà pris")
        );
    });

    it("prévient l'application quand le token est refusé", async () => {
        setToken("expiré");
        mockFetch(401);
        const handler = vi.fn();
        onUnauthorized(handler);

        await expect(api("/api/users/me")).rejects.toBeInstanceOf(ApiError);
        expect(handler).toHaveBeenCalledOnce();
    });

    it("ne déclenche pas la déconnexion pour un mauvais mot de passe (pas de token)", async () => {
        clearToken();
        mockFetch(401, { message: "Identifiant ou mot de passe incorrect" });
        const handler = vi.fn();
        onUnauthorized(handler);

        await expect(api("/api/auth/login")).rejects.toThrow("Identifiant ou mot de passe incorrect");
        expect(handler).not.toHaveBeenCalled();
    });

    it("renvoie undefined pour une réponse 204", async () => {
        mockFetch(204);

        await expect(api("/api/test", { method: "DELETE" })).resolves.toBeUndefined();
    });
});
