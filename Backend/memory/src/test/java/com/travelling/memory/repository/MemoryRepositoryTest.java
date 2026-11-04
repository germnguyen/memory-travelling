package com.travelling.memory.repository;

import com.travelling.memory.domain.*;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class MemoryRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private MemoryRepository memoryRepository;

    @Autowired
    private ProvinceRepository provinceRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Test
    void shouldPersistAndRetrieveMemoryWithLocationAndMedia() {
        // 1. Create and save User
        User user = User.builder()
            .email("traveler@example.com")
            .passwordHash("$2a$10$hashedpassword")
            .fullName("Nguyen Van Du Lich")
            .role("ROLE_USER")
            .build();
        user = userRepository.save(user);
        assertThat(user.getId()).isNotNull();

        // 2. Fetch Province and create Location
        Province sonLa = provinceRepository.findByCode("SON_LA").orElseThrow();
        Point taxuaCoordinates = geometryFactory.createPoint(new Coordinate(103.9144, 21.3283));

        Location location = Location.builder()
            .name("Tà Xùa")
            .province(sonLa)
            .district("Bắc Yên")
            .commune("Tà Xùa")
            .coordinates(taxuaCoordinates)
            .build();
        location = locationRepository.save(location);
        assertThat(location.getId()).isNotNull();

        // 3. Create Memory with Media
        Memory memory = Memory.builder()
            .user(user)
            .location(location)
            .title("Săn mây Tà Xùa mùa đông")
            .description("Biển mây trắng bồng bềnh tuyệt đẹp ở đỉnh Gió.")
            .visitedAt(LocalDate.of(2026, 11, 4))
            .visibility(Visibility.PRIVATE)
            .build();

        Media photo1 = Media.builder()
            .mediaType(MediaType.IMAGE)
            .storageKey("memories/taxua/photo1.webp")
            .thumbnailKey("memories/taxua/photo1_thumb.webp")
            .fileSize(204800L)
            .width(1920)
            .height(1080)
            .orderIndex(0)
            .memory(memory)
            .build();

        memory.setMediaList(List.of(photo1));
        Memory savedMemory = memoryRepository.save(memory);
        assertThat(savedMemory.getId()).isNotNull();

        // 4. Query back
        List<Memory> userMemories = memoryRepository.findByUserId(user.getId());
        assertThat(userMemories).hasSize(1);
        Memory retrieved = userMemories.get(0);
        assertThat(retrieved.getTitle()).isEqualTo("Săn mây Tà Xùa mùa đông");
        assertThat(retrieved.getLocation().getName()).isEqualTo("Tà Xùa");
        assertThat(retrieved.getMediaList()).hasSize(1);
        assertThat(retrieved.getMediaList().get(0).getStorageKey()).isEqualTo("memories/taxua/photo1.webp");
    }
}

