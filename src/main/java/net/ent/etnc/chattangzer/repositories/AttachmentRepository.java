package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, String> {

    List<Attachment> findAllByMessageIdInOrderByCreatedAtAsc(Collection<Long> messageIds);

    List<Attachment> findAllByMessageId(Long messageId);

    /** Photos envoyées mais jamais postées dans un message. */
    List<Attachment> findAllByMessageIdIsNullAndCreatedAtBefore(Instant before);
}
