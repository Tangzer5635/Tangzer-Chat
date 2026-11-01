import { useEffect, useState, type ReactNode } from "react";

import { fetchProfile } from "../api/users";
import { usePresence } from "../context/presence";
import { useLiveUser } from "../context/users";
import { colorFor } from "../lib/avatar";
import { STATUS_LABELS } from "../lib/presence";
import type { Profile, User } from "../types/api";
import Avatar from "./Avatar";
import { APP_NAME } from "../lib/brand";

interface ProfileCardProps {
    user: User;
    /** Boutons sous la carte (message privé, rôle…). */
    children?: ReactNode;
    /** Ligne supplémentaire (ex. rôle sur le serveur). */
    extra?: ReactNode;
}

/** Carte de profil : bannière, photo, statut, bio, date d'arrivée. */
export default function ProfileCard({ user, children, extra }: ProfileCardProps) {
    const live = useLiveUser(user);
    const { statusOf, customStatusOf } = usePresence();
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchProfile(user.id).then((p) => !cancelled && setProfile(p)).catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [user.id]);

    const status = statusOf(user.id);
    const customStatus = customStatusOf(user.id);

    return (
        <div className="profile-card">
            <div className="profile-card-banner" style={{ background: profile?.bannerColor ?? colorFor(user.id) }} />
            <div className="profile-card-body">
                <div className="profile-card-avatar">
                    <Avatar user={live} size={80} status={status} />
                </div>
                <h4>{live.displayName}</h4>
                <p className="profile-card-username">@{live.username} · {STATUS_LABELS[status]}</p>
                {customStatus && <p className="profile-card-custom">{customStatus}</p>}
                {extra}

                {profile?.bio && (
                    <section className="profile-card-section">
                        <h5>À propos de moi</h5>
                        <p>{profile.bio}</p>
                    </section>
                )}
                {profile && (
                    <section className="profile-card-section">
                        <h5>Membre de {APP_NAME} depuis</h5>
                        <p>{new Date(profile.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </section>
                )}

                {children && <div className="profile-card-actions">{children}</div>}
            </div>
        </div>
    );
}
