import { useLiveUser } from "../context/users";
import { colorFor, initials } from "../lib/avatar";
import { STATUS_LABELS } from "../lib/presence";
import type { UserStatus } from "../types/api";

interface AvatarProps {
    user: { id: number; displayName: string; avatarUrl?: string | null };
    size?: number;
    /** Affiche une pastille de statut en bas à droite. */
    status?: UserStatus;
}

/** Photo de profil, ou pastille ronde avec les initiales sur une couleur propre à chacun. */
export default function Avatar({ user, size = 40, status }: AvatarProps) {
    const live = useLiveUser(user);

    const avatar = live.avatarUrl ? (
        <img className="avatar avatar-image" src={live.avatarUrl} alt="" style={{ width: size, height: size }} />
    ) : (
        <span
            className="avatar"
            style={{ width: size, height: size, fontSize: size * 0.4, background: colorFor(live.id) }}
            aria-hidden="true"
        >
            {initials(live.displayName, 1)}
        </span>
    );

    if (!status) {
        return avatar;
    }

    const dot = Math.max(10, Math.round(size * 0.3));
    return (
        <span className="avatar-wrapper" style={{ width: size, height: size }}>
            {avatar}
            <span
                className={`status-dot status-${status.toLowerCase()}`}
                style={{ width: dot, height: dot }}
                title={STATUS_LABELS[status]}
            />
        </span>
    );
}
