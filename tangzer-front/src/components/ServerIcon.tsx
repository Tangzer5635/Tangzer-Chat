import { initials } from "../lib/avatar";
import { readableTextOn } from "../lib/contrast";

interface ServerIconProps {
    server: { name: string; icon: string | null; iconUrl?: string | null; color: string };
    size?: number;
}

/** Icône d'un serveur : son image, son emoji, ou ses initiales sur sa couleur. */
export default function ServerIcon({ server, size = 48 }: ServerIconProps) {
    if (server.iconUrl) {
        return <img className="server-icon server-icon-image" src={server.iconUrl} alt="" style={{ width: size, height: size }} />;
    }
    return (
        <span
            className={server.icon ? "server-icon server-icon-emoji" : "server-icon"}
            style={{
                width: size,
                height: size,
                fontSize: server.icon ? size * 0.5 : size * 0.36,
                background: server.color,
                color: readableTextOn(server.color),
            }}
            aria-hidden="true"
        >
            {server.icon ?? initials(server.name)}
        </span>
    );
}
