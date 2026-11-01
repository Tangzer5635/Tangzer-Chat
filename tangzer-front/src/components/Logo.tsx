import { APP_NAME } from "../lib/brand";

interface LogoProps {
    size?: number;
    /** Affiche aussi le nom à côté du symbole. */
    withName?: boolean;
}

/**
 * Logo de Préau : une arche (le préau, l'abri où l'on discute) et un point
 * pour la personne qui parle. Couleurs de la charte, en clair comme en sombre.
 */
export default function Logo({ size = 32, withName = false }: LogoProps) {
    return (
        <span className="logo">
            <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                <path d="M4 28V15a12 12 0 0 1 24 0v13h-5.5V15a6.5 6.5 0 0 0-13 0v13z" fill="var(--brand)" />
                <circle cx="16" cy="23" r="2.75" fill="var(--accent)" />
            </svg>
            {withName ? <span className="logo-name">{APP_NAME}</span> : <span className="sr-only">{APP_NAME}</span>}
        </span>
    );
}
