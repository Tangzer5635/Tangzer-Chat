import { useNavigate } from "react-router-dom";

import { useChatContext } from "../context/ChatContext";

export default function Toasts() {

    const navigate = useNavigate();

    const {notifications, removeNotification,} = useChatContext();
    if (notifications.length === 0) {return null;}

    const handleClick = (n: typeof notifications[0]) => {
        removeNotification(n.id);
        if (n.link) {navigate(n.link);}
    };

    return (
        <div className="toast-container">
            {notifications.map((n) => (
                <div key={n.id} className={
                        n.link
                            ? "toast toast-clickable"
                            : "toast"
                    }
                    onClick={() => handleClick(n)}
                ><span>{n.text}</span>{n.link}
                </div>

            ))}

        </div>
    );
}