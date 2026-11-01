import { useNavigate } from "react-router-dom";

import { useToasts } from "../context/toasts";

export default function Toasts() {
    const navigate = useNavigate();
    const { toasts, dismissToast } = useToasts();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="toast-container" role="status">
            {toasts.map((toast) => (
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
                    {toast.text}
                </button>
            ))}
        </div>
    );
}
