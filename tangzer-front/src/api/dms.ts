import { api } from "./http";
import type { DmConversation } from "../types/api";

export const listConversations = () => api<DmConversation[]>("/api/dms");

export const openConversation = (userId: number) =>
    api<DmConversation>("/api/dms", { method: "POST", body: { userId } });
