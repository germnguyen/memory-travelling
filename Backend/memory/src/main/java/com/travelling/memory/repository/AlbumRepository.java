package com.travelling.memory.repository;

import com.travelling.memory.domain.Album;
import com.travelling.memory.domain.Visibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlbumRepository extends JpaRepository<Album, UUID> {
    List<Album> findByUserId(UUID userId);
    List<Album> findByVisibility(Visibility visibility);
}

