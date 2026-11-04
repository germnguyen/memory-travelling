package com.travelling.memory.repository;

import com.travelling.memory.domain.Memory;
import com.travelling.memory.domain.Visibility;
import org.locationtech.jts.geom.Geometry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemoryRepository extends JpaRepository<Memory, UUID> {
    List<Memory> findByUserId(UUID userId);
    List<Memory> findByVisibility(Visibility visibility);
    List<Memory> findByLocationId(UUID locationId);
    Optional<Memory> findByShareToken(String shareToken);

    @Query("SELECT m FROM Memory m JOIN FETCH m.location l WHERE within(l.coordinates, :bbox) = true AND m.visibility = :visibility")
    List<Memory> findWithinBoundingBoxAndVisibility(@Param("bbox") Geometry bbox, @Param("visibility") Visibility visibility);
}

