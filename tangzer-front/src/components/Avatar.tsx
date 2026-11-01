import { colorFor, initials } from "../lib/avatar";

interface AvatarProps {
    user: { id: number; displayName: string };
    size?: number;
}

/** Pastille ronde avec les initiales, d'une couleur propre à chaque utilisateur. */
export default function Avatar({ user, size = 40 }: AvatarProps) {
    return (
        <span
            className="avatar"
            style={{ width: size, height: size, fontSize: size * 0.4, background: colorFor(user.id) }}
            aria-hidden="true"
        >
            {initials(user.displayName, 1)}
        </span>
    );
}
