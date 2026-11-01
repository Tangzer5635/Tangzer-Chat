import type { MemberRole } from "../types/api";

/**
 * Mêmes règles que le backend (MemberRole / ServerService), pour n'afficher
 * que les boutons utilisables. Le backend reste seul juge.
 */

export function canManageServer(role: MemberRole | null | undefined): boolean {
    return role === "OWNER" || role === "ADMIN";
}

export function canKick(myRole: MemberRole | null | undefined, targetRole: MemberRole, isSelf: boolean): boolean {
    if (isSelf || targetRole === "OWNER") {
        return false;
    }
    if (myRole === "OWNER") {
        return true;
    }
    return myRole === "ADMIN" && targetRole === "MEMBER";
}

export function canChangeRole(myRole: MemberRole | null | undefined, targetRole: MemberRole): boolean {
    return myRole === "OWNER" && targetRole !== "OWNER";
}

export const ROLE_LABELS: Record<MemberRole, string> = {
    OWNER: "Propriétaire",
    ADMIN: "Admin",
    MEMBER: "Membre",
};
