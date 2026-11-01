import { useState, type ReactNode } from "react";

import { useSubscription } from "../realtime/hooks";
import type { RealtimeEvent, User } from "../types/api";
import { useAuth } from "./auth";
import { UsersContext } from "./users";

/** Écoute /topic/users : quelqu'un a changé de nom ou de photo de profil. */
export function UsersProvider({ children }: { children: ReactNode }) {
    const { user: me, updateUser } = useAuth();
    const [users, setUsers] = useState<Record<number, User>>({});

    useSubscription<RealtimeEvent>("/topic/users", (event) => {
        if (event.type !== "USER_UPDATED") {
            return;
        }
        const updated = event.payload as User;
        setUsers((current) => ({ ...current, [updated.id]: updated }));
        // Modifié depuis un autre onglet : on suit aussi.
        if (me && updated.id === me.id) {
            updateUser({ ...me, displayName: updated.displayName, avatarUrl: updated.avatarUrl });
        }
    });

    return <UsersContext.Provider value={users}>{children}</UsersContext.Provider>;
}
