-- Photos jointes aux messages.

CREATE TABLE attachments (
    -- UUID aléatoire : sert aussi d'adresse du fichier (impossible à deviner).
    id           VARCHAR(36)  PRIMARY KEY,
    uploader_id  BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- NULL tant que la photo n'a pas encore été envoyée dans un message.
    message_id   BIGINT REFERENCES messages (id) ON DELETE CASCADE,
    file_name    VARCHAR(255) NOT NULL,
    content_type VARCHAR(64)  NOT NULL,
    size_bytes   BIGINT       NOT NULL,
    width        INT,
    height       INT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_attachments_message ON attachments (message_id);
