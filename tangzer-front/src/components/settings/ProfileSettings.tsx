import { useRef, useState } from "react";

import { uploadAttachment } from "../../api/attachments";
import { updateProfile } from "../../api/users";
import { useAuth } from "../../context/auth";
import { useToasts } from "../../context/toasts";
import { validateImageFile } from "../../lib/attachments";
import { colorFor } from "../../lib/avatar";
import { colorName, SERVER_COLORS } from "../../lib/choices";
import { cropToSquare } from "../../lib/image";
import Avatar from "../Avatar";

/** Mon profil : photo, nom affiché, bio, couleur de bannière (avec aperçu en direct). */
export default function ProfileSettings() {
    const { user, updateUser } = useAuth();
    const { pushToast } = useToasts();
    const fileInput = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState(user?.displayName ?? "");
    const [bio, setBio] = useState(user?.bio ?? "");
    const [bannerColor, setBannerColor] = useState(user?.bannerColor ?? "");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!user) {
        return null;
    }

    const changed = displayName !== user.displayName || bio !== (user.bio ?? "") || bannerColor !== (user.bannerColor ?? "");

    const onAvatarChosen = async (file: File | undefined) => {
        if (!file) {
            return;
        }
        const error = validateImageFile(file);
        if (error) {
            pushToast(error, { tone: "error" });
            return;
        }
        setUploading(true);
        try {
            const attachment = await uploadAttachment(await cropToSquare(file), () => undefined);
            updateUser(await updateProfile({ avatarId: attachment.id }));
            pushToast("Photo de profil mise à jour.", { tone: "success" });
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Envoi impossible.", { tone: "error" });
        } finally {
            setUploading(false);
        }
    };

    const removeAvatar = async () => {
        try {
            updateUser(await updateProfile({ avatarId: "" }));
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Action impossible.", { tone: "error" });
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            updateUser(await updateProfile({ displayName, bio, bannerColor }));
            pushToast("Profil enregistré.", { tone: "success" });
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Enregistrement impossible.", { tone: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-split">
            <div className="form">
                <span className="form-label">Photo de profil</span>
                <div className="settings-row">
                    <button className="button-primary" onClick={() => fileInput.current?.click()} disabled={uploading} aria-describedby="avatar-hint">
                        {uploading ? "Envoi…" : "Changer la photo"}
                    </button>
                    {user.avatarUrl && <button className="button-link" onClick={removeAvatar}>Retirer la photo</button>}
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        hidden
                        onChange={(e) => {
                            void onAvatarChosen(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                </div>
                <p className="form-hint" id="avatar-hint">L'image est recadrée en carré au centre.</p>

                <label htmlFor="profile-name">Nom affiché</label>
                <input id="profile-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={32} />

                <label htmlFor="profile-bio">À propos de moi</label>
                <textarea
                    id="profile-bio"
                    aria-describedby="profile-bio-count"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={190}
                    rows={4}
                    placeholder="Quelques mots sur toi…"
                />
                <p className="form-hint" id="profile-bio-count">{190 - bio.length} caractères restants</p>

                <fieldset className="choice-group">
                    <legend className="form-label">Couleur de la bannière</legend>
                    <div className="color-grid">
                        <button
                            type="button"
                            className="color-choice"
                            style={{ background: colorFor(user.id) }}
                            aria-pressed={bannerColor === ""}
                            aria-label="Couleur par défaut"
                            title="Couleur par défaut"
                            onClick={() => setBannerColor("")}
                        />
                        {SERVER_COLORS.map((color) => (
                            <button
                                type="button"
                                key={color}
                                className="color-choice"
                                style={{ background: color }}
                                aria-pressed={bannerColor === color}
                                aria-label={colorName(color)}
                                title={colorName(color)}
                                onClick={() => setBannerColor(color)}
                            />
                        ))}
                        <input
                            type="color"
                            className="color-input"
                            value={bannerColor || colorFor(user.id)}
                            onChange={(e) => setBannerColor(e.target.value)}
                            aria-label="Autre couleur"
                            title="Autre couleur"
                        />
                    </div>
                </fieldset>

                <div className="settings-actions">
                    <button className="button-primary" onClick={save} disabled={!changed || saving}>
                        {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                </div>
            </div>

            <div className="settings-preview">
                <span className="settings-preview-label" aria-hidden="true">Aperçu</span>
                <div className="profile-card">
                    <div className="profile-card-banner" style={{ background: bannerColor || colorFor(user.id) }} />
                    <div className="profile-card-body">
                        <div className="profile-card-avatar">
                            <Avatar user={{ ...user, displayName: displayName || user.username }} size={80} />
                        </div>
                        <h4>{displayName || user.username}</h4>
                        <p className="profile-card-username">@{user.username}</p>
                        {user.customStatus && <p className="profile-card-custom">{user.customStatus}</p>}
                        {bio && (
                            <section className="profile-card-section">
                                <h5>À propos de moi</h5>
                                <p>{bio}</p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
