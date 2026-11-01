import type { Member, MemberRole, RealtimeEvent } from "../types/api";

/** Applique un événement de serveur à la liste des membres affichée. */
export function applyMemberEvent(members: Member[], event: RealtimeEvent): Member[] {
    switch (event.type) {
        case "MEMBER_JOINED": {
            const member = event.payload as Member;
            return [...members.filter((m) => m.user.id !== member.user.id), member];
        }
        case "MEMBER_UPDATED": {
            const member = event.payload as Member;
            return members.map((m) => (m.user.id === member.user.id ? member : m));
        }
        case "MEMBER_LEFT": {
            const { userId } = event.payload as { userId: number };
            return members.filter((m) => m.user.id !== userId);
        }
        default:
            return members;
    }
}

export interface MemberGroup {
    role: MemberRole;
    label: string;
    members: Member[];
}

const GROUPS: { role: MemberRole; label: string }[] = [
    { role: "OWNER", label: "Propriétaire" },
    { role: "ADMIN", label: "Admins" },
    { role: "MEMBER", label: "Membres" },
];

/** Regroupe par rôle (propriétaire, admins, membres), triés par nom ; les groupes vides sont omis. */
export function groupMembersByRole(members: Member[]): MemberGroup[] {
    return GROUPS
        .map(({ role, label }) => ({
            role,
            label,
            members: members
                .filter((m) => m.role === role)
                .sort((a, b) => a.user.displayName.localeCompare(b.user.displayName, "fr")),
        }))
        .filter((group) => group.members.length > 0);
}
