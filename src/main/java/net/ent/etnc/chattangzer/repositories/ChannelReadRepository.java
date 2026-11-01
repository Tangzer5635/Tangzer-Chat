package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.ChannelRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChannelReadRepository extends JpaRepository<ChannelRead, Long> {

    Optional<ChannelRead> findByUserIdAndChannelId(Long userId, Long channelId);
}
