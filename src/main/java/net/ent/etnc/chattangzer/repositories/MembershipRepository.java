package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {

    Optional<Membership> findByServerIdAndUserId(Long serverId, Long userId);

    boolean existsByServerIdAndUserId(Long serverId, Long userId);

    long countByServerId(Long serverId);

    @Query("select m from Membership m join fetch m.server where m.user.id = :userId order by m.joinedAt asc")
    List<Membership> findAllWithServerByUserId(@Param("userId") Long userId);

    @Query("select m from Membership m join fetch m.user where m.server.id = :serverId order by m.user.displayName asc")
    List<Membership> findAllWithUserByServerId(@Param("serverId") Long serverId);

    void deleteAllByServerId(Long serverId);
}
