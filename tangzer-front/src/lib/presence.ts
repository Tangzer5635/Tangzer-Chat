import type { Member, UserStatus } from "../types/api";
import { groupMembersByRole, type MemberGroup } from "./members";

/** Inactif après 5 minutes sans toucher à la souris ni au clavier. */
export const IDLE_AFTER_MS = 5 * 60 * 1000;

export function isIdle(lastActivity: number, now: number): boolean {
    return now - lastActivity >= IDLE_AFTER_MS;
}

export const STATUS_LABELS: Record<UserStatus, string> = {
    ONLINE: "En ligne",
    IDLE: "Inactif",
    DND: "Ne pas déranger",
    INVISIBLE: "Invisible",
    OFFLINE: "Hors ligne",
};

/** Statuts que l'on peut choisir, avec une explication. */
export const SELECTABLE_STATUSES: { status: UserStatus; description: string }[] = [
    { status: "ONLINE", description: "" },
    { status: "IDLE", description: "" },
    { status: "DND", description: "Tu ne recevras plus de notifications." },
    { status: "INVISIBLE", description: "Tu apparaîtras hors ligne, mais tu pourras toujours tout utiliser." },
];

export interface PresenceGroup extends MemberGroup {
    offline: boolean;
}

/**
 * Liste des membres façon Discord : les membres connectés regroupés par rôle,
 * puis tous les membres hors ligne ensemble.
 */
export function groupMembersByPresence(members: Member[], statusOf: (userId: number) => UserStatus): PresenceGroup[] {
    const online = members.filter((m) => statusOf(m.user.id) !== "OFFLINE");
    const offline = members
        .filter((m) => statusOf(m.user.id) === "OFFLINE")
        .sort((a, b) => a.user.displayName.localeCompare(b.user.displayName, "fr"));

    const groups: PresenceGroup[] = groupMembersByRole(online).map((group) => ({
        ...group,
        label: group.role === "MEMBER" ? "En ligne" : group.label,
        offline: false,
    }));
    if (offline.length > 0) {
        groups.push({ role: "MEMBER", label: "Hors ligne", members: offline, offline: true });
    }
    return groups;
}
