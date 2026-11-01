-- Profil et préférences d'apparence.
ALTER TABLE users ADD COLUMN avatar_id VARCHAR(36) REFERENCES attachments (id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN banner_color VARCHAR(7);
ALTER TABLE users ADD COLUMN bio VARCHAR(190);
ALTER TABLE users ADD COLUMN theme VARCHAR(16) NOT NULL DEFAULT 'tangzer';
ALTER TABLE users ADD COLUMN accent_color VARCHAR(7);
ALTER TABLE users ADD COLUMN font_size INT NOT NULL DEFAULT 16;
ALTER TABLE users ADD COLUMN compact BOOLEAN NOT NULL DEFAULT FALSE;

-- Image d'icône d'un serveur (à la place de l'emoji).
ALTER TABLE servers ADD COLUMN icon_image_id VARCHAR(36) REFERENCES attachments (id) ON DELETE SET NULL;
