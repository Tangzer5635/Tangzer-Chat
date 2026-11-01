-- Messages privés : un salon sans serveur, réservé à deux utilisateurs.

ALTER TABLE channels ALTER COLUMN server_id DROP NOT NULL;

ALTER TABLE channels ADD COLUMN dm_user1_id BIGINT REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE channels ADD COLUMN dm_user2_id BIGINT REFERENCES users (id) ON DELETE CASCADE;

-- Date du dernier message, pour trier les conversations.
ALTER TABLE channels ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;

-- Une seule conversation par paire (dm_user1_id < dm_user2_id).
CREATE UNIQUE INDEX uk_channels_dm_pair ON channels (dm_user1_id, dm_user2_id);
CREATE INDEX idx_channels_dm_user2 ON channels (dm_user2_id);
