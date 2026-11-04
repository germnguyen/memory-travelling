# PROJECT LOG & DEVELOPMENT JOURNAL
*Memory Travelling — Nhật ký tiến độ & Lịch sử bàn giao dự án*

> **Mục đích**: Tài liệu tóm tắt trạng thái dự án, các quyết định kiến trúc cốt lõi và các đầu việc cần làm. Mọi phiên làm việc mới chỉ cần đọc tài liệu này để nắm bắt ngữ cảnh trong 5 giây mà không cần quét lại toàn bộ mã nguồn.

---

## 1. Thông Tin Chung
* **Dự án**: Memory Travelling (Nền tảng lưu giữ & chia sẻ kỷ niệm du lịch theo bản đồ Việt Nam).
* **Tech Stack**:
  * **Frontend**: React 19, TypeScript, Tailwind CSS v4, GSAP, Vite.
  * **Backend**: Java 21, Spring Boot, Spring Security (JWT), Spring Data JPA, Hibernate Spatial.
  * **Database**: PostgreSQL 16 + PostGIS Extension.
  * **Cache & Storage**: Redis 7 Alpine (Cache & Session/RateLimit), MinIO / S3 (Object Storage cho ảnh/video).
  * **DevOps**: Docker, Docker Compose (Mô hình Hybrid Dev), Multi-stage Dockerfile.

---

## 2. Các Quyết Định Kỹ Thuật Đã Thống Nhất (Technical Decisions)
1. **Bảo Mật Nghiêm Ngặt Cho Kỷ Niệm Riêng Tư (Strict Ephemeral Pre-signed URLs)**:
   * Ảnh/video của kỷ niệm `PRIVATE` được lưu trong Private Storage.
   * Khi chủ sở hữu truy cập, Backend sinh Pre-signed GET URL có thời hạn ngắn (15–30 phút) bằng thuật toán HMAC-SHA256 cục bộ (<0.1ms, không phát sinh I/O mạng tới MinIO). Ngăn ngừa rò rỉ link công khai.
2. **Chuẩn Hoá Danh Mục 63 Tỉnh/Thành & Không Gian Địa Lý (PostGIS Spatial Indexing)**:
   * Nạp sẵn master data 63 tỉnh/thành Việt Nam kèm toạ độ và ranh giới. Khi ghim toạ độ, PostGIS tự động ánh xạ để phục vụ Bảng xếp hạng (Leaderboard) và thống kê check-in chuẩn xác 100%.
3. **Pipeline Xử Lý Media Tại Client**:
   * Trình duyệt tự đọc EXIF GPS từ ảnh để gợi ý điểm ghim tức thì.
   * Client tự nén ảnh thu nhỏ (thumbnail WebP) qua Canvas trước khi tải lên, server không cần gánh worker FFmpeg hay xử lý ảnh nặng.
4. **Phân Cụm Bản Đồ Nhẹ Tải (Client Clustering with Supercluster)**:
   * Backend chỉ truy vấn bounding box qua PostGIS GIST index; Frontend chịu trách nhiệm gom cụm marker ở 60 FPS.
5. **Quy Trình Phát Triển Tối Ưu (Hybrid Dev -> Production Packaging)**:
   * *Local Dev*: `docker-compose.dev.yml` chỉ chạy PostgreSQL (PostGIS), Redis, MinIO. Backend Spring Boot và Frontend Vite chạy trực tiếp trên máy host.
   * *Production*: Đóng gói Multi-stage Dockerfile cho Backend (JRE 21 Alpine) và Frontend (Nginx Alpine).
6. **Hệ Thống Tài Liệu**:
   * `docs/superpowers/specs/2026-11-04-memory-travelling-system-design.md`: Bản thiết kế kiến trúc chuẩn & SRS.
   * `docs/superpowers/plans/2026-11-04-foundation-and-core-architecture.md`: Kế hoạch thực thi chi tiết (TDD Implementation Plan) gồm 6 tasks.
   * `PROJECT_LOG.md`: Nhật ký tiến trình cập nhật sau mỗi phiên làm việc.

---

## 3. Trạng Thái Hiện Tại (Current Status)
* **Ngày bắt đầu**: 2026-11-04
* **Giai đoạn**: **Phase 1 — Project Foundation & Core Architecture**
* **Đã hoàn thành**:
  * [x] Khảo sát hiện trạng codebase (Frontend Vite/React UI tĩnh, Backend Spring Boot khởi tạo rỗng).
  * [x] Soạn thảo Bản thiết kế kiến trúc hệ thống chuẩn & Đặc tả yêu cầu chức năng (SRS) tại `docs/superpowers/specs/2026-11-04-memory-travelling-system-design.md`.
  * [x] Thẩm định kiến trúc độc lập (Builder Check) và chốt phương án bảo mật nghiêm ngặt.
  * [x] Người dùng chính thức phê duyệt Bản thiết kế kiến trúc.
  * [x] Lập Kế hoạch thực thi chi tiết (Implementation Plan) tại `docs/superpowers/plans/2026-11-04-foundation-and-core-architecture.md`.
* **Đang tiến hành**:
  * [ ] Xác nhận lựa chọn phương thức thực thi (Subagent-driven vs Native).
  * [ ] Bắt tay vào thực thi Task 1: Thiết lập `docker-compose.dev.yml`.

---

## 4. Kế Hoạch Đầu Việc Tiếp Theo (Next Actions)
* **Task 1**: Thiết lập Docker Compose hạ tầng cục bộ (`docker-compose.dev.yml` cho Postgres/PostGIS, Redis, MinIO).
* **Task 2**: Cấu hình Spring Boot DataSource & Hibernate Spatial.
* **Task 3**: Master Data: Nạp danh mục 63 tỉnh/thành Việt Nam vào Database.
* **Task 4**: Xây dựng Tầng Entity cốt lõi (`User`, `Location`, `Memory`, `Media`, `Album`).
* **Task 5**: Triển khai Dịch vụ lưu trữ MinIO & sinh Pre-signed URL tạm thời (Strict Security).
* **Task 6**: Chuẩn hoá Frontend API Client & đồng bộ Domain Types.
