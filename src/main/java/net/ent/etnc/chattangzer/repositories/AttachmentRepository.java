package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, String> {

    List<Attachment> findAllByMessageIdInOrderByCreatedAtAsc(Collection<Long> messageIds);

    List<Attachment> findAllByMessageId(Long messageId);

    /** Images envoyées mais utilisées nulle part (ni message, ni photo de profil, ni icône de serveur). */
    @Query("""
            select a from Attachment a
            where a.messageId is null and a.createdAt < :before
              and a.id not in (select u.avatarId from User u where u.avatarId is not null)
              and a.id not in (select s.iconImageId from Server s where s.iconImageId is not null)
            """)
    List<Attachment> findUnused(@Param("before") Instant before);
}
