-- Refonte « Préau » : trois thèmes (clair, sombre, selon l'appareil)
-- et plus de couleur d'accent libre (elle cassait les contrastes).

-- Les anciens thèmes clairs deviennent « clair », les sombres « sombre ».
-- L'ancien thème par défaut (tangzer) passe à « selon l'appareil ».
UPDATE users SET theme = CASE
    WHEN theme IN ('clair', 'sakura') THEN 'light'
    WHEN theme IN ('minuit', 'neon', 'foret') THEN 'dark'
    ELSE 'system'
END;

ALTER TABLE users ALTER COLUMN theme SET DEFAULT 'system';

ALTER TABLE users DROP COLUMN accent_color;
