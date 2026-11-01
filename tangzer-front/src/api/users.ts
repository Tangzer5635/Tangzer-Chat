import { api } from "./http";
import type { User } from "../types/api";

export function listUsers() {
    return api<User[]>("/api/users");
}
