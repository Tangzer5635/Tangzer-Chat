import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import * as authApi from "../api/auth";
import { clearToken, getToken, onUnauthorized, setToken } from "../api/http";
import type { User } from "../types/api";
import { AuthContext, type AuthContextValue } from "./auth";

/**
 * Gère la session : au chargement, si un token est présent, on demande
 * /api/users/me pour retrouver l'utilisateur (la session survit au F5).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(() => getToken() !== null);

    const logout = useCallback(() => {
        clearToken();
        setUser(null);
    }, []);

    useEffect(() => {
        onUnauthorized(logout);
        return () => onUnauthorized(null);
    }, [logout]);

    useEffect(() => {
        if (!getToken()) {
            return;
        }
        authApi.fetchMe()
            .then(setUser)
            .catch(() => clearToken())
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const response = await authApi.login(username, password);
        setToken(response.token);
        setUser(response.user);
    }, []);

    const register = useCallback(async (username: string, displayName: string, password: string) => {
        const response = await authApi.register(username, displayName, password);
        setToken(response.token);
        setUser(response.user);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
