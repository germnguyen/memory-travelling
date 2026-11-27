# PROJECT LOG & DEVELOPMENT JOURNAL
*Memory Travelling — Nhật ký tiến độ & Lịch sử bàn giao dự án*

> **Mục đích**: Tài liệu tóm tắt trạng thái dự án, các quyết định kiến trúc cốt lõi và các đầu việc cần làm. Mọi phiên làm việc mới chỉ cần đọc tài liệu này để nắm bắt ngữ cảnh trong 5 giây mà không cần quét lại toàn bộ mã nguồn.

---

## 1. Thông Tin Chung
* **Dự án**: Memory Travelling (Nền tảng lưu giữ & chia sẻ kỷ niệm du lịch theo bản đồ Việt Nam).
* **Git Branch**: `feature/foundation-core` (nhánh nền tảng kiến trúc lõi).
* **Tech Stack**:
  * **Frontend**: React 19, TypeScript, Tailwind CSS v4, GSAP, Vite.
  * **Backend**: Java 21, Spring Boot (v4.1.1), Spring Security, Spring Data JPA, Hibernate Spatial 7.
  * **Database**: PostgreSQL 16 + PostGIS 3.4 Extension.
  * **Cache & Storage**: Redis 7 Alpine, MinIO Object Storage (tương thích AWS S3).
  * **DevOps**: Docker, Docker Compose (Mô hình Hybrid Dev), Multi-stage Dockerfile.

---

## 2. Quy Chuẩn Làm Việc & Quyết Định Kỹ Thuật (Working Conventions)
1. **Quy chuẩn Git**: Mỗi chức năng lớn (Phase) phát triển trên một branch riêng (`feature/<feature-name>`); mỗi task kỹ thuật được kiểm thử độc lập (TDD) và commit riêng biệt (`git commit` per task).
2. **Bảo Mật Nghiêm Ngặt Kỷ Niệm Riêng Tư (Strict Ephemeral Pre-signed URLs)**:
   * Ảnh/video của kỷ niệm `PRIVATE` được lưu trong Private Storage.
   * Backend sinh Pre-signed GET URL có thời hạn ngắn (15–30 phút) bằng thuật toán HMAC-SHA256 cục bộ (<0.1ms, zero network I/O tới MinIO).
3. **Master Data 63 Tỉnh/Thành & Không Gian Địa Lý (PostGIS Spatial Indexing)**:
   * Nạp sẵn danh mục 63 tỉnh/thành Việt Nam kèm toạ độ và ranh giới. Tự động liên kết địa danh phục vụ Bảng xếp hạng và thống kê chuẩn xác 100%.
4. **Pipeline Xử Lý Media Tại Client**:
   * Trình duyệt tự đọc EXIF GPS từ ảnh để gợi ý điểm ghim tức thì.
   * Client tự nén ảnh thu nhỏ (thumbnail WebP) qua Canvas trước khi tải lên, server không cần gánh worker FFmpeg nặng.
5. **Phân Cụm Bản Đồ Nhẹ Tải (Client Clustering with Supercluster)**:
   * Backend chỉ truy vấn bounding box qua PostGIS GIST index; Frontend chịu trách nhiệm gom cụm marker ở 60 FPS.
6. **Quy Trình Phát Triển Tối Ưu (Hybrid Dev)**:
   * *Local Dev*: `docker-compose.dev.yml` chạy ngầm PostgreSQL (PostGIS), Redis, MinIO. Backend Spring Boot và Frontend Vite chạy trực tiếp trên máy host.

---

## 3. Trạng Thái Hiện Tại (Current Status)
* **Giai đoạn**: **Phase 1 — Project Foundation & Core Architecture** (ĐÃ HOÀN TẤT 100%)
* **Lịch sử Commit trên nhánh `feature/foundation-core`**:
  * `a42ebac`: `docs: add system design specification, SRS, and implementation plan`
  * `9929f77`: `chore(infra): setup hybrid dev infrastructure with postgres, postgis, redis and minio` (Task 1)
  * `414eced`: `feat(backend): configure PostgreSQL PostGIS datasource and spatial dialect` (Task 2)
  * `5a94153`: `feat(backend): implement Province entity, repository, and seed 63 Vietnam provinces` (Task 3)
  * `a4eeddc`: `feat(backend): implement core entities (User, Location, Memory, Media, Album) and spatial repositories` (Task 4)
  * `45d47d3`: `feat(backend): implement MinIO storage service with presigned PUT and ephemeral GET urls` (Task 5)
  * `7e21f13`: `feat(frontend): setup API client, storage direct-upload service, and synchronized domain models` (Task 6)

---

## 4. Kế Hoạch Đầu Việc Cho Phiên Kế Tiếp (Next Phase)
* **Chức năng tiếp theo**: **Phase 2 — Xác thực & Phân quyền (Authentication & JWT Security)**
  * Nhánh mới: `feature/auth-jwt-security`
  * [ ] Task 2.1: Triển khai JWT Token Provider & Spring Security Filter Chain.
  * [ ] Task 2.2: API Đăng ký (`/api/v1/auth/register`) & Đăng nhập (`/api/v1/auth/login`).
  * [ ] Task 2.3: API Lấy thông tin tài khoản hiện tại (`/api/v1/auth/me`).
  * [ ] Task 2.4: Giao diện Đăng nhập / Đăng ký Modal trên Frontend & Lưu trữ Token an toàn.
