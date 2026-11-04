package com.travelling.memory.repository;

import com.travelling.memory.domain.Province;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProvinceRepository extends JpaRepository<Province, Integer> {
    Optional<Province> findByCode(String code);
    Optional<Province> findByName(String name);
}

