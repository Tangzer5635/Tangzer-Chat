import { api } from "./http";
import type { Me, Presence, UserStatus } from "../types/api";

export const fetchPresence = () => api<Presence[]>("/api/presence");

export const updateMyStatus = (status: UserStatus, customStatus: string | null) =>
    api<Me>("/api/users/me/status", { method: "PUT", body: { status, customStatus } });
