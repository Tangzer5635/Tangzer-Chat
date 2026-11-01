import { api } from "./http";
import type { Me } from "../types/api";

export interface AuthResponse {
    token: string;
    user: Me;
}

export function login(username: string, password: string) {
    return api<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { username, password },
    });
}

export function register(username: string, displayName: string, password: string) {
    return api<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: { username, displayName, password },
    });
}

export function fetchMe() {
    return api<Me>("/api/users/me");
}
