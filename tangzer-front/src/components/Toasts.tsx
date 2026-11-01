import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useToasts } from "../context/toasts";

const ICONS = { info: Info, success: CircleCheck, error: CircleAlert };

/** Notifications éphémères en bas à droite, annoncées par les lecteurs d'écran. */
export default function Toasts() {
    const navigate = useNavigate();
    const { toasts, dismissToast } = useToasts();

    return (
        <div className="toast-container" role="status">
            {toasts.map((toast) => {
                const Icon = ICONS[toast.tone];
                return (
                    <button
                        key={toast.id}
                        className={`toast toast-${toast.tone}`}
                        onClick={() => {
                            dismissToast(toast.id);
                            if (toast.link) {
                                navigate(toast.link);
                            }
                        }}
                    >
                        <Icon size={18} />
                        <span>{toast.text}</span>
                    </button>
                );
            })}
        </div>
    );
}
