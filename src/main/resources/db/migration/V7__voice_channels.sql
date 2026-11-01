-- Salons vocaux : le serveur public reçoit un salon « vocal » s'il existe déjà.
INSERT INTO channels (server_id, name, topic, type, position, created_at)
SELECT id, 'vocal', 'Viens discuter de vive voix', 'VOICE', 100, CURRENT_TIMESTAMP
FROM servers
WHERE is_default = TRUE;
