-- Statut choisi par l'utilisateur et statut personnalisé (« 🎮 En train de jouer »).
ALTER TABLE users ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'ONLINE';
ALTER TABLE users ADD COLUMN custom_status VARCHAR(80);
