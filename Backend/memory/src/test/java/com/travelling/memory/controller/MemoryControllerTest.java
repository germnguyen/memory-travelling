package com.travelling.memory.controller;

import com.travelling.memory.domain.*;
import com.travelling.memory.repository.LocationRepository;
import com.travelling.memory.repository.MemoryRepository;
import com.travelling.memory.repository.ProvinceRepository;
import com.travelling.memory.repository.UserRepository;
import com.travelling.memory.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MemoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private MemoryRepository memoryRepository;

    @Autowired
    private ProvinceRepository provinceRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    private Province hanoiProvince;
    private Province danangProvince;

    private Memory danangPublicMemory;
    private Memory danangPrivateMemoryUserA;
    private Memory danangPrivateMemoryUserB;
    private Memory unlistedMemoryUserA;

    // Bounding Box for Da Nang area
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

        tokenA = jwtTokenProvider.generateAccessToken(userA);
        tokenB = jwtTokenProvider.generateAccessToken(userB);

        hanoiProvince = provinceRepository.findByCode("HA_NOI").orElseThrow();
        danangProvince = provinceRepository.findByCode("DA_NANG").orElseThrow();

        // Hanoi location
        Point hanoiCoord = geometryFactory.createPoint(new Coordinate(105.8542, 21.0285));
        Location hanoiLoc = locationRepository.save(Location.builder()
                .name("Hồ Gươm")
                .province(hanoiProvince)
                .district("Hoàn Kiếm")
                .commune("Hàng Trống")
                .coordinates(hanoiCoord)
                .build());

        // Da Nang location
        Point danangCoord = geometryFactory.createPoint(new Coordinate(108.2022, 16.0544));
        Location danangLoc = locationRepository.save(Location.builder()
                .name("Cầu Rồng Đà Nẵng")
                .province(danangProvince)
                .district("Hải Châu")
                .commune("Phước Ninh")
                .coordinates(danangCoord)
                .build());

        // Memories
        danangPublicMemory = Memory.builder()
                .user(userA)
                .location(danangLoc)
                .title("Ngắm Cầu Rồng")
                .description("Cầu Rồng phun lửa rất đẹp")
                .visitedAt(LocalDate.of(2026, 7, 15))
                .visibility(Visibility.PUBLIC)
                .build();
        danangPublicMemory.getMediaList().add(Media.builder()
                .memory(danangPublicMemory)
                .mediaType(com.travelling.memory.domain.MediaType.IMAGE)
                .storageKey("memories/danang-bridge.webp")
                .thumbnailKey("memories/thumb-danang-bridge.webp")
                .fileSize(204800L)
                .orderIndex(0)
                .build());
        danangPublicMemory = memoryRepository.save(danangPublicMemory);

        danangPrivateMemoryUserA = Memory.builder()
                .user(userA)
                .location(danangLoc)
                .title("Kỷ niệm riêng tư User A tại Đà Nẵng")
                .visitedAt(LocalDate.of(2026, 7, 16))
                .visibility(Visibility.PRIVATE)
                .build();
        danangPrivateMemoryUserA = memoryRepository.save(danangPrivateMemoryUserA);

        danangPrivateMemoryUserB = Memory.builder()
                .user(userB)
                .location(danangLoc)
                .title("Bí mật của User B")
                .visitedAt(LocalDate.of(2026, 8, 20))
                .visibility(Visibility.PRIVATE)
                .build();
        danangPrivateMemoryUserB = memoryRepository.save(danangPrivateMemoryUserB);

        unlistedMemoryUserA = Memory.builder()
                .user(userA)
                .location(hanoiLoc)
                .title("Kỷ niệm Unlisted User A")
                .visitedAt(LocalDate.of(2026, 8, 25))
                .visibility(Visibility.UNLISTED)
                .shareToken("unlistedSecretToken123")
                .build();
        unlistedMemoryUserA.getMediaList().add(Media.builder()
                .memory(unlistedMemoryUserA)
                .mediaType(com.travelling.memory.domain.MediaType.IMAGE)
                .storageKey("memories/unlisted-photo.webp")
                .fileSize(102400L)
                .orderIndex(0)
                .build());
        unlistedMemoryUserA = memoryRepository.save(unlistedMemoryUserA);
    }

    @Test
    @DisplayName("POST /api/v1/memories should create new memory with coordinates and media when authenticated")
    void shouldCreateMemorySuccessfullyWhenAuthenticated() throws Exception {
        String json = """
                {
                    "title": "Chuyến đi Hồ Hoàn Kiếm",
                    "description": "Mùa thu Hà Nội se lạnh",
                    "visitedAt": "2026-10-10",
                    "visibility": "PUBLIC",
                    "locationName": "Hồ Hoàn Kiếm",
                    "latitude": 21.0285,
                    "longitude": 105.8542,
                    "provinceId": %d,
                    "district": "Hoàn Kiếm",
                    "commune": "Hàng Trống",
                    "mediaList": [
                        {
                            "storageKey": "memories/hanoi-fall.webp",
                            "thumbnailKey": "memories/thumb-hanoi-fall.webp",
                            "mediaType": "IMAGE",
                            "fileSize": 512000,
                            "orderIndex": 0
                        }
                    ]
                }
                """.formatted(hanoiProvince.getId());

        mockMvc.perform(post("/api/v1/memories")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Chuyến đi Hồ Hoàn Kiếm")))
                .andExpect(jsonPath("$.userId", is(userA.getId().toString())))
                .andExpect(jsonPath("$.location.name", is("Hồ Hoàn Kiếm")))
                .andExpect(jsonPath("$.location.latitude", is(21.0285)))
                .andExpect(jsonPath("$.location.longitude", is(105.8542)))
                .andExpect(jsonPath("$.location.provinceName", is("Hà Nội")))
                .andExpect(jsonPath("$.mediaList", hasSize(1)))
                .andExpect(jsonPath("$.mediaList[0].storageKey", is("memories/hanoi-fall.webp")))
                .andExpect(jsonPath("$.mediaList[0].downloadUrl", containsString("localhost:9000")));
    }

    @Test
    @DisplayName("POST /api/v1/memories should generate shareToken when visibility is UNLISTED")
    void shouldGenerateShareTokenForUnlistedMemory() throws Exception {
        String json = """
                {
                    "title": "Kỷ niệm riêng tư chia sẻ qua link",
                    "visitedAt": "2026-11-01",
                    "visibility": "UNLISTED",
                    "locationName": "Hồ Tây",
                    "latitude": 21.0533,
                    "longitude": 105.8236
                }
                """;

        mockMvc.perform(post("/api/v1/memories")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.visibility", is("UNLISTED")))
                .andExpect(jsonPath("$.shareToken", notNullValue()))
                .andExpect(jsonPath("$.shareToken", not(emptyOrNullString())));
    }

    @Test
    @DisplayName("POST /api/v1/memories should return 401 Unauthorized when no authentication token is provided")
    void shouldReturnUnauthorizedWhenCreatingMemoryWithoutAuth() throws Exception {
        String json = """
                {
                    "title": "Memory Without Auth",
                    "visitedAt": "2026-10-10",
                    "locationName": "Somewhere",
                    "latitude": 21.0,
                    "longitude": 105.0
                }
                """;

        mockMvc.perform(post("/api/v1/memories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/memories should return 400 Bad Request when validation fails")
    void shouldReturnBadRequestWhenInputIsInvalid() throws Exception {
        String json = """
                {
                    "title": "",
                    "locationName": ""
                }
                """;

        mockMvc.perform(post("/api/v1/memories")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/memories/map should return only PUBLIC memories in bounding box for unauthenticated guest")
    void shouldReturnOnlyPublicMemoriesInBoundingBoxForGuest() throws Exception {
        mockMvc.perform(get("/api/v1/memories/map")
                        .param("minLng", String.valueOf(CENTRAL_MIN_LNG))
                        .param("minLat", String.valueOf(CENTRAL_MIN_LAT))
                        .param("maxLng", String.valueOf(CENTRAL_MAX_LNG))
                        .param("maxLat", String.valueOf(CENTRAL_MAX_LAT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].memoryId", is(danangPublicMemory.getId().toString())))
                .andExpect(jsonPath("$[0].title", is("Ngắm Cầu Rồng")))
                .andExpect(jsonPath("$[0].coverThumbnailUrl", containsString("localhost:9000")));
    }

    @Test
    @DisplayName("GET /api/v1/memories/map should return PUBLIC memories and User A's private memories for User A")
    void shouldReturnPublicAndOwnPrivateMemoriesForAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/v1/memories/map")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("minLng", String.valueOf(CENTRAL_MIN_LNG))
                        .param("minLat", String.valueOf(CENTRAL_MIN_LAT))
                        .param("maxLng", String.valueOf(CENTRAL_MAX_LNG))
                        .param("maxLat", String.valueOf(CENTRAL_MAX_LAT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].memoryId", containsInAnyOrder(
                        danangPublicMemory.getId().toString(),
                        danangPrivateMemoryUserA.getId().toString()
                )))
                .andExpect(jsonPath("$[*].memoryId", not(hasItem(danangPrivateMemoryUserB.getId().toString()))));
    }

    @Test
    @DisplayName("GET /api/v1/memories/{id} should allow unauthenticated guest to view PUBLIC memory")
    void shouldAllowGuestToViewPublicMemory() throws Exception {
        mockMvc.perform(get("/api/v1/memories/{id}", danangPublicMemory.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(danangPublicMemory.getId().toString())))
                .andExpect(jsonPath("$.title", is("Ngắm Cầu Rồng")))
                .andExpect(jsonPath("$.visibility", is("PUBLIC")))
                .andExpect(jsonPath("$.mediaList", hasSize(1)))
                .andExpect(jsonPath("$.mediaList[0].downloadUrl", containsString("localhost:9000")));
    }

    @Test
    @DisplayName("GET /api/v1/memories/{id} should allow owner to view PRIVATE memory")
    void shouldAllowOwnerToViewPrivateMemory() throws Exception {
        mockMvc.perform(get("/api/v1/memories/{id}", danangPrivateMemoryUserA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(danangPrivateMemoryUserA.getId().toString())))
                .andExpect(jsonPath("$.title", is("Kỷ niệm riêng tư User A tại Đà Nẵng")));
    }

    @Test
    @DisplayName("GET /api/v1/memories/{id} should deny guest from viewing PRIVATE memory with 403 Forbidden")
    void shouldDenyGuestFromViewingPrivateMemory() throws Exception {
        mockMvc.perform(get("/api/v1/memories/{id}", danangPrivateMemoryUserA.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/memories/{id} should deny another user from viewing PRIVATE memory with 403 Forbidden")
    void shouldDenyOtherUserFromViewingPrivateMemory() throws Exception {
        mockMvc.perform(get("/api/v1/memories/{id}", danangPrivateMemoryUserA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/memories/{id} should allow viewing UNLISTED memory when valid shareToken is provided")
    void shouldAllowViewingUnlistedMemoryWithValidShareToken() throws Exception {
        mockMvc.perform(get("/api/v1/memories/{id}", unlistedMemoryUserA.getId())
                        .param("shareToken", "unlistedSecretToken123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(unlistedMemoryUserA.getId().toString())))
                .andExpect(jsonPath("$.title", is("Kỷ niệm Unlisted User A")));
    }

    @Test
    @DisplayName("GET /api/v1/memories/{id} should deny viewing UNLISTED memory when invalid shareToken is provided")
    void shouldDenyViewingUnlistedMemoryWithInvalidShareToken() throws Exception {
        mockMvc.perform(get("/api/v1/memories/{id}", unlistedMemoryUserA.getId())
                        .param("shareToken", "wrongSecretToken"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/memories/{id} should return 404 Not Found when memory does not exist")
    void shouldReturnNotFoundForNonExistentMemory() throws Exception {
        mockMvc.perform(get("/api/v1/memories/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }
}
