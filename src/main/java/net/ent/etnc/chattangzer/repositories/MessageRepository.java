package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.dtos.UnreadDto;
import net.ent.etnc.chattangzer.models.entities.Message;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Une page d'historique : les messages plus anciens que {@code before}, du plus récent au plus ancien. */
    @Query("""
            select m from Message m
            join fetch m.author
            left join fetch m.replyTo r
            left join fetch r.author
            where m.channel.id = :channelId and m.id < :before
            order by m.id desc
            """)
    List<Message> findPage(@Param("channelId") Long channelId, @Param("before") Long before, Pageable pageable);

    /**
     * Les réponses à un message supprimé ne pointent plus vers lui.
     * (Requête directe en base : on vide ensuite le cache JPA pour rester cohérent.)
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Message m set m.replyTo = null where m.replyTo.id = :messageId")
    void detachReplies(@Param("messageId") Long messageId);

    /**
     * Nombre de messages non lus par salon (hors mes propres messages),
     * pour tous les salons des serveurs dont je suis membre.
     */
    @Query("""
            select new net.ent.etnc.chattangzer.models.dtos.UnreadDto(c.id, s.id, count(m))
            from Message m
            join m.channel c
            left join c.server s
            where m.author.id <> :userId
              and s.id in (select ms.server.id from Membership ms where ms.user.id = :userId)
              and m.id > coalesce((select r.lastReadMessageId from ChannelRead r
                                   where r.userId = :userId and r.channelId = c.id), 0)
            group by c.id, s.id
            """)
    List<UnreadDto> countUnread(@Param("userId") Long userId);
}
