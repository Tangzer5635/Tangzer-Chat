import { useRef, useState, useEffect } from "react";

import {
    joinRoom,
    sendRoomMessage,
} from "../services/websocket";

import { useChatContext } from "../context/ChatContext";

const ROOMS = ["general", "dev", "random"];

export default function Rooms() {

    const {
        currentUser,
        roomMessages,
        setRoomMessages,
    } = useChatContext();

    const [currentRoom, setCurrentRoom] =
        useState<string | null>(null);

    const [content, setContent] = useState("");

    const [roomReady, setRoomReady] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [roomMessages]);

    const handleJoin = (roomId: string) => {

        setRoomMessages([]);
        setCurrentRoom(roomId);
        setRoomReady(false);

        joinRoom(
            roomId,
            (msg) => {
                setRoomMessages((prev) => [...prev, msg]);

                // Le serveur envoie notre JOIN après avoir ajouté
                // l'utilisateur comme membre du salon. On n'active
                // donc l'envoi qu'après réception de ce message.
                if (
                    msg.type === "JOIN" &&
                    msg.sender === currentUser
                ) {
                    setRoomReady(true);
                }
            }
        );
    };

    const handleSend = () => {

        if (!currentRoom || !roomReady || !content.trim()) {
            return;
        }

        sendRoomMessage(
            currentRoom,
            content.trim()
        );

        setContent("");
    };

    return (
        <div className="page">

            <div className="rooms-layout">

                {/* ---- Liste des salons ---- */}

                <div className="rooms-list">

                    <h2>Salons</h2>

                    {ROOMS.map((room) => (

                        <button
                            key={room}
                            onClick={() => handleJoin(room)}
                            className={
                                currentRoom === room
                                    ? "room-btn active"
                                    : "room-btn"
                            }
                        >
                            # {room}
                        </button>

                    ))}

                </div>

                {/* ---- Zone de chat ---- */}

                <div className="chat-box">

                    <div className="chat-header">

                        <h1>
                            {currentRoom
                                ? `# ${currentRoom}`
                                : "Choisissez un salon"}
                        </h1>

                    </div>

                    <div className="messages">

                        {roomMessages.map(
                            (msg, index) => (

                                <div
                                    key={index}
                                    className={
                                        msg.sender === currentUser
                                            ? "message own"
                                            : "message"
                                    }
                                >

                                    <div className="message-meta">
                                        <strong>
                                            {msg.sender}
                                        </strong>
                                        <time dateTime={msg.timestamp}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </time>
                                    </div>

                                    <p>
                                        {msg.content}
                                    </p>

                                </div>
                            )
                        )}

                        <div ref={bottomRef} />

                    </div>

                    {currentRoom && (

                        <div className="message-input">

                            <input
                                value={content}
                                onChange={(e) =>
                                    setContent(e.target.value)
                                }
                                disabled={!roomReady}
                                placeholder={
                                    roomReady
                                        ? `Message dans #${currentRoom}...`
                                        : `Connexion à #${currentRoom}...`
                                }
                                onKeyDown={(e) => {

                                    if (e.key === "Enter") {
                                        handleSend();
                                    }

                                }}
                            />

                            <button onClick={handleSend} disabled={!roomReady}>
                                Envoyer
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}