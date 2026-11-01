import { api } from "./http";
import type { InvitePreview, Server } from "../types/api";

export const previewInvite = (code: string) =>
    api<InvitePreview>(`/api/invites/${encodeURIComponent(code)}`);

export const acceptInvite = (code: string) =>
    api<Server>(`/api/invites/${encodeURIComponent(code)}/accept`, { method: "POST" });
