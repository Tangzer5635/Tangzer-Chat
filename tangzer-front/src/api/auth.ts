import { api } from "./http";
import type { User } from "../types/api";

export interface AuthResponse {
    token: string;
    user: User;
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
    return api<User>("/api/users/me");
}
