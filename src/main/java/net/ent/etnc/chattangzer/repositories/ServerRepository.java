package net.ent.etnc.chattangzer.repositories;

import net.ent.etnc.chattangzer.models.entities.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServerRepository extends JpaRepository<Server, Long> {

    Optional<Server> findFirstByDefaultServerTrue();

    /** Serveurs publics dont le nom ou la description contient le texte recherché. */
    @Query("""
            select s from Server s
            where s.publicServer = true
              and (:query = '' or lower(s.name) like concat('%', :query, '%')
                   or lower(coalesce(s.description, '')) like concat('%', :query, '%'))
            order by s.defaultServer desc, s.createdAt asc
            """)
    List<Server> searchPublic(@Param("query") String query);
}
