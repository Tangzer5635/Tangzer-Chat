import { colorName, SERVER_COLORS, SERVER_ICONS } from "../../lib/choices";

interface ServerLookPickerProps {
    icon: string | null;
    onIconChange: (icon: string | null) => void;
    color: string;
    onColorChange: (color: string) => void;
}

/** Choix de l'icône (emoji ou initiales) et de la couleur d'un serveur. */
export default function ServerLookPicker({ icon, onIconChange, color, onColorChange }: ServerLookPickerProps) {
    return (
        <>
            <fieldset className="choice-group">
                <legend className="form-label">Icône</legend>
                <div className="emoji-grid">
                    <button
                        type="button"
                        className="emoji-choice"
                        aria-pressed={icon === null}
                        aria-label="Initiales du nom"
                        onClick={() => onIconChange(null)}
                    >
                        Aa
                    </button>
                    {SERVER_ICONS.map((emoji) => (
                        <button
                            type="button"
                            key={emoji}
                            className="emoji-choice"
                            aria-pressed={icon === emoji}
                            onClick={() => onIconChange(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </fieldset>

            <fieldset className="choice-group">
                <legend className="form-label">Couleur</legend>
                <div className="color-grid">
                    {SERVER_COLORS.map((c) => (
                        <button
                            type="button"
                            key={c}
                            className="color-choice"
                            style={{ background: c }}
                            aria-pressed={color === c}
                            aria-label={colorName(c)}
                            title={colorName(c)}
                            onClick={() => onColorChange(c)}
                        />
                    ))}
                </div>
            </fieldset>
        </>
    );
}
