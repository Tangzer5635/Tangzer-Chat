import { createContext, useContext } from "react";

import type { Me } from "../types/api";

export interface AuthContextValue {
    /** null tant qu'on n'est pas connecté. */
    user: Me | null;
    /** true pendant la vérification du token au démarrage. */
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, displayName: string, password: string) => Promise<void>;
    logout: () => void;
    /** Met à jour l'utilisateur connecté après un changement (statut, profil…). */
    updateUser: (user: Me) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth doit être utilisé dans <AuthProvider>");
    }
    return ctx;
}
