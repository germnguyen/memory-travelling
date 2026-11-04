# Foundation & Core Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thiết lập nền tảng hạ tầng cục bộ (Postgres/PostGIS, Redis, MinIO), kết nối cấu hình Spring Boot JPA/Spatial, nạp dữ liệu chuẩn 63 tỉnh thành Việt Nam, xây dựng tầng Entity lõi và cơ chế ký Pre-signed URL cho media.

**Architecture:** Áp dụng mô hình Hybrid Dev: hạ tầng dịch vụ chạy qua `docker-compose.dev.yml`, Spring Boot (Java 21) chạy trực tiếp trên host kết nối Postgres/PostGIS qua Hibernate Spatial 6. Dịch vụ lưu trữ StorageService sinh Pre-signed PUT/GET URL cục bộ qua HMAC-SHA256 nhằm bảo vệ kỷ niệm riêng tư.

**Tech Stack:** Java 21, Spring Boot 3/4, Spring Data JPA, Hibernate Spatial, PostgreSQL 16 + PostGIS 3.4, Redis 7, MinIO, Docker Compose, JUnit 5, AssertJ, Testcontainers.

**Spec:** `docs/superpowers/specs/2026-11-04-memory-travelling-system-design.md`

## Global Constraints

* Java version floor: 21 (from Backend `pom.xml`).
* Spring Boot: Stateless architecture, exclude no DataSource or JPA configurations once Task 2 completes.
* Spatial coordinates: PostGIS `Point` or `MultiPolygon` with SRID 4326 (WGS 84).
* Media Security: Private bucket by default; GET URLs for private memories must use ephemeral signatures (TTL 15-30m).
* Code conventions: Clean Architecture; interface-driven services; DTOs separate from JPA Entities.

## Review Focus

1. **PostGIS SRID mismatch**: Coordinates stored with undefined SRID (0 instead of 4326), causing spatial functions like `ST_Contains` or `ST_DWithin` to fail.
2. **MinIO Pre-signed URL host binding**: Pre-signed URLs generated with Docker internal hostname (`minio:9000`) instead of external host (`localhost:9000`), breaking frontend direct upload from browser.
3. **Database connection failure on container startup**: Backend attempting to start before Postgres is healthy, throwing premature connection exceptions.
4. **N+1 query problem on Memories and Media**: Fetching memories with media causing multiple SQL queries per record instead of join fetch or batch fetching.
5. **Entity LazyInitializationException**: Accessing lazy collections outside transactional boundary during DTO serialization.

---

### Task 1: Thiết lập Docker Compose cho Môi trường Phát triển (Hybrid Dev)

**Files:**
- Create: `docker-compose.dev.yml`
- Create: `.env.example`
- Create: `.env`
- Test: `scripts/test-infra.ps1` (hoặc bash script kiểm tra healthcheck các port 5432, 6379, 9000)

**Interfaces:**
- Consumes: None
- Produces: 
  - PostgreSQL 16 with PostGIS listening on port `5432` (`postgres:postgis/postgis:16-3.4-alpine`)
  - Redis 7 listening on port `6379` (`redis:7-alpine`)
  - MinIO listening on port `9000` (API) and `9001` (Console) (`minio/minio:latest`)

- [ ] **Step 1: Viết script kiểm tra hạ tầng (test-infra)**

Tạo script `scripts/test-infra.ps1` kiểm tra TCP connection tới các cổng 5432, 6379, 9000.

- [ ] **Step 2: Chạy script kiểm tra để xác nhận các cổng chưa hoạt động (FAIL)**

Run: `powershell -File scripts/test-infra.ps1`
Expected: FAIL (Cannot connect to 5432, 6379, 9000)

- [ ] **Step 3: Viết file `docker-compose.dev.yml` và `.env.example`**

Cấu hình 3 dịch vụ: `postgres` (image `postgis/postgis:16-3.4-alpine`, db `memory_travelling`, user `postgres`, password `postgres`), `redis` (image `redis:7-alpine`), `minio` (image `minio/minio`, default bucket `memory-media`, ports `9000:9000`, `9001:9001`).

- [ ] **Step 4: Khởi động container và chạy lại script kiểm tra (PASS)**

Run: `docker compose -f docker-compose.dev.yml up -d`
Run: `powershell -File scripts/test-infra.ps1`
Expected: PASS (All ports 5432, 6379, 9000 open and healthy)

- [ ] **Step 5: Commit**

```bash
git add docker-compose.dev.yml .env.example scripts/test-infra.ps1
git commit -m "chore: setup hybrid dev infrastructure with docker compose"
```

---

### Task 2: Cấu hình Spring Boot DataSource & Hibernate Spatial

**Files:**
- Modify: `Backend/memory/pom.xml` (thêm `hibernate-spatial`, MinIO SDK `io.minio:minio:8.5.17`)
- Modify: `Backend/memory/src/main/resources/application.yml`
- Modify: `Backend/memory/src/main/java/com/travelling/memory/MemoryApplication.java` (gỡ bỏ exclude `DataSourceAutoConfiguration` và `HibernateJpaAutoConfiguration`)
- Test: `Backend/memory/src/test/java/com/travelling/memory/DatabaseConnectionTest.java`

**Interfaces:**
- Consumes: PostgreSQL on `localhost:5432`
- Produces: Spring `DataSource` bean, `EntityManagerFactory` with spatial support

- [ ] **Step 1: Viết bài test kết nối cơ sở dữ liệu (DatabaseConnectionTest)**

```java
@SpringBootTest
class DatabaseConnectionTest {
    @Autowired
    private DataSource dataSource;

    @Test
    void testConnection() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection.isValid(2)).isTrue();
            try (Statement statement = connection.createStatement()) {
                ResultSet rs = statement.executeQuery("SELECT PostGIS_Version();");
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).contains("3.4");
            }
        }
    }
}
```

- [ ] **Step 2: Chạy test để xác nhận fail vì chưa có config**

Run: `cd Backend/memory; ./mvnw test -Dtest=DatabaseConnectionTest`
Expected: FAIL (No qualifying bean of type DataSource / excluded)

- [ ] **Step 3: Cấu hình dependencies và `application.yml`**

Cập nhật `pom.xml` với `org.hibernate.orm:hibernate-spatial` và MinIO SDK.
Tạo `Backend/memory/src/main/resources/application.yml` trỏ tới `jdbc:postgresql://localhost:5432/memory_travelling`.
Xoá bỏ khối `exclude = { ... }` trong `MemoryApplication.java`.

- [ ] **Step 4: Chạy lại test để xác nhận pass**

Run: `cd Backend/memory; ./mvnw test -Dtest=DatabaseConnectionTest`
Expected: PASS (PostGIS version verified)

- [ ] **Step 5: Commit**

```bash
git add Backend/memory/pom.xml Backend/memory/src/main/resources/application.yml Backend/memory/src/main/java/com/travelling/memory/MemoryApplication.java Backend/memory/src/test/java/com/travelling/memory/DatabaseConnectionTest.java
git commit -m "feat(backend): configure PostgreSQL PostGIS datasource and spatial dialect"
```

---

### Task 3: Master Data: Nạp Danh Mục 63 Tỉnh Thành Việt Nam

**Files:**
- Create: `Backend/memory/src/main/resources/db/migration/V1__init_schema.sql`
- Create: `Backend/memory/src/main/resources/db/migration/V2__seed_provinces.sql`
- Create: `Backend/memory/src/main/java/com/travelling/memory/domain/Province.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/repository/ProvinceRepository.java`
- Test: `Backend/memory/src/test/java/com/travelling/memory/repository/ProvinceRepositoryTest.java`

**Interfaces:**
- Consumes: PostGIS extension enabled
- Produces: 
  - `ProvinceRepository.findByName(String name)`
  - `ProvinceRepository.findByCoordinates(Point point)` (sử dụng native query `ST_Contains` hoặc `ST_DWithin`)

- [ ] **Step 1: Viết failing test cho `ProvinceRepositoryTest`**

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProvinceRepositoryTest {
    @Autowired
    private ProvinceRepository provinceRepository;

    @Test
    void shouldFindProvinceByCodeAndSpatialQuery() {
        assertThat(provinceRepository.count()).isEqualTo(63);
        Optional<Province> hanoi = provinceRepository.findByCode("HA_NOI");
        assertThat(hanoi).isPresent();
    }
}
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd Backend/memory; ./mvnw test -Dtest=ProvinceRepositoryTest`
Expected: FAIL (Compilation error / Table not found)

- [ ] **Step 3: Tạo Entity `Province` và SQL migration nạp 63 tỉnh thành**

Tạo bảng `provinces (id INT PRIMARY KEY, name VARCHAR, code VARCHAR UNIQUE, latitude DOUBLE, longitude DOUBLE)`.
Thêm migration seed đầy đủ 63 tỉnh thành Việt Nam.

- [ ] **Step 4: Chạy lại test xác nhận pass**

Run: `cd Backend/memory; ./mvnw test -Dtest=ProvinceRepositoryTest`
Expected: PASS (63 provinces loaded and verified)

- [ ] **Step 5: Commit**

```bash
git add Backend/memory/src/main/resources/db/migration/ Backend/memory/src/main/java/com/travelling/memory/domain/Province.java Backend/memory/src/main/java/com/travelling/memory/repository/ProvinceRepository.java Backend/memory/src/test/java/com/travelling/memory/repository/ProvinceRepositoryTest.java
git commit -m "feat(backend): create province entity and seed 63 vietnam provinces"
```

---

### Task 4: Xây dựng Tầng Entity Cốt Lõi (`User`, `Location`, `Memory`, `Media`, `Album`)

**Files:**
- Create: `Backend/memory/src/main/java/com/travelling/memory/domain/User.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/domain/Location.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/domain/Memory.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/domain/Media.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/domain/Album.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/domain/Visibility.java` (Enum: `PRIVATE`, `UNLISTED`, `PUBLIC`)
- Create: `Backend/memory/src/main/java/com/travelling/memory/repository/MemoryRepository.java`
- Test: `Backend/memory/src/test/java/com/travelling/memory/repository/MemoryRepositoryTest.java`

**Interfaces:**
- Consumes: `Province` entity, PostGIS geometry types (`org.locationtech.jts.geom.Point`)
- Produces: Full relational persistence layer for travel memories, media attachments, and albums

- [ ] **Step 1: Viết test lưu trữ và truy vấn Memory kèm quan hệ Media**

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MemoryRepositoryTest {
    @Autowired
    private MemoryRepository memoryRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldPersistMemoryWithLocationAndMedia() {
        // Create user, location with Point(105.85, 21.03), memory and media item
        // Assert cascade persist and query by user works
    }
}
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd Backend/memory; ./mvnw test -Dtest=MemoryRepositoryTest`
Expected: FAIL (Classes not implemented)

- [ ] **Step 3: Triển khai các Entity và Repository**

Định nghĩa quan hệ `@OneToMany`, `@ManyToOne`, `@Enumerated(EnumType.STRING)` cho Visibility, trường `Point coordinates` với `@Column(columnDefinition = "geometry(Point,4326)")`.

- [ ] **Step 4: Chạy lại test để xác nhận pass**

Run: `cd Backend/memory; ./mvnw test -Dtest=MemoryRepositoryTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Backend/memory/src/main/java/com/travelling/memory/domain/ Backend/memory/src/main/java/com/travelling/memory/repository/ Backend/memory/src/test/java/com/travelling/memory/repository/MemoryRepositoryTest.java
git commit -m "feat(backend): implement core domain entities and repositories"
```

---

### Task 5: Triển khai Dịch vụ Lưu trữ & Sinh Pre-signed URL (Strict Security)

**Files:**
- Create: `Backend/memory/src/main/java/com/travelling/memory/service/StorageService.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/service/impl/MinioStorageService.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/dto/storage/PresignedUploadRequest.java`
- Create: `Backend/memory/src/main/java/com/travelling/memory/dto/storage/PresignedUploadResponse.java`
- Test: `Backend/memory/src/test/java/com/travelling/memory/service/MinioStorageServiceTest.java`

**Interfaces:**
- Consumes: MinIO on `localhost:9000` via `MinioClient`
- Produces: 
  - `generatePresignedUploadUrl(String bucket, String key, String contentType, Duration ttl)`
  - `generatePresignedDownloadUrl(String bucket, String key, Duration ttl)` (HMAC-SHA256 signature for private memories)

- [ ] **Step 1: Viết failing test kiểm tra sinh Pre-signed Upload & Download URL**

```java
@SpringBootTest
class MinioStorageServiceTest {
    @Autowired
    private StorageService storageService;

    @Test
    void shouldGenerateValidPresignedPutUrl() {
        PresignedUploadResponse res = storageService.createUploadUrl("photos/test-image.webp", "image/webp");
        assertThat(res.uploadUrl()).contains("localhost:9000").contains("X-Amz-Signature");
    }

    @Test
    void shouldGenerateStrictPresignedGetUrlWithExpiry() {
        String downloadUrl = storageService.createDownloadUrl("photos/test-image.webp", Duration.ofMinutes(15));
        assertThat(downloadUrl).contains("X-Amz-Expires=900");
    }
}
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `cd Backend/memory; ./mvnw test -Dtest=MinioStorageServiceTest`
Expected: FAIL (StorageService not found)

- [ ] **Step 3: Triển khai `StorageService` và `MinioStorageService`**

Cấu hình `MinioClient` bean từ `application.yml`. Thực hiện gọi `getPresignedObjectUrl(GetPresignedObjectUrlArgs)` và `getPresignedObjectUrl(PutPresignedObjectUrlArgs)`. Đảm bảo endpoint trả về cho client là `localhost:9000`.

- [ ] **Step 4: Chạy lại test xác nhận pass**

Run: `cd Backend/memory; ./mvnw test -Dtest=MinioStorageServiceTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Backend/memory/src/main/java/com/travelling/memory/service/ Backend/memory/src/main/java/com/travelling/memory/dto/storage/ Backend/memory/src/test/java/com/travelling/memory/service/MinioStorageServiceTest.java
git commit -m "feat(backend): implement MinIO storage service with presigned PUT and ephemeral GET urls"
```

---

### Task 6: Chuẩn Hoá Frontend API Client & Tích Hợp Mô Hình Dữ Liệu

**Files:**
- Modify: `Frontend/src/types.ts`
- Create: `Frontend/src/services/apiClient.ts`
- Create: `Frontend/src/services/memoryService.ts`
- Test: `Frontend/src/services/apiClient.test.ts` (kiểm thử mock Axios/Fetch interceptor)

**Interfaces:**
- Consumes: REST API specs from Backend (`/api/v1/...`)
- Produces: Typed TypeScript API methods for fetching map markers, bounding box queries, and direct media upload

- [ ] **Step 1: Viết test kiểm tra API client interceptor và types**

Tạo test đơn vị kiểm tra việc gắn `Authorization: Bearer <token>` vào request header và bắt lỗi response 401.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd Frontend; npm test` (hoặc vite test / vitest)
Expected: FAIL

- [ ] **Step 3: Cập nhật `Frontend/src/types.ts` và tạo `apiClient.ts`**

Mở rộng `types.ts` khớp với Schema (`Memory`, `Location`, `Province`, `Media`, `Visibility`). Cấu hình `apiClient.ts` trỏ tới `http://localhost:8080/api/v1`.

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `cd Frontend; npm run build` (kiểm tra type checking `tsc -b`)
Expected: PASS (Types match and compile clean)

- [ ] **Step 5: Commit**

```bash
git add Frontend/src/types.ts Frontend/src/services/
git commit -m "feat(frontend): setup API client foundation and synchronize domain types"
```

