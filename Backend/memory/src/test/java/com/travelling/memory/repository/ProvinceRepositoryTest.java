package com.travelling.memory.repository;

import com.travelling.memory.domain.Province;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ProvinceRepositoryTest {

    @Autowired
    private ProvinceRepository provinceRepository;

    @Test
    void shouldFindProvinceByCodeAndHaveAllProvinces() {
        assertThat(provinceRepository.count()).isEqualTo(63);
        Optional<Province> hanoi = provinceRepository.findByCode("HA_NOI");
        assertThat(hanoi).isPresent();
        assertThat(hanoi.get().getName()).isEqualTo("Hà Nội");
        assertThat(hanoi.get().getRegion()).isEqualTo("Bắc");
    }
}

