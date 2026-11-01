package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    List<MessageReaction> findAllByMessageIdInOrderByCreatedAtAscIdAsc(Collection<Long> messageIds);

    Optional<MessageReaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);

    boolean existsByMessageIdAndEmoji(Long messageId, String emoji);

    @Query("select count(distinct r.emoji) from MessageReaction r where r.message.id = :messageId")
    long countDistinctEmojis(@Param("messageId") Long messageId);

    void deleteAllByMessageId(Long messageId);
}
