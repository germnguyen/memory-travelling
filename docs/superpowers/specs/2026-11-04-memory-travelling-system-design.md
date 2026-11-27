# Memory Travelling — System Architecture & Functional Specification (SRS)

- **Date**: 2026-11-04
- **Project**: Memory Travelling (`memory-travelling`)
- **Status**: Completed & Approved Architectural Design

---

## 1. Intent & The Why

### 1.1 Problem Statement
Du lịch là một trong những trải nghiệm phong phú nhất của con người, nhưng hình ảnh và ký ức thường bị phân mảnh trên nhiều thiết bị (điện thoại, mạng xã hội, ổ cứng), thiếu sự gắn kết với không gian địa lý cụ thể nơi sự kiện diễn ra. Các nền tảng mạng xã hội hiện nay ưu tiên hiển thị theo thuật toán luồng tin tức (newsfeed) có tính trôi dạt nhanh chóng, không hỗ trợ tốt việc lưu trữ, hồi tưởng hành trình theo bản đồ trực quan hay tạo thành các cuốn album hồi ức theo vị trí địa lý.

### 1.2 Purpose & Vision
**Memory Travelling** là nền tảng quản lý và chia sẻ ký ức du lịch lấy bản đồ Việt Nam làm trung tâm (Map-centric travel journal). Hệ thống kết nối chặt chẽ chuỗi giá trị:
$$\text{Địa điểm (Toạ độ/Hành chính)} \longrightarrow \text{Kỷ niệm (Bài viết/Thời gian)} \longrightarrow \text{Phương tiện (Ảnh/Video)} \longrightarrow \text{Album/Hành trình} \longrightarrow \text{Chia sẻ/Cộng đồng}$$

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
1. **Trải nghiệm bản đồ tương tác mượt mà**: Hiển thị toạ độ, phân cấp hành chính (Tỉnh/Thành -> Quận/Huyện -> Xã/Phường), ghim kỷ niệm và tìm kiếm địa điểm chính xác trên bản đồ Việt Nam.
2. **Khả năng mở rộng chịu tải cao (Scale 100 $\rightarrow$ 1.000+ CCU)**:
   - Kiến trúc phi trạng thái (Stateless Backend) cho phép scale ngang nhiều instance sau Nginx.
   - Cơ chế Direct Upload qua Pre-signed URL lên Object Storage (S3/MinIO), giải phóng hoàn toàn băng thông Backend khi người dùng upload hàng gigabyte ảnh/video.
   - Tối ưu truy vấn dữ liệu không gian bằng PostGIS (Spatial Indexing) và cache Redis cho metadata dữ liệu phổ biến.
3. **Bảo mật nghiêm ngặt cho nội dung riêng tư (Strict Privacy Access Control)**:
   - Ảnh/video trong kỷ niệm `PRIVATE` được bảo vệ tuyệt đối: chỉ truy cập qua đường dẫn có chữ ký số (Pre-signed GET URL) tự hết hạn sau 15–30 phút, ngăn chặn rò rỉ link công khai.
4. **Quy trình phát triển tối ưu (Optimized Dev Workflow)**:
   - **Hybrid Dev**: Máy local chạy Docker cho cơ sở hạ tầng (Postgres/PostGIS, Redis, MinIO) trong khi Backend và Frontend chạy trực tiếp trên host để gỡ lỗi và hot-reload tức thì.
   - **Đóng gói chuẩn hoá**: Multi-stage Dockerfile cho production deployment.
   - **Lưu vết tiến trình**: Duy trì file `PROJECT_LOG.md` tại thư mục gốc để nắm bắt tiến độ và ngữ cảnh sau mỗi phiên làm việc.

### 2.2 Non-Goals (Ngoài phạm vi ban đầu)
1. Không xây dựng hệ sinh thái mạng xã hội phức tạp (nhắn tin thời gian thực chat 1-1, gọi video, livestream).
2. Không xây dựng cổng thanh toán hoặc hệ thống đặt vé máy bay/khách sạn (OTA booking engine).
3. Không hỗ trợ tự host server xử lý chuyển mã video nặng (Transcoding HLS/DASH) trong phiên bản ban đầu; thay vào đó giới hạn định dạng và độ dài video phổ thông (MP4/WebM tối đa 60s/100MB).

### 2.3 Anti-Goals (Những điều tối kỵ cần tránh)
1. **Lưu trữ nhị phân trực tiếp vào Database**: Tuyệt đối không lưu file byte ảnh/video trực tiếp vào PostgreSQL hay filesystem nội bộ của container Spring Boot.
2. **Stateful Backend**: Tuyệt đối không lưu session người dùng trong memory của Spring Boot (dẫn tới không thể scale ngang nhiều pod/container).
3. **Full-table Spatial Scan**: Không bao giờ truy vấn toạ độ bằng cách tính toán khoảng cách thủ công bằng Java code; phải sử dụng chỉ mục không gian PostGIS trên database.
4. **Link ảnh Private vĩnh viễn không kiểm soát**: Không dùng link public vĩnh viễn cho ảnh/video cá nhân riêng tư.

---

## 3. Functional Requirements Specification (SRS)

### Module 1: Xác thực & Quản lý Tài khoản (Authentication & User Profile)
* **FR-1.1**: Đăng ký, đăng nhập tài khoản bằng Email & Mật khẩu (mã hóa BCrypt).
* **FR-1.2**: Xác thực phi trạng thái sử dụng JWT (Access Token 15-60 phút + Refresh Token an toàn trong HTTP-only Cookie / Redis).
* **FR-1.3**: Quản lý hồ sơ cá nhân: Họ tên, avatar, bio, danh sách địa điểm đã đi qua, thống kê số lượng tỉnh thành đã đặt chân đến dựa trên dữ liệu chuẩn 63 tỉnh/thành.

### Module 2: Bản đồ Việt Nam & Toạ độ Địa lý (Interactive Vietnam Map)
* **FR-2.1**: Bản đồ trực quan hỗ trợ phóng to/thu nhỏ (Zoom), dịch chuyển (Pan), ghim vị trí (Marker).
* **FR-2.2**: Tìm kiếm địa điểm theo tên và phân cấp hành chính chuẩn 63 tỉnh/thành Việt Nam (nạp sẵn danh mục chuẩn và polygon ranh giới).
* **FR-2.3**: Bounding Box Query & Client-side Clustering:
  - Khi người dùng kéo hoặc zoom bản đồ, client gửi toạ độ góc nhìn (SW, NE); backend truy vấn PostGIS `ST_MakeEnvelope` trả về các điểm ghim.
  - Client sử dụng thư viện `Supercluster` để nhóm cụm điểm ghim mượt mà 60 FPS mà không làm nghẽn CPU server.

### Module 3: Quản lý Kỷ niệm (Memory Management)
* **FR-3.1**: Tạo mới kỷ niệm gắn với một vị trí cụ thể (Toạ độ Lat/Lng + Tên địa danh). PostGIS tự động xác định tỉnh/huyện tương ứng qua hàm không gian `ST_Contains`.
* **FR-3.2**: Thuộc tính kỷ niệm: Tiêu đề, nội dung cảm nghĩ (Markdown/Rich text), thời gian trải nghiệm thực tế (visited_at), cảm xúc (mood), thời tiết (weather), danh sách tags.
* **FR-3.3**: Cập nhật, chỉnh sửa, xóa kỷ niệm (Soft-delete).
* **FR-3.4**: Lọc và tìm kiếm kỷ niệm: Theo khoảng thời gian, theo tỉnh thành, theo album, hoặc theo từ khóa.

### Module 4: Quản lý Phương tiện & Tải lên Trực tiếp (Media Pipeline & Strict Privacy)
* **FR-4.1**: Trích xuất EXIF GPS tại Client: Trình duyệt đọc toạ độ GPS từ ảnh ngay khi chọn file để tự động ghim vị trí lên bản đồ tức thì.
* **FR-4.2**: Sinh Thumbnail WebP tại Client: Client tự động nén tạo ảnh thu nhỏ (thumbnail) kích thước nhẹ trên Canvas trước khi tải lên, giải phóng 100% CPU của Backend.
* **FR-4.3**: Cơ chế Direct Upload qua Pre-signed PUT URL:
  1. Frontend gửi yêu cầu: danh sách tên file + dung lượng + mime-type.
  2. Backend kiểm tra hạn mức và sinh Pre-signed PUT URL từ S3/MinIO.
  3. Frontend tải trực tiếp file gốc và thumbnail lên Object Storage.
  4. Frontend thông báo Backend hoàn tất kèm `storage_key` để lưu metadata vào database.
* **FR-4.4**: Cơ chế Bảo mật nghiêm ngặt (Strict Privacy Access):
  - Kỷ niệm `PRIVATE`: Các file media nằm trong Private Storage. Khi chủ nhân yêu cầu xem, Backend tính toán chữ ký số HMAC-SHA256 cục bộ (<0.1ms) sinh **Pre-signed GET URL có thời hạn 15-30 phút**.
  - Kỷ niệm `PUBLIC` / Bảng xếp hạng: Cấp link công khai hoặc thời hạn dài (long-lived CDN link) và được cache toàn phần trên Redis.

### Module 5: Album & Lộ trình Chuyến đi (Albums & Travel Itineraries)
* **FR-5.1**: Tạo và quản lý Album cá nhân (ví dụ: "Tây Bắc Mùa Lúa Chín 2026", "Hành Trình Xuyên Việt").
* **FR-5.2**: Một kỷ niệm có thể thuộc về nhiều Album; một Album chứa nhiều kỷ niệm được sắp xếp theo trình tự thời gian.
* **FR-5.3**: Hiển thị lộ trình chuyến đi (vẽ đường nối Polyline giữa các điểm đến theo thứ tự ngày đi).

### Module 6: Chia sẻ & Bảng Xếp hạng (Sharing & Discovery)
* **FR-6.1**: Chế độ hiển thị: `PRIVATE` (chỉ mình tôi), `UNLISTED` (chia sẻ qua secret token), `PUBLIC` (công khai trên bản đồ cộng đồng).
* **FR-6.2**: Bảng xếp hạng điểm đến thịnh hành (Destination Leaderboard): Thống kê số lượng kỷ niệm được check-in nhiều nhất theo tỉnh thành chuẩn hoá, dữ liệu được cache trên Redis.

---

## 4. Technical Architecture Design

### 4.1 System Overview Architecture

```text
                            [ Client Browser / Mobile Web ]
                           (React 19 + TypeScript + Tailwind)
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │ (Direct S3 Upload & View via Pre-signed)  │ (REST API via JWT)
                   ▼                                           ▼
          [ Object Storage ]                         [ Reverse Proxy / Gateway ]
          (MinIO / AWS S3)                                 (Nginx)
          - Private Bucket for User Photos                 │
                   ▲                                           ▼
                   │                                  [ Spring Boot Backend ]
                   │                             (Java 21, JPA, Security, PostGIS)
                   │                                     │             │
                   │                          ┌──────────┘             └──────────┐
                   │                          ▼                                   ▼
        (Generate Pre-signed URL)    [ PostgreSQL 16 + PostGIS ]           [ Redis Cache ]
        - In-memory HMAC-SHA256      - Pre-seeded 63 Provinces            - Metadata Cache
        - TTL: 15-30 mins            - Spatial Index (GIST)               - Hot Leaderboard
```

### 4.2 Database Schema (PostgreSQL + PostGIS)

#### Bảng `users`
* `id`: UUID (Primary Key)
* `email`: VARCHAR(255) UNIQUE NOT NULL
* `password_hash`: VARCHAR(255) NOT NULL
* `full_name`: VARCHAR(120) NOT NULL
* `avatar_url`: VARCHAR(512)
* `role`: VARCHAR(32) DEFAULT 'ROLE_USER'
* `created_at`, `updated_at`: TIMESTAMP WITH TIME ZONE

#### Bảng `provinces` (Master Data 63 Tỉnh/Thành)
* `id`: INTEGER (Primary Key - Mã hành chính chuẩn)
* `name`: VARCHAR(120) NOT NULL (e.g., "Sơn La")
* `code`: VARCHAR(32) UNIQUE NOT NULL (e.g., "SON_LA")
* `boundary`: GEOMETRY(MultiPolygon, 4326) -- Ranh giới bản đồ
* *Index*: `CREATE INDEX idx_provinces_boundary ON provinces USING GIST (boundary);`

#### Bảng `locations`
* `id`: UUID (Primary Key)
* `name`: VARCHAR(255) NOT NULL (e.g., "Tà Xùa")
* `province_id`: INTEGER REFERENCES provinces(id)
* `district`: VARCHAR(120)
* `commune`: VARCHAR(120)
* `coordinates`: GEOMETRY(Point, 4326) NOT NULL -- PostGIS Point (Lng, Lat)
* `created_at`: TIMESTAMP WITH TIME ZONE
* *Index*: `CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);`

#### Bảng `memories`
* `id`: UUID (Primary Key)
* `user_id`: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
* `location_id`: UUID NOT NULL REFERENCES locations(id)
* `title`: VARCHAR(255) NOT NULL
* `description`: TEXT
* `visited_at`: DATE NOT NULL
* `visibility`: VARCHAR(32) DEFAULT 'PRIVATE' -- PRIVATE, UNLISTED, PUBLIC
* `share_token`: VARCHAR(64) UNIQUE
* `created_at`, `updated_at`: TIMESTAMP WITH TIME ZONE
* *Index*: `CREATE INDEX idx_memories_user_id ON memories(user_id);`
* *Index*: `CREATE INDEX idx_memories_visited_at ON memories(visited_at);`

#### Bảng `media`
* `id`: UUID (Primary Key)
* `memory_id`: UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE
* `media_type`: VARCHAR(32) NOT NULL -- IMAGE, VIDEO
* `storage_key`: VARCHAR(512) NOT NULL -- Đường dẫn trong Bucket
* `thumbnail_key`: VARCHAR(512)
* `file_size`: BIGINT NOT NULL
* `width`: INTEGER
* `height`: INTEGER
* `duration_seconds`: INTEGER
* `order_index`: INTEGER DEFAULT 0
* `created_at`: TIMESTAMP WITH TIME ZONE
* *Index*: `CREATE INDEX idx_media_memory_id ON media(memory_id);`

---

## 5. High Scalability & Privacy Optimization Strategy (100 $\rightarrow$ 1.000+ CCU)

1. **Hiệu năng ký URL ảnh bảo mật (<0.1ms)**:
   * Với phương án bảo mật nghiêm ngặt, Backend sinh link Pre-signed GET URL bằng thuật toán HMAC-SHA256 thuần túy trong RAM mà **không thực hiện bất kỳ lệnh gọi mạng (network I/O) nào tới MinIO/S3**.
   * Nhờ đó, việc sinh 50 link ảnh cho một album chỉ tốn vài mili-giây, CPU máy chủ hoàn toàn chịu tải tốt 1.000 CCU.
2. **Chiến lược Cache Redis hai tầng**:
   * **Tầng 1 (Metadata)**: Lưu cache thông tin bài viết, danh mục tỉnh thành, số lượng check-in (không chứa link ảnh tạm).
   * **Tầng 2 (Public Data)**: Lưu cache toàn bộ DTO gồm cả link ảnh cho các bài viết `PUBLIC` và bảng xếp hạng Leaderboard.
3. **Phân cụm BBox nhẹ tải**:
   * Backend chỉ truy vấn các điểm ghim trong khung nhìn với index GIST (`ST_MakeEnvelope`).
   * Frontend dùng `Supercluster` để gom cụm điểm ghim trên trình duyệt người dùng, giảm thiểu 90% tính toán trên database.

---

## 6. Containerization & Development Workflow

### 6.1 Môi trường Phát triển (Hybrid Dev - `docker-compose.dev.yml`)
* Docker khởi chạy hạ tầng nền tảng:
  * PostgreSQL 16 + PostGIS: Port `5432`
  * Redis 7 Alpine: Port `6379`
  * MinIO Object Storage: Port `9000` (API S3) & `9001` (Web Console)
* Backend chạy trực tiếp từ host: `./mvnw spring-boot:run` (hưởng lợi từ Hot-reload & Breakpoint debug tức thì).
* Frontend chạy từ host: `npm run dev` (Vite dev server tại `http://localhost:5173`).

### 6.2 Môi trường Đóng gói Sản xuất (Production - `docker-compose.prod.yml`)
* **Backend Dockerfile**: Multi-stage (Stage 1: Maven build jar; Stage 2: Eclipse Temurin JRE 21 Alpine chạy jar với JVM container flags `-XX:MaxRAMPercentage=75.0`).
* **Frontend Dockerfile**: Multi-stage (Stage 1: Node build; Stage 2: Nginx Alpine phân phối tĩnh & reverse proxy API).

---

## 7. Approaches Considered & Tradeoffs

| Tiêu chí | Phương án đã chọn | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Quyền riêng tư Media** | **Strict Ephemeral Pre-signed GET URL (15-30 phút)** | Bảo mật tuyệt đối cho ảnh gia đình/cá nhân, không lo rò rỉ link. Ký bằng crypto nội bộ cực nhanh. |
| **Quản lý Địa điểm** | **Pre-seeded 63 Tỉnh/Thành + PostGIS Polygon** | Bảng xếp hạng và thống kê check-in chuẩn xác 100%, không bị sai lệch do người dùng nhập chuỗi tự do. |
| **Xử lý Media** | **Client-side EXIF Extraction & WebP Thumbnail** | Trình duyệt người dùng tự xử lý ảnh nhẹ nhàng, server không phải gánh FFmpeg/ImageMagick nặng nề. |
| **Phát triển & Đóng gói**| **Hybrid Dev $\rightarrow$ Multi-stage Docker Prod** | Tốc độ lập trình trên máy cực nhanh, đóng gói bàn giao an toàn và nhất quán 100%. |
