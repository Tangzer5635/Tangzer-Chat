package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.ChannelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChannelRepository extends JpaRepository<Channel, Long> {

    List<Channel> findAllByServerIdOrderByPositionAscIdAsc(Long serverId);

    long countByServerId(Long serverId);

    void deleteAllByServerId(Long serverId);

    /** La conversation privée entre deux utilisateurs (user1Id < user2Id). */
    Optional<Channel> findByDmUser1IdAndDmUser2Id(Long user1Id, Long user2Id);

    /** Mes conversations privées, la plus récente d'abord. */
    @Query("""
            select c from Channel c
            join fetch c.dmUser1
            join fetch c.dmUser2
            where c.type = :type and (c.dmUser1.id = :userId or c.dmUser2.id = :userId)
            order by c.lastMessageAt desc nulls last, c.createdAt desc
            """)
    List<Channel> findDirectChannels(@Param("userId") Long userId, @Param("type") ChannelType type);
}
