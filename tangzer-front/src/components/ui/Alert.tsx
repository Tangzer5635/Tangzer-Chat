import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "error";

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert };

interface AlertProps {
    tone: AlertTone;
    title?: string;
    children?: ReactNode;
    /** Bouton ou lien d'action affiché à droite. */
    action?: ReactNode;
    className?: string;
}

/**
 * Message d'état : bande de couleur, icône et texte.
 * Une erreur est annoncée immédiatement par les lecteurs d'écran (role="alert"),
 * les autres messages poliment (role="status").
 */
export default function Alert({ tone, title, children, action, className }: AlertProps) {
    const Icon = ICONS[tone];
    return (
        <div className={`alert alert-${tone}${className ? ` ${className}` : ""}`} role={tone === "error" ? "alert" : "status"}>
            <Icon className="alert-icon" size={20} />
            <div className="alert-text">
                {title && <strong>{title}</strong>}
                {children && <div>{children}</div>}
            </div>
            {action && <div className="alert-action">{action}</div>}
        </div>
    );
}
