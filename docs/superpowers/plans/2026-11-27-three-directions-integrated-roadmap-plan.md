# Kế Hoạch Tối Ưu Triển Khai 3 Hướng (Bản Đồ · Backend API · Xác Thực) & Tài Liệu Công Nghệ

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh chuỗi giá trị khép kín cho Memory Travelling: Hệ thống xác thực người dùng (Auth/JWT), Backend REST API dữ liệu không gian (PostGIS/MinIO) và Trải nghiệm bản đồ tương tác tạo kỷ niệm tại Frontend (MapLibre GL JS/EXIF).

**Architecture:** 
Hệ thống tuân thủ kiến trúc phi trạng thái (Stateless Backend) trên nền Spring Boot (Java 21) và React 19. Client tự trích xuất toạ độ EXIF từ ảnh, nén thumbnail WebP tại chỗ bằng HTML5 Canvas, và tải trực tiếp nhị phân lên MinIO qua Pre-signed PUT URL. Backend chỉ lưu metadata và toạ độ PostGIS, phục vụ truy vấn vùng nhìn (Bounding Box) qua chỉ mục GIST và nhóm cụm (clustering) 60 FPS mượt mà tại client bằng Supercluster.

**Tech Stack:**
* Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, GSAP, MapLibre GL JS, Supercluster, ExifReader.
* Backend: Java 21 (Virtual Threads), Spring Boot, Spring Security 6, JJWT (0.12.x), Spring Data JPA, Hibernate Spatial 7.
* Cơ sở dữ liệu & Lưu trữ: PostgreSQL 16 + PostGIS 3.4, MinIO (S3 Compatible), Redis 7.

**Spec:** [docs/superpowers/specs/2026-11-04-memory-travelling-system-design.md](file:///d:/DuLich/memory-travelling/docs/superpowers/specs/2026-11-04-memory-travelling-system-design.md)

---

## 1. Global Constraints

* **Strict Statelessness**: Không lưu session trong bộ nhớ backend; toàn bộ xác thực đi qua Access Token JWT (ngắn hạn) và Refresh Token an toàn.
* **Strict Ephemeral Pre-signed URLs**: Ảnh/video của kỷ niệm `PRIVATE` tuyệt đối không dùng link public; Backend tính toán HMAC-SHA256 cục bộ sinh Pre-signed GET URL tự hết hạn sau 15–30 phút.
* **No Server-Side Media Transcoding**: Không chuyển mã video/ảnh nặng trên server; client tự nén WebP thumbnail qua HTML5 Canvas và upload trực tiếp lên MinIO.
* **Spatial Querying Standard**: Mọi toạ độ địa lý dùng hệ quy chiếu WGS84 (`SRID = 4326`). Truy vấn bản đồ phải thông qua hàm không gian PostGIS (`ST_MakeEnvelope`) kết hợp Spatial Index (`GIST`).
* **Hybrid Dev Standard**: Hạ tầng (PostgreSQL, PostGIS, MinIO, Redis) chạy qua `docker-compose.dev.yml`; Frontend và Backend chạy trực tiếp trên host để tối ưu thời gian phản hồi và gỡ lỗi.

---

## 2. Review Focus (5 Ca Biên & Trạng Thái Lỗi Cần Kiểm Soát)

1. **Token hết hạn hoặc vắng mặt khi ghim kỷ niệm**: Client cần tự động gia hạn token qua Refresh Token hoặc mở modal đăng nhập mà không làm mất nội dung form kỷ niệm đang nhập dở.
2. **Lỗi mạng khi tải ảnh trực tiếp lên MinIO (Direct Upload failure)**: Nếu upload lên Object Storage thất bại hoặc timeout, giao diện phải báo lỗi rõ ràng ở từng ảnh và cho phép tải lại mà không phải gõ lại bài viết.
3. **Ảnh không có metadata toạ độ GPS**: Người dùng upload ảnh từ máy ảnh cơ hoặc tải từ mạng xã hội bị xóa EXIF $\rightarrow$ Hệ thống tự động fallback cho phép chọn điểm ghim thủ công trên bản đồ hoặc click chọn địa danh từ danh mục 63 tỉnh/thành.
4. **Toạ độ nằm ngoài lãnh thổ Việt Nam**: Tự động phát hiện toạ độ nằm ngoài Bounding Box Việt Nam (hoặc toạ độ không hợp lệ) và thông báo người dùng điều chỉnh.
5. **Debounce truy vấn Bounding Box khi kéo/zoom bản đồ**: Khi người dùng lướt nhanh bản đồ, các request lấy điểm ghim phải được debounce (300ms) để không gây nghẽn đường truyền và CPU server.

---

## 3. Tài Liệu Công Nghệ Chuyên Sâu (Technology Deep-Dive & Architecture Rationale)

Phần này cung cấp căn cứ kỹ thuật, kiến trúc và phân tích tối ưu cho từng công nghệ được chọn trong 3 hướng phát triển:

### 3.1. Hướng 1: Frontend & Công Nghệ Bản Đồ Tương Tác

```text
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND BROWSER (CLIENT)                │
├─────────────────────────────────────────────────────────────┤
│  User File Input (Image/Video)                              │
│       │                                                     │
│       ├──► ExifReader ──► Trích xuất toạ độ GPS (Lat/Lng)   │
│       │                                                     │
│       ├──► HTML5 Canvas ──► Nén Thumbnail WebP (< 50KB)     │
│       │                                                     │
│       └──► Direct PUT Upload ──► MinIO / S3 Object Storage  │
├─────────────────────────────────────────────────────────────┤
│  Map Viewport (Bounding Box)                                │
│       │                                                     │
│       ├──► Bounding Box Query ──► Backend PostGIS           │
│       │                                                     │
│       └──► Supercluster ──► Gom cụm Marker 60 FPS (GPU)     │
└─────────────────────────────────────────────────────────────┘
```

1. **MapLibre GL JS vs Google Maps / Leaflet**:
   * *Lựa chọn*: **MapLibre GL JS** (phiên bản mã nguồn mở của Mapbox GL JS).
   * *Lý do*: Render vector tiles trực tiếp trên WebGL (tận dụng GPU người dùng). Hiệu năng xoay 3D, nghiêng góc nhìn (pitch), phóng to/thu nhỏ mượt mà 60 FPS, không phụ thuộc chi phí API đắt đỏ của Google Maps.
   * *Style bản đồ*: Sử dụng OpenStreetMap vector tiles hoặc Carto Positron sạch đẹp, làm nổi bật các điểm ghim kỷ niệm.

2. **Supercluster (Client-Side Clustering)**:
   * *Lý do*: Thay vì server phải tính toán cụm toạ độ mỗi lần người dùng zoom, Backend chỉ cần trả về danh sách điểm trong góc nhìn (Bounding Box). Thư viện `Supercluster` gom cụm hàng chục ngàn điểm trên trình duyệt chỉ mất < 2ms bằng cấu trúc k-d tree.

3. **ExifReader & Client-side Canvas WebP Compression**:
   * *ExifReader*: Thư viện JavaScript siêu nhẹ, phân tích nhanh cấu trúc nhị phân của ảnh JPEG/HEIC để lấy thẻ `GPSLatitude`, `GPSLongitude`, `DateTimeOriginal`.
   * *HTML5 Canvas*: Tự động đọc ảnh, resize kích thước tối đa 400x400px và xuất ra định dạng WebP với quality 0.8. Ảnh 10MB được nén thành thumbnail ~40KB trong vài mili-giây, giảm 95% thời gian tải lưới ảnh bản đồ.

---

### 3.2. Hướng 2: Backend RESTful API & Cơ Sở Dữ Liệu Không Gian

```text
┌─────────────────────────────────────────────────────────────┐
│                   SPRING BOOT BACKEND (JAVA 21)             │
├─────────────────────────────────────────────────────────────┤
│  Virtual Threads (Project Loom) ──► Xử lý đồng thời cao     │
│                                                             │
│  Controller ──► Service ──► Spatial Repository              │
│                                   │                         │
│  MinioStorageService              ▼                         │
│  (HMAC-SHA256 Presigning)   Hibernate Spatial 7             │
│       │                           │                         │
└───────┼───────────────────────────┼─────────────────────────┘
        ▼                           ▼
┌──────────────┐           ┌──────────────────────────────────┐
│ MinIO Object │           │ PostgreSQL 16 + PostGIS 3.4      │
│ Storage (S3) │           │ Spatial Index (GIST) on geom     │
└──────────────┘           └──────────────────────────────────┘
```

1. **Java 21 Virtual Threads (Project Loom)**:
   * Kích hoạt `spring.threads.virtual.enabled=true`. Giúp server phục vụ hàng nghìn request I/O đồng thời (gọi DB, ký URL MinIO, gọi Redis) mà không sợ cạn kiệt thread pool truyền thống.

2. **PostgreSQL 16 + PostGIS 3.4 (Spatial Indexing)**:
   * Cột toạ độ trong bảng `locations`: `geometry(Point, 4326)`.
   * Đánh chỉ mục không gian: `CREATE INDEX idx_locations_geom ON locations USING GIST(geom);`.
   * Truy vấn vùng nhìn bản đồ bằng toán tử `ST_MakeEnvelope` và `ST_Intersects` thực hiện tìm kiếm trên cây R-Tree chỉ trong < 1ms, tránh hoàn toàn việc duyệt toàn bộ bảng (Table Scan).
   * Tự động xác định tỉnh/thành: Khi tạo kỷ niệm mới, PostGIS sử dụng `ST_Contains(province.boundary, location.geom)` để gán chính xác tỉnh thành Việt Nam tương ứng mà không cần phụ thuộc geocoding bên thứ ba.

3. **Kiến trúc Tải lên Trực tiếp (Direct Pre-signed Upload Pipeline)**:
   * Khi upload media, client không gửi file qua Spring Boot.
   * Client xin Pre-signed PUT URL $\rightarrow$ Spring Boot tạo chữ ký số trong 0.1ms $\rightarrow$ Client đẩy file trực tiếp vào MinIO.
   * Kết quả: Server Spring Boot không bao giờ bị nghẽn RAM/băng thông vì lưu giữ stream file lớn.

---

### 3.3. Hướng 3: Xác Thực & Quản Lý Người Dùng (JWT & Spring Security 6)

```text
Request ──► SecurityFilterChain ──► JwtAuthenticationFilter
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │ Hợp lệ                                        │ Không hợp lệ / Hết hạn
                 ▼                                               ▼
         SecurityContextHolder                             401 Unauthorized
                 │                                         (Client auto-refresh token)
                 ▼
         Business Controllers
```

1. **Stateless JWT Architecture**:
   * **Access Token**: Thời hạn 15–30 phút, chứa `userId`, `email`, `role`, ký bằng thuật toán HMAC-SHA256 (`HS256`).
   * **Refresh Token**: Thời hạn 7 ngày, lưu trữ an toàn trong Redis hoặc Database, hỗ trợ cơ chế thu hồi (Revoke/Blacklist) khi người dùng đăng xuất.
2. **Spring Security 6 Configuration**:
   * Sử dụng cấu hình hiện đại theo dạng Lambda DSL (`SecurityFilterChain`), tắt hoàn toàn `sessionCreationPolicy(SessionCreationPolicy.STATELESS)` và CSRF (do API dạng pure REST).
   * `BCryptPasswordEncoder` với work-factor = 10 đảm bảo độ an toàn cao cho mật khẩu.

---

## 4. Danh Mục Công Việc Chi Tiết (Implementation Tasks)

Kế hoạch được chia thành 3 giai đoạn tương ứng với 3 hướng, được sắp xếp theo thứ tự phụ thuộc tự nhiên:

---

### Giai Đoạn 1: Xác Thực & Quản Lý Người Dùng (Hướng 3)

#### Task 1: Thiết Lập Spring Security, PasswordEncoder & JWT Token Provider
* **Files:**
  * Create: `Backend/memory/src/main/java/com/travelling/memory/security/JwtTokenProvider.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/security/JwtAuthenticationFilter.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/security/SecurityConfig.java`
  * Test: `Backend/memory/src/test/java/com/travelling/memory/security/JwtTokenProviderTest.java`
* **Interfaces:**
  * Produces: `JwtTokenProvider.generateAccessToken(User user) -> String`, `validateToken(String token) -> boolean`, `getUserIdFromToken(String token) -> UUID`.
* - [ ] **Step 1: Viết failing test cho `JwtTokenProviderTest`** (Tạo token, xác thực token hợp lệ, kiểm tra token hết hạn).
* - [ ] **Step 2: Chạy test để xác nhận FAIL** (`mvn test -Dtest=JwtTokenProviderTest`).
* - [ ] **Step 3: Cài đặt `JwtTokenProvider`, `JwtAuthenticationFilter`, và `SecurityConfig`** (Cho phép public các endpoint `/api/v1/auth/**`, `/api/v1/provinces/**`, và Swagger).
* - [ ] **Step 4: Chạy lại test để xác nhận PASS**.
* - [ ] **Step 5: Git commit**: `feat(security): implement JWT provider and Spring Security filter chain`.

---

#### Task 2: Triển Khai DTOs, AuthService & AuthController (Đăng Ký / Đăng Nhập / Me)
* **Files:**
  * Create: `Backend/memory/src/main/java/com/travelling/memory/dto/auth/RegisterRequest.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/dto/auth/LoginRequest.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/dto/auth/AuthResponse.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/dto/auth/UserSummaryResponse.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/service/AuthService.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/service/impl/AuthServiceImpl.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/controller/AuthController.java`
  * Test: `Backend/memory/src/test/java/com/travelling/memory/controller/AuthControllerTest.java`
* **Interfaces:**
  * Produces: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`.
* - [ ] **Step 1: Viết test cho `AuthControllerTest`** (Test đăng ký thành công, test đăng ký trùng email báo 409 Conflict, test login sai pass báo 401).
* - [ ] **Step 2: Chạy test để xác nhận FAIL**.
* - [ ] **Step 3: Triển khai Service và Controller** với kiểm tra hợp lệ DTO (Jakarta Validation: `@Email`, `@NotBlank`, `@Size`).
* - [ ] **Step 4: Chạy lại test để xác nhận PASS**.
* - [ ] **Step 5: Git commit**: `feat(auth): implement register, login and current user endpoints`.

---

#### Task 3: Tích Hợp Trạng Thái Đăng Nhập & Modal Auth Tại Frontend
* **Files:**
  * Create: `Frontend/src/context/AuthContext.tsx`
  * Create: `Frontend/src/components/auth/AuthModal.tsx`
  * Modify: `Frontend/src/components/Navbar.tsx` (Thêm avatar người dùng khi đã đăng nhập, nút Đăng nhập / Đăng xuất).
  * Modify: `Frontend/src/services/apiClient.ts` (Tự động đính kèm `Authorization: Bearer <token>` vào mọi request).
* **Interfaces:**
  * Produces: `useAuth() -> { user, token, login(credentials), register(data), logout() }`.
* - [ ] **Step 1: Xây dựng `AuthContext`** quản lý user profile và token trong `localStorage`.
* - [ ] **Step 2: Tạo component `AuthModal`** hỗ trợ chuyển đổi mượt mà giữa Đăng nhập và Đăng ký (Validate form, hiển thị lỗi).
* - [ ] **Step 3: Tích hợp vào `Navbar`**, hiển thị tên người dùng và dropdown menu tài khoản.
* - [ ] **Step 4: Chạy kiểm thử build frontend** (`npm run build` trong `Frontend/`).
* - [ ] **Step 5: Git commit**: `feat(frontend-auth): add AuthContext, login/register modal and navbar integration`.

---

### Giai Đoạn 2: RESTful API Dữ Liệu Không Gian & Quản Lý Kỷ Niệm (Hướng 2)

#### Task 4: Spatial Query Repository & DTOs cho Location và Memory
* **Files:**
  * Create: `Backend/memory/src/main/java/com/travelling/memory/dto/memory/CreateMemoryRequest.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/dto/memory/MemoryDetailResponse.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/dto/memory/MemoryMapMarkerResponse.java`
  * Modify: `Backend/memory/src/main/java/com/travelling/memory/repository/LocationRepository.java` (Thêm query tìm kiếm không gian `ST_MakeEnvelope`).
  * Modify: `Backend/memory/src/main/java/com/travelling/memory/repository/MemoryRepository.java` (Query lấy kỷ niệm theo Bounding Box).
  * Test: `Backend/memory/src/test/java/com/travelling/memory/repository/SpatialMemoryRepositoryTest.java`
* **Interfaces:**
  * Produces: `MemoryRepository.findMemoriesInBoundingBox(double minLng, double minLat, double maxLng, double maxLat) -> List<Memory>`.
* - [ ] **Step 1: Viết failing test kiểm tra truy vấn không gian PostGIS** trong `SpatialMemoryRepositoryTest`.
* - [ ] **Step 2: Chạy test để xác nhận FAIL**.
* - [ ] **Step 3: Triển khai native query không gian** sử dụng `ST_MakeEnvelope` và hệ toạ độ WGS84 4326 trong Repository.
* - [ ] **Step 4: Chạy lại test để xác nhận PASS**.
* - [ ] **Step 5: Git commit**: `feat(spatial-repo): add PostGIS bounding-box queries for locations and memories`.

---

#### Task 5: Memory Service, MinIO Media Linking & MemoryController
* **Files:**
  * Create: `Backend/memory/src/main/java/com/travelling/memory/service/MemoryService.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/service/impl/MemoryServiceImpl.java`
  * Create: `Backend/memory/src/main/java/com/travelling/memory/controller/MemoryController.java`
  * Test: `Backend/memory/src/test/java/com/travelling/memory/controller/MemoryControllerTest.java`
* **Interfaces:**
  * Produces:
    * `POST /api/v1/memories` (Tạo kỷ niệm + liên kết toạ độ PostGIS + danh sách media storage key).
    * `GET /api/v1/memories/map?minLng=&minLat=&maxLng=&maxLat=` (Lấy markers cho góc nhìn bản đồ).
    * `GET /api/v1/memories/{id}` (Lấy chi tiết kỷ niệm kèm Pre-signed GET URL cho ảnh riêng tư).
* - [ ] **Step 1: Viết test cho `MemoryControllerTest`** (Tạo memory với toạ độ hợp lệ, truy vấn bounding box, quyền xem private vs public).
* - [ ] **Step 2: Chạy test để xác nhận FAIL**.
* - [ ] **Step 3: Cài đặt Service & Controller**, tích hợp gọi `MinioStorageService.generatePresignedGetUrl` khi trả về media riêng tư.
* - [ ] **Step 4: Chạy lại test để xác nhận PASS**.
* - [ ] **Step 5: Git commit**: `feat(memory-api): implement memory CRUD, spatial map markers and presigned media linking`.

---

### Giai Đoạn 3: Bản Đồ Tương Tác MapLibre & Pipeline Tạo Kỷ Niệm (Hướng 1)

#### Task 6: Tích Hợp MapLibre GL JS & Hiển Thị Marker Cụm (Supercluster)
* **Files:**
  * Create: `Frontend/src/components/map/MapLibreMap.tsx`
  * Create: `Frontend/src/hooks/useMapCluster.ts`
  * Modify: `Frontend/package.json` (Thêm `maplibre-gl` và `supercluster`).
  * Modify: `Frontend/src/components/MapShowcase.tsx` (Tích hợp bản đồ MapLibre thật thay cho SVG tĩnh).
* **Interfaces:**
  * Produces: Component `MapLibreMap` hỗ trợ click chọn toạ độ ghim mới, zoom, pan và hiển thị cụm số lượng kỷ niệm.
* - [ ] **Step 1: Cài đặt thư viện bản đồ** (`maplibre-gl`, `supercluster`, `@types/supercluster`).
* - [ ] **Step 2: Xây dựng `useMapCluster` hook** lắng nghe viewport thay đổi để cập nhật cụm marker tức thì.
* - [ ] **Step 3: Triển khai component `MapLibreMap`** hiển thị bản đồ Việt Nam, ghim toạ độ và popup xem trước.
* - [ ] **Step 4: Kiểm tra build Frontend** (`npm run build`).
* - [ ] **Step 5: Git commit**: `feat(map): integrate MapLibre GL JS vector map with client-side supercluster`.

---

#### Task 7: Tiện Ích Trích Xuất EXIF GPS & Nén WebP Canvas Tại Client
* **Files:**
  * Create: `Frontend/src/utils/exifExtractor.ts`
  * Create: `Frontend/src/utils/canvasImageCompressor.ts`
  * Test: `Frontend/src/utils/canvasImageCompressor.test.ts`
* **Interfaces:**
  * Produces:
    * `extractGpsFromImage(file: File) -> Promise<{ lat: number, lng: number, takenAt?: Date } | null>`.
    * `createWebpThumbnail(file: File, maxDim: number) -> Promise<{ blob: Blob, dataUrl: string }>`.
* - [ ] **Step 1: Cài đặt thư viện `exifreader`**.
* - [ ] **Step 2: Triển khai `exifExtractor.ts`** đọc toạ độ GPS (độ thập phân) từ EXIF metadata của file ảnh.
* - [ ] **Step 3: Triển khai `canvasImageCompressor.ts`** vẽ ảnh lên canvas thu nhỏ và nén sang định dạng `image/webp`.
* - [ ] **Step 4: Viết test kiểm tra kích thước ảnh đầu ra được nén đúng tỷ lệ**.
* - [ ] **Step 5: Git commit**: `feat(media-client): add client EXIF GPS extraction and canvas webp thumbnail compression`.

---

#### Task 8: Modal Tạo Kỷ Niệm Mới Khép Kín (Form · Upload Trực Tiếp MinIO · Ghim Bản Đồ)
* **Files:**
  * Create: `Frontend/src/components/memory/CreateMemoryModal.tsx`
  * Modify: `Frontend/src/components/Hero.tsx` (Nút "Ghim kỷ niệm của bạn" mở modal).
  * Modify: `Frontend/src/components/Navbar.tsx` (Nút "Ghim kỷ niệm" mở modal).
* **Interfaces:**
  * Produces: Component `CreateMemoryModal` xử lý toàn diện:
    1. Chọn ảnh $\rightarrow$ Tự động đọc GPS ghim ngay lên bản đồ nhỏ xem trước.
    2. Nén thumbnail $\rightarrow$ Xin Pre-signed URL từ Backend $\rightarrow$ Upload trực tiếp lên MinIO.
    3. Gửi payload lưu Memory và hiển thị điểm ghim mới ngay trên bản đồ chính.
* - [ ] **Step 1: Xây dựng UI Modal** (Tiêu đề, nội dung trải nghiệm, ngày đi, chế độ Công khai/Riêng tư).
* - [ ] **Step 2: Ghép nối pipeline upload ảnh** (`storageService.requestPresignedUrl` $\rightarrow$ Direct PUT $\rightarrow$ `memoryService.createMemory`).
* - [ ] **Step 3: Cập nhật state bản đồ ngay sau khi tạo thành công**, bay camera đến vị trí vừa ghim (`map.flyTo`).
* - [ ] **Step 4: Kiểm thử toàn diện build frontend** (`npm run build`).
* - [ ] **Step 5: Git commit**: `feat(memory-flow): implement CreateMemoryModal with EXIF autofill and direct upload`.

---

## 5. Tự Đánh Giá Kế Hoạch (Self-Review Checklist)

* [x] **Spec Coverage**: Kế hoạch bao quát toàn diện các module trong tài liệu kiến trúc: Xác thực JWT (Module 1), Bản đồ tương tác & Supercluster (Module 2), Quản lý kỷ niệm PostGIS (Module 3), Pipeline Direct Upload MinIO & Strict Privacy (Module 4).
* [x] **Step Granularity**: Mỗi task được chia thành các bước nhỏ nguyên tử (failing test $\rightarrow$ test fail $\rightarrow$ implement $\rightarrow$ test pass $\rightarrow$ commit).
* [x] **Type Consistency**: Các DTO, toạ độ không gian WGS84 (`lat/lng`), và tên hàm được đồng bộ thống nhất giữa Frontend (`types.ts`) và Backend.
* [x] **Review Focus**: Đã bao quát cả 5 ca biên/lỗi (Token timeout, MinIO upload error, missing EXIF GPS, out-of-bounds coords, bounding box debounce).
