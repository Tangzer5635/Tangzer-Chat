import { api } from "./http";
import type { Appearance, Me, Profile, User } from "../types/api";

export const searchUsers = (query: string) =>
    api<User[]>(`/api/users?search=${encodeURIComponent(query)}`);

export interface ProfileForm {
    displayName?: string;
    bio?: string;
    bannerColor?: string;
    /** Identifiant d'une image envoyée, ou "" pour revenir aux initiales. */
    avatarId?: string;
}

export const updateProfile = (form: ProfileForm) =>
    api<Me>("/api/users/me", { method: "PATCH", body: form });

export const updatePreferences = (preferences: Partial<Appearance>) =>
    api<Me>("/api/users/me/preferences", { method: "PUT", body: preferences });

export const changePassword = (currentPassword: string, newPassword: string) =>
    api<void>("/api/users/me/password", { method: "PUT", body: { currentPassword, newPassword } });

export const fetchProfile = (userId: number) => api<Profile>(`/api/users/${userId}/profile`);
