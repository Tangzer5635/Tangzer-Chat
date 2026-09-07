import { useRef, useEffect, useState } from "react";

import { sendMessage } from "../services/websocket";
import { useChatContext } from "../context/ChatContext";

export default function Chat() {

    const {currentUser, publicMessages,} = useChatContext();

    const [message, setMessage] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth",});
    }, [publicMessages]);

    const handleSend = () => {
        if (!message.trim()) return;
        sendMessage(message.trim());
        setMessage("");
    };

    return (
        <div className="page">

            <div className="chat-box" style={{ margin: "auto" }}>

                <div className="chat-header">
                    <h1>💬 Chat public</h1>
                    <span>Connecté : {currentUser}</span>
                </div>

                <div className="messages">

                    {publicMessages.map((msg, i) => (

                        <div key={i} className={msg.sender === currentUser
                                    ? "message own"
                                    : "message"
                            }>
                            <div className="message-meta">
                                <strong>{msg.sender}</strong>
                                <time dateTime={msg.timestamp}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </time>
                            </div>
                            <p>{msg.content}</p>
                        </div>

                    ))}

                    <div ref={bottomRef} />
                </div>

                <div className="message-input">

                    <input value={message} onChange={(e) => setMessage(e.target.value)}
                        placeholder="Votre message..." onKeyDown={(e) => {if (e.key === "Enter") handleSend();}}
                    />

                    <button onClick={handleSend}>Envoyer</button>

                </div>

            </div>

        </div>
    );
}