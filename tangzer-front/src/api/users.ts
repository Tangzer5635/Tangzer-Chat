import { api } from "./http";
import type { User } from "../types/api";

export const searchUsers = (query: string) =>
    api<User[]>(`/api/users?search=${encodeURIComponent(query)}`);
