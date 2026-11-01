package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.Invite;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InviteRepository extends JpaRepository<Invite, String> {

    void deleteAllByServerId(Long serverId);
}
