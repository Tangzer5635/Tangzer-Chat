import { updatePreferences } from "../../api/users";
import { useAuth } from "../../context/auth";
import { useToasts } from "../../context/toasts";
import { APP_NAME } from "../../lib/brand";
import { FONT_SIZE_MAX, FONT_SIZE_MIN, THEMES } from "../../lib/theme";
import type { Appearance, ThemeId } from "../../types/api";

/** Mini-interface dessinée avec les vraies couleurs d'un mode (clair ou sombre). */
function MiniInterface({ scheme }: { scheme: "light" | "dark" }) {
    return (
        <span className="theme-mini" data-scheme={scheme}>
            <span className="theme-mini-nav" />
            <span className="theme-mini-main">
                <span className="theme-mini-line" />
                <span className="theme-mini-line short" />
                <span className="theme-mini-button" />
            </span>
        </span>
    );
}

function ThemePreview({ theme }: { theme: ThemeId }) {
    return (
        <span className="theme-preview" aria-hidden="true">
            {theme === "system" ? (
                <>
                    <MiniInterface scheme="light" />
                    <MiniInterface scheme="dark" />
                </>
            ) : (
                <MiniInterface scheme={theme} />
            )}
        </span>
    );
}

/** Thème, taille du texte, mode compact : appliqués immédiatement. */
export default function AppearanceSettings() {
    const { user, updateUser } = useAuth();
    const { pushToast } = useToasts();

    if (!user) {
        return null;
    }

    const save = async (change: Partial<Appearance>) => {
        // On applique tout de suite, puis on enregistre sur le compte.
        updateUser({ ...user, ...change });
        try {
            updateUser(await updatePreferences(change));
        } catch (err) {
            updateUser(user);
            pushToast(err instanceof Error ? err.message : "Réglage non enregistré.", { tone: "error" });
        }
    };

    return (
        <div className="form">
            <fieldset className="theme-choices">
                <legend>Thème</legend>
                <div className="theme-grid">
                    {THEMES.map((theme) => (
                        <label key={theme.id} className={user.theme === theme.id ? "theme-card active" : "theme-card"}>
                            <input
                                type="radio"
                                name="theme"
                                value={theme.id}
                                checked={user.theme === theme.id}
                                onChange={() => save({ theme: theme.id })}
                            />
                            <ThemePreview theme={theme.id} />
                            <strong>{theme.label}</strong>
                            <small>{theme.description}</small>
                        </label>
                    ))}
                </div>
            </fieldset>

            <label htmlFor="font-size">Taille du texte des messages : {user.fontSize} px</label>
            <input
                id="font-size"
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                step={1}
                value={user.fontSize}
                onChange={(e) => save({ fontSize: Number(e.target.value) })}
            />

            <label className="switch">
                <input type="checkbox" checked={user.compact} onChange={(e) => save({ compact: e.target.checked })} />
                <span>
                    <strong>Mode compact</strong>
                    <small>Plus de messages à l'écran : petites lignes, sans grands avatars.</small>
                </span>
            </label>

            <div className="appearance-sample" aria-label="Aperçu d'un message">
                <div className="message with-header">
                    <div className="message-row">
                        <div className="message-gutter">
                            <span className="avatar" style={{ width: 40, height: 40, background: "var(--brand)", color: "var(--on-brand)" }}>P</span>
                        </div>
                        <div className="message-body">
                            <div className="message-meta"><strong>{APP_NAME}</strong><time>12:34</time></div>
                            <div className="message-content">
                                Voilà à quoi ressemblent les messages. <span className="mention">@{user.username}</span> 👋
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
