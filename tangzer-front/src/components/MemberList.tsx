import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { changeMemberRole, kickMember, listMembers } from "../api/servers";
import { useAuth } from "../context/auth";
import { useToasts } from "../context/toasts";
import { applyMemberEvent, groupMembersByRole } from "../lib/members";
import { canChangeRole, canKick, ROLE_LABELS } from "../lib/permissions";
import { useSubscription } from "../realtime/hooks";
import type { Member, RealtimeEvent, Server } from "../types/api";
import Avatar from "./Avatar";

/** Colonne de droite : membres du serveur, regroupés par rôle. */
export default function MemberList({ server }: { server: Server }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { pushToast } = useToasts();

    const [members, setMembers] = useState<Member[]>([]);
    const [selected, setSelected] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        listMembers(server.id).then((list) => !cancelled && setMembers(list)).catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [server.id]);

    useSubscription<RealtimeEvent>(`/topic/servers/${server.id}`, (event) => {
        setMembers((current) => applyMemberEvent(current, event));
    });

    const groups = groupMembersByRole(members);
    const selectedMember = members.find((m) => m.user.id === selected);

    const run = async (action: () => Promise<unknown>, success: string) => {
        try {
            await action();
            pushToast(success, { tone: "success" });
            setSelected(null);
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Action impossible.", { tone: "error" });
        }
    };

    return (
        <aside className="member-list" aria-label="Membres">
            {groups.map((group) => (
                <section key={group.role}>
                    <h3 className="member-group">{group.label} — {group.members.length}</h3>
                    {group.members.map((member) => (
                        <button
                            key={member.user.id}
                            className={selected === member.user.id ? "member-item active" : "member-item"}
                            onClick={() => setSelected(selected === member.user.id ? null : member.user.id)}
                        >
                            <Avatar user={member.user} size={32} />
                            <span className="member-name">{member.user.displayName}</span>
                            {member.role === "OWNER" && <span className="member-crown" title="Propriétaire">👑</span>}
                        </button>
                    ))}
                </section>
            ))}

            {selectedMember && (
                <div className="member-card">
                    <div className="member-card-banner" style={{ background: server.color }} />
                    <div className="member-card-body">
                        <Avatar user={selectedMember.user} size={64} />
                        <h4>{selectedMember.user.displayName}</h4>
                        <p className="member-card-username">@{selectedMember.user.username}</p>
                        <span className={`role-badge role-${selectedMember.role.toLowerCase()}`}>
                            {ROLE_LABELS[selectedMember.role]}
                        </span>
                        <p className="member-card-since">
                            Membre depuis le {new Date(selectedMember.joinedAt).toLocaleDateString("fr-FR")}
                        </p>

                        <div className="member-card-actions">
                            {selectedMember.user.id !== user?.id && (
                                <button
                                    className="button-primary"
                                    onClick={() => navigate(`/app/dm?with=${selectedMember.user.username}`)}
                                >
                                    Message privé
                                </button>
                            )}
                            {canChangeRole(server.myRole, selectedMember.role) && (
                                <button
                                    className="button-secondary"
                                    onClick={() => run(
                                        () => changeMemberRole(server.id, selectedMember.user.id,
                                            selectedMember.role === "ADMIN" ? "MEMBER" : "ADMIN"),
                                        selectedMember.role === "ADMIN"
                                            ? `${selectedMember.user.displayName} n'est plus admin.`
                                            : `${selectedMember.user.displayName} est maintenant admin.`
                                    )}
                                >
                                    {selectedMember.role === "ADMIN" ? "Retirer admin" : "Nommer admin"}
                                </button>
                            )}
                            {canKick(server.myRole, selectedMember.role, selectedMember.user.id === user?.id) && (
                                <button
                                    className="button-danger"
                                    onClick={() => window.confirm(`Expulser ${selectedMember.user.displayName} ?`) && run(
                                        () => kickMember(server.id, selectedMember.user.id),
                                        `${selectedMember.user.displayName} a été expulsé.`
                                    )}
                                >
                                    Expulser
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
