package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.Channel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChannelRepository extends JpaRepository<Channel, Long> {

    List<Channel> findAllByServerIdOrderByPositionAscIdAsc(Long serverId);

    long countByServerId(Long serverId);

    void deleteAllByServerId(Long serverId);
}
