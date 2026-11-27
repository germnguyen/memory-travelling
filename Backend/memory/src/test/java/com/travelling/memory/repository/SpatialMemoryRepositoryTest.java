package com.travelling.memory.repository;

import com.travelling.memory.domain.Location;
import com.travelling.memory.domain.Memory;
import com.travelling.memory.domain.Province;
import com.travelling.memory.domain.User;
import com.travelling.memory.domain.Visibility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class SpatialMemoryRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private MemoryRepository memoryRepository;

    @Autowired
    private ProvinceRepository provinceRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private User userA;
    private User userB;

    private Location hanoiLoc;
    private Location danangLoc;
    private Location hcmcLoc;

    private Memory hanoiMemory;
    private Memory danangPublicMemory;
    private Memory danangPrivateMemoryUserA;
    private Memory danangPrivateMemoryUserB;
    private Memory hcmcMemory;

    // Bounding Box for Central Vietnam (around Da Nang: lng 108.20, lat 16.05)
    // Box bounds: minLng=107.0, minLat=15.0, maxLng=109.5, maxLat=17.5
    private static final double CENTRAL_MIN_LNG = 107.0;
    private static final double CENTRAL_MIN_LAT = 15.0;
    private static final double CENTRAL_MAX_LNG = 109.5;
    private static final double CENTRAL_MAX_LAT = 17.5;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(User.builder()
                .email("user_a_" + UUID.randomUUID() + "@example.com")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("User Alpha")
                .role("ROLE_USER")
                .build());

        userB = userRepository.save(User.builder()
                .email("user_b_" + UUID.randomUUID() + "@example.com")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("User Beta")
                .role("ROLE_USER")
                .build());

        Province hanoiProvince = provinceRepository.findByCode("HA_NOI").orElseThrow();
        Province danangProvince = provinceRepository.findByCode("DA_NANG").orElseThrow();
        Province hcmcProvince = provinceRepository.findByCode("HO_CHI_MINH").orElseThrow();

        // Hanoi: (105.8542, 21.0285)
        Point hanoiCoord = geometryFactory.createPoint(new Coordinate(105.8542, 21.0285));
        hanoiLoc = locationRepository.save(Location.builder()
                .name("Hồ Hoàn Kiếm")
                .province(hanoiProvince)
                .district("Hoàn Kiếm")
                .commune("Hàng Trống")
                .coordinates(hanoiCoord)
                .build());

        // Da Nang: (108.2022, 16.0544)
        Point danangCoord = geometryFactory.createPoint(new Coordinate(108.2022, 16.0544));
        danangLoc = locationRepository.save(Location.builder()
                .name("Cầu Rồng Đà Nẵng")
                .province(danangProvince)
                .district("Hải Châu")
                .commune("Phước Ninh")
                .coordinates(danangCoord)
                .build());

        // HCMC: (106.6297, 10.8231)
        Point hcmcCoord = geometryFactory.createPoint(new Coordinate(106.6297, 10.8231));
        hcmcLoc = locationRepository.save(Location.builder()
                .name("Chợ Bến Thành")
                .province(hcmcProvince)
                .district("Quận 1")
                .commune("Bến Thành")
                .coordinates(hcmcCoord)
                .build());

        // Memories
        hanoiMemory = memoryRepository.save(Memory.builder()
                .user(userA)
                .location(hanoiLoc)
                .title("Kỷ niệm mùa thu Hà Nội")
                .visitedAt(LocalDate.of(2026, 10, 10))
                .visibility(Visibility.PUBLIC)
                .build());

        danangPublicMemory = memoryRepository.save(Memory.builder()
                .user(userA)
                .location(danangLoc)
                .title("Ngắm Cầu Rồng phun lửa")
                .visitedAt(LocalDate.of(2026, 7, 15))
                .visibility(Visibility.PUBLIC)
                .build());

        danangPrivateMemoryUserA = memoryRepository.save(Memory.builder()
                .user(userA)
                .location(danangLoc)
                .title("Nhật ký riêng tư Đà Nẵng - User A")
                .visitedAt(LocalDate.of(2026, 7, 16))
                .visibility(Visibility.PRIVATE)
                .build());

        danangPrivateMemoryUserB = memoryRepository.save(Memory.builder()
                .user(userB)
                .location(danangLoc)
                .title("Bí mật Sơn Trà - User B")
                .visitedAt(LocalDate.of(2026, 8, 20))
                .visibility(Visibility.PRIVATE)
                .build());

        hcmcMemory = memoryRepository.save(Memory.builder()
                .user(userB)
                .location(hcmcLoc)
                .title("Check-in Sài Gòn sôi động")
                .visitedAt(LocalDate.of(2026, 9, 5))
                .visibility(Visibility.PUBLIC)
                .build());
    }

    @Test
    @DisplayName("Should find only locations inside Central Vietnam bounding box (Da Nang) and exclude Hanoi and HCMC")
    void testFindLocationsInBoundingBox() {
        List<Location> results = locationRepository.findInBoundingBox(
                CENTRAL_MIN_LNG, CENTRAL_MIN_LAT, CENTRAL_MAX_LNG, CENTRAL_MAX_LAT
        );

        assertThat(results)
                .extracting(Location::getId)
                .contains(danangLoc.getId())
                .doesNotContain(hanoiLoc.getId(), hcmcLoc.getId());
    }

    @Test
    @DisplayName("Should find all memories inside Central Vietnam bounding box regardless of visibility")
    void testFindMemoriesInBoundingBox() {
        List<Memory> results = memoryRepository.findMemoriesInBoundingBox(
                CENTRAL_MIN_LNG, CENTRAL_MIN_LAT, CENTRAL_MAX_LNG, CENTRAL_MAX_LAT
        );

        assertThat(results)
                .extracting(Memory::getId)
                .contains(danangPublicMemory.getId(), danangPrivateMemoryUserA.getId(), danangPrivateMemoryUserB.getId())
                .doesNotContain(hanoiMemory.getId(), hcmcMemory.getId());
    }

    @Test
    @DisplayName("Should find only PUBLIC memories in Central Vietnam bounding box")
    void testFindPublicMemoriesInBoundingBox() {
        List<Memory> results = memoryRepository.findPublicMemoriesInBoundingBox(
                CENTRAL_MIN_LNG, CENTRAL_MIN_LAT, CENTRAL_MAX_LNG, CENTRAL_MAX_LAT
        );

        assertThat(results)
                .extracting(Memory::getId)
                .contains(danangPublicMemory.getId())
                .doesNotContain(danangPrivateMemoryUserA.getId(), danangPrivateMemoryUserB.getId(), hanoiMemory.getId(), hcmcMemory.getId());
    }

    @Test
    @DisplayName("Should find PUBLIC memories and private memories owned by specified user inside bounding box")
    void testFindMemoriesInBoundingBoxForUser() {
        // Query for User A: should see danangPublicMemory and danangPrivateMemoryUserA, but NOT danangPrivateMemoryUserB
        List<Memory> resultsUserA = memoryRepository.findMemoriesInBoundingBoxForUser(
                CENTRAL_MIN_LNG, CENTRAL_MIN_LAT, CENTRAL_MAX_LNG, CENTRAL_MAX_LAT, userA.getId()
        );

        assertThat(resultsUserA)
                .extracting(Memory::getId)
                .contains(danangPublicMemory.getId(), danangPrivateMemoryUserA.getId())
                .doesNotContain(danangPrivateMemoryUserB.getId(), hanoiMemory.getId(), hcmcMemory.getId());

        // Query for User B: should see danangPublicMemory and danangPrivateMemoryUserB, but NOT danangPrivateMemoryUserA
        List<Memory> resultsUserB = memoryRepository.findMemoriesInBoundingBoxForUser(
                CENTRAL_MIN_LNG, CENTRAL_MIN_LAT, CENTRAL_MAX_LNG, CENTRAL_MAX_LAT, userB.getId()
        );

        assertThat(resultsUserB)
                .extracting(Memory::getId)
                .contains(danangPublicMemory.getId(), danangPrivateMemoryUserB.getId())
                .doesNotContain(danangPrivateMemoryUserA.getId(), hanoiMemory.getId(), hcmcMemory.getId());
    }
}
