import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { searchUsers } from "../../api/users";
import { useAuth } from "../../context/auth";
import { useDms } from "../../context/dms";
import { useToasts } from "../../context/toasts";
import type { User } from "../../types/api";
import Avatar from "../Avatar";
import Modal from "../Modal";
import Field from "../ui/Field";

/** Chercher quelqu'un et lui écrire en privé. */
export default function NewDmModal({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const { openWith } = useDms();
    const { pushToast } = useToasts();
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
            searchUsers(query)
                .then((users) => !cancelled && setResults(users.filter((u) => u.id !== user?.id)))
                .catch(() => !cancelled && setResults([]));
        }, 200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, user?.id]);

    const start = async (other: User) => {
        try {
            const conversation = await openWith(other.id);
            onClose();
            navigate(`/app/dm/${conversation.channelId}`);
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Conversation impossible.", { tone: "error" });
        }
    };

    return (
        <Modal title="Nouveau message" subtitle="À qui veux-tu écrire ?" onClose={onClose}>
            <div className="form">
                <Field label="Rechercher une personne" hint="Par son nom d'utilisateur ou son nom affiché.">
                    {(control) => (
                        <input {...control} type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
                    )}
                </Field>
                <div className="user-results" aria-live="polite">
                    {results.length === 0 && <p className="form-hint">Personne ne correspond à « {query} ».</p>}
                    {results.map((result) => (
                        <button key={result.id} className="user-result" onClick={() => start(result)}>
                            <Avatar user={result} size={32} />
                            <span>
                                <strong>{result.displayName}</strong>
                                <small>@{result.username}</small>
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
