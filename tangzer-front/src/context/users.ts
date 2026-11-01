import { createContext, useContext } from "react";

import type { User } from "../types/api";

/** Dernière version connue de chaque utilisateur (nom, photo) reçue en direct. */
export const UsersContext = createContext<Record<number, User> | null>(null);

/**
 * Renvoie la version la plus récente d'un utilisateur : si quelqu'un change de
 * photo ou de nom, les anciens messages se mettent à jour aussi.
 */
export function useLiveUser<T extends User | { id: number; displayName: string }>(user: T): T {
    const latest = useContext(UsersContext)?.[user.id];
    return latest ? { ...user, ...latest } : user;
}
