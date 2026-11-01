import { updatePreferences } from "../../api/users";
import { useAuth } from "../../context/auth";
import { useToasts } from "../../context/toasts";
import { ACCENT_COLORS, THEMES } from "../../lib/theme";
import type { Appearance } from "../../types/api";

/** Thème, couleur d'accent, taille du texte, mode compact : appliqués immédiatement. */
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
            <label>Thème</label>
            <div className="theme-grid">
                {THEMES.map((theme) => {
                    const [rail, sidebar, main, accent] = theme.preview;
                    return (
                        <button
                            key={theme.id}
                            className={user.theme === theme.id ? "theme-card active" : "theme-card"}
                            onClick={() => save({ theme: theme.id })}
                        >
                            <span className="theme-preview" style={{ background: main }}>
                                <span style={{ background: rail }} />
                                <span style={{ background: sidebar }} />
                                <i style={{ background: accent }} />
                            </span>
                            <strong>{theme.label}</strong>
                        </button>
                    );
                })}
            </div>

            <label>Couleur d'accent</label>
            <div className="color-grid">
                <button
                    type="button"
                    className={user.accentColor === null ? "color-choice active theme-default" : "color-choice theme-default"}
                    onClick={() => save({ accentColor: null })}
                    title="Celle du thème"
                >
                    ↺
                </button>
                {ACCENT_COLORS.map((color) => (
                    <button
                        type="button"
                        key={color}
                        className={user.accentColor === color ? "color-choice active" : "color-choice"}
                        style={{ background: color }}
                        onClick={() => save({ accentColor: color })}
                        aria-label={`Accent ${color}`}
                    />
                ))}
                <input
                    type="color"
                    className="color-input"
                    value={user.accentColor ?? "#5865f2"}
                    onChange={(e) => save({ accentColor: e.target.value })}
                    title="Couleur personnalisée"
                />
            </div>

            <label htmlFor="font-size">Taille du texte des messages : {user.fontSize} px</label>
            <input
                id="font-size"
                type="range"
                min={12}
                max={20}
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

            <div className="appearance-sample">
                <div className="message with-header">
                    <div className="message-row">
                        <div className="message-gutter">
                            <span className="avatar" style={{ width: 40, height: 40, background: "var(--accent)", color: "var(--accent-text)" }}>T</span>
                        </div>
                        <div className="message-body">
                            <div className="message-meta"><strong>Tangzer</strong><time>12:34</time></div>
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
