package com.travelling.memory.repository;

import com.travelling.memory.domain.Location;
import org.locationtech.jts.geom.Geometry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {
    List<Location> findByProvinceId(Integer provinceId);

    @Query("SELECT l FROM Location l WHERE within(l.coordinates, :bbox) = true")
    List<Location> findWithinBoundingBox(@Param("bbox") Geometry bbox);

    @Query(value = "SELECT l.* FROM locations l WHERE ST_Intersects(l.coordinates, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))", nativeQuery = true)
    List<Location> findInBoundingBox(@Param("minLng") double minLng, @Param("minLat") double minLat, @Param("maxLng") double maxLng, @Param("maxLat") double maxLat);

    @Query("SELECT l FROM Location l LEFT JOIN FETCH l.province WHERE l.id IN :ids")
    List<Location> findAllByIdInWithProvince(@Param("ids") java.util.Collection<UUID> ids);
}
