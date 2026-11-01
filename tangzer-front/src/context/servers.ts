import { createContext, useContext } from "react";

import type { Server } from "../types/api";
import type { ServersAction } from "../lib/serversReducer";

export interface ServersContextValue {
    servers: Server[];
    loaded: boolean;
    getServer: (serverId: number) => Server | undefined;
    dispatch: (action: ServersAction) => void;
}

export const ServersContext = createContext<ServersContextValue | null>(null);

export function useServers(): ServersContextValue {
    const ctx = useContext(ServersContext);
    if (!ctx) {
        throw new Error("useServers doit être utilisé dans <ServersProvider>");
    }
    return ctx;
}
