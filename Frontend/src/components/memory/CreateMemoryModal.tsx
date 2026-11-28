import React, { useState, useEffect, useRef, useCallback, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { storageService } from "../../services/storageService";
import { memoryService, type CreateMediaPayload } from "../../services/memoryService";
import { extractGpsFromImage } from "../../utils/exifExtractor";
import { createWebpThumbnail, type CompressedThumbnail } from "../../utils/canvasImageCompressor";
import type { Visibility, Memory } from "../../types";

export interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdMemory: Memory) => void;
  initialCoords?: { latitude: number; longitude: number } | null;
}

interface SelectedMediaItem {
  file: File;
  previewUrl: string;
  thumbnail?: CompressedThumbnail;
  hasGps?: boolean;
}

export const CreateMemoryModal: React.FC<CreateMemoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCoords,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  // Media files & processing state
  const [mediaItems, setMediaItems] = useState<SelectedMediaItem[]>([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [gpsExtractionStatus, setGpsExtractionStatus] = useState<"found" | "not_found" | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visitedAt, setVisitedAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<string>(() =>
    initialCoords ? initialCoords.latitude.toFixed(6) : ""
  );
  const [longitude, setLongitude] = useState<string>(() =>
    initialCoords ? initialCoords.longitude.toFixed(6) : ""
  );
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");

  // Submission & UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    mediaItems.forEach((item) => {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {
        // Ignore revoke errors
      }
    });
    setMediaItems([]);
    setIsProcessingMedia(false);
    setGpsExtractionStatus(null);
    setTitle("");
    setDescription("");
    setVisitedAt(new Date().toISOString().split("T")[0]);
    setLocationName("");
    setLatitude(initialCoords ? initialCoords.latitude.toFixed(6) : "");
    setLongitude(initialCoords ? initialCoords.longitude.toFixed(6) : "");
    setVisibility("PUBLIC");
    setUploadProgress(0);
    setStatusMessage("");
    setErrorMessage(null);
    setFieldErrors({});
  }, [initialCoords, mediaItems]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing mid-upload
    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

  // When initialCoords changes or modal opens with initialCoords, prefill coords
  useEffect(() => {
    if (initialCoords && isOpen) {
      queueMicrotask(() => {
        setLatitude(initialCoords.latitude.toFixed(6));
        setLongitude(initialCoords.longitude.toFixed(6));
      });
    }
  }, [initialCoords, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, handleClose]);

  // Process incoming image file: extract EXIF GPS & compress thumbnail
  const processFiles = async (files: FileList | File[]) => {
    const validImageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validImageFiles.length === 0) return;

    setIsProcessingMedia(true);
    setErrorMessage(null);

    const newItems: SelectedMediaItem[] = [];
    let firstGpsFound = mediaItems.some((it) => it.hasGps);

    for (let i = 0; i < validImageFiles.length; i++) {
      const file = validImageFiles[i];
      const previewUrl = URL.createObjectURL(file);

      let thumbnail: CompressedThumbnail | undefined;
      let hasGps = false;

      try {
        // 1. Generate WebP thumbnail
        thumbnail = await createWebpThumbnail(file, 400, 0.8);
      } catch (err) {
        console.warn("Failed to generate WebP thumbnail for", file.name, err);
      }

      try {
        // 2. Extract EXIF GPS metadata
        const metadata = await extractGpsFromImage(file);
        if (metadata && typeof metadata.lat === "number" && typeof metadata.lng === "number") {
          hasGps = true;

          // Auto-fill latitude and longitude from first GPS-tagged photo only
          if (!firstGpsFound) {
            firstGpsFound = true;
            setLatitude(metadata.lat.toFixed(6));
            setLongitude(metadata.lng.toFixed(6));

            if (metadata.takenAt && !isNaN(metadata.takenAt.getTime())) {
              const dateStr = metadata.takenAt.toISOString().split("T")[0];
              setVisitedAt(dateStr);
            }
            setGpsExtractionStatus("found");
          }
        }
      } catch (err) {
        console.warn("Error reading EXIF data from", file.name, err);
      }

      newItems.push({
        file,
        previewUrl,
        thumbnail,
        hasGps,
      });
    }

    setMediaItems((prev) => [...prev, ...newItems]);
    if (!firstGpsFound) {
      setGpsExtractionStatus("not_found");
    }
    setIsProcessingMedia(false);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeMediaItem = (index: number) => {
    setMediaItems((prev) => {
      const target = prev[index];
      if (target) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // Ignore
        }
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề kỷ niệm";
    }

    if (!locationName.trim()) {
      errors.locationName = "Vui lòng nhập tên địa điểm (ví dụ: Đỉnh Fansipan)";
    }

    if (!visitedAt) {
      errors.visitedAt = "Vui lòng chọn ngày thực hiện chuyến đi";
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.latitude = "Vĩ độ không hợp lệ (phải từ -90.0 đến 90.0)";
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.longitude = "Kinh độ không hợp lệ (phải từ -180.0 đến 180.0)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Guard: User must be authenticated to create memories
    if (!isAuthenticated) {
      setErrorMessage("Vui lòng đăng nhập để lưu kỷ niệm của bạn.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const mediaList: CreateMediaPayload[] = [];
      const N = mediaItems.length;

      // Upload each selected media file and its WebP thumbnail directly to MinIO/S3
      for (let i = 0; i < N; i++) {
        const item = mediaItems[i];
        const file = item.file;

        setStatusMessage(`Đang tải ảnh ${i + 1}/${N}: ${file.name}...`);

        const baseForI = (i * 90) / N;
        const originalWeight = 50 / N;
        const thumbnailWeight = 40 / N;

        // 1. Request presigned upload URL for original image
        const originalPresigned = await storageService.requestPresignedUrl({
          filename: file.name,
          contentType: file.type || "image/jpeg",
          fileSize: file.size,
        });

        // 2. Direct PUT upload to storage (contributes up to 50% / N)
        await storageService.uploadDirect(
          originalPresigned.uploadUrl,
          file,
          file.type || "image/jpeg",
          (percent) => {
            const current = baseForI + (percent / 100) * originalWeight;
            setUploadProgress(Math.min(90, Math.round(current)));
          }
        );

        setUploadProgress(Math.round(baseForI + originalWeight));

        // 3. Compress & upload WebP thumbnail (contributes up to 40% / N)
        let thumbnailKey: string | undefined;
        try {
          const thumb = item.thumbnail || (await createWebpThumbnail(file, 400, 0.8));
          const thumbFilename = `thumb_${file.name.replace(/\.[^/.]+$/, "")}.webp`;

          const thumbPresigned = await storageService.requestPresignedUrl({
            filename: thumbFilename,
            contentType: "image/webp",
            fileSize: thumb.blob.size,
          });

          await storageService.uploadDirect(
            thumbPresigned.uploadUrl,
            thumb.blob,
            "image/webp",
            (percent) => {
              const current = baseForI + originalWeight + (percent / 100) * thumbnailWeight;
              setUploadProgress(Math.min(90, Math.round(current)));
            }
          );

          thumbnailKey = thumbPresigned.storageKey;
        } catch (thumbErr) {
          console.warn("Thumbnail upload skipped due to error:", thumbErr);
        }

        // Set progress after file i finishes (baseForI + originalWeight + thumbnailWeight = (i+1)*90/N)
        setUploadProgress(Math.round(((i + 1) * 90) / N));

        mediaList.push({
          storageKey: originalPresigned.storageKey,
          thumbnailKey,
          mediaType: "IMAGE",
          fileSize: file.size,
          width: item.thumbnail?.width,
          height: item.thumbnail?.height,
          orderIndex: i,
        });
      }

      if (N === 0) {
        setUploadProgress(10);
      } else {
        setUploadProgress(90);
      }

      // 4. Submit memory payload to Backend API (completes final 10%)
      setStatusMessage("Đang lưu thông tin kỷ niệm...");
      setUploadProgress(95);

      const createdMemory = await memoryService.createMemory({
        title: title.trim(),
        description: description.trim() || undefined,
        visitedAt,
        visibility,
        locationName: locationName.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        mediaList,
      });

      setStatusMessage("Tạo kỷ niệm thành công!");
      setUploadProgress(100);

      if (onSuccess) {
        onSuccess(createdMemory);
      }
      handleClose();
    } catch (err: unknown) {
      console.error("Failed to create memory:", err);
      const msg =
        err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tải ảnh hoặc lưu kỷ niệm.";
      setErrorMessage(`${msg} Bạn có thể nhấn 'Thử lại' để gửi lại thông tin.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-memory-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#111111]/95 text-white border border-white/10 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 transition-all"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="Đóng hộp thoại"
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ff4d1a]/15 px-3 py-1 text-xs font-bold text-[#ff4d1a] mb-2">
            <span>📍 Thêm kỷ niệm mới</span>
          </div>
          <h2 id="create-memory-modal-title" className="text-2xl font-black tracking-tight text-white">
            Ghim khoảnh khắc của bạn
          </h2>
          <p className="mt-1 text-xs text-white/60">
            Tải ảnh chụp, tự động phát hiện toạ độ GPS từ EXIF và lưu giữ toạ độ trên bản đồ Việt Nam.
          </p>
        </div>

        {/* Unauthenticated Warning Banner */}
        {!isAuthenticated && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <p className="font-bold text-amber-100">Bạn chưa đăng nhập</p>
                <p className="text-amber-200/80 mt-0.5">
                  Bạn có thể điền thông tin trước, nhưng cần đăng nhập để lưu kỷ niệm lên hệ thống.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#ff4d1a] hover:bg-[#e03d0d] text-white font-semibold text-xs transition"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200 flex items-start gap-2.5">
            <span className="font-bold text-red-400 text-sm">✕</span>
            <div className="flex-1">
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Media Selection & EXIF GPS */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
              1. Hình ảnh chuyến đi & Toạ độ EXIF
            </label>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#ff4d1a] bg-[#ff4d1a]/10"
                  : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isSubmitting}
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">📷</span>
                <p className="text-sm font-semibold text-white">
                  Kéo thả ảnh hoặc <span className="text-[#ff4d1a] underline">chọn từ thiết bị</span>
                </p>
                <p className="text-xs text-white/50">
                  Hỗ trợ JPG, PNG, WebP. Tự động đọc toạ độ GPS từ EXIF và nén WebP thumbnail.
                </p>
              </div>
            </div>

            {/* Loading processing state */}
            {isProcessingMedia && (
              <div className="flex items-center gap-2 text-xs text-orange-300 bg-orange-500/10 px-3.5 py-2 rounded-xl border border-orange-500/20">
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                <span>Đang phân tích EXIF GPS và tạo thumbnail WebP...</span>
              </div>
            )}

            {/* GPS Detection Status Banner */}
            {gpsExtractionStatus === "found" && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20">
                <span>📍</span>
                <span className="font-semibold">Đã tự động nhận diện toạ độ từ ảnh!</span>
              </div>
            )}

            {gpsExtractionStatus === "not_found" && (
              <div className="flex items-center gap-2 text-xs text-neutral-300 bg-neutral-800/80 px-3.5 py-2 rounded-xl border border-white/10">
                <span>ℹ️</span>
                <span>Ảnh không có toạ độ GPS. Bạn có thể tự nhập toạ độ hoặc chọn trực tiếp trên bản đồ.</span>
              </div>
            )}

            {/* Selected Images List */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {mediaItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden aspect-square border border-white/10 bg-neutral-900"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    {item.hasGps && (
                      <span className="absolute bottom-1 left-1 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        GPS ✓
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMediaItem(idx);
                      }}
                      disabled={isSubmitting}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/75 hover:bg-red-600 text-white text-xs flex items-center justify-center opacity-80 group-hover:opacity-100 transition"
                      title="Xoá ảnh"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: Memory Details Form */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
              2. Thông tin kỷ niệm
            </label>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Tiêu đề kỷ niệm <span className="text-[#ff4d1a]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Bình minh rực rỡ trên đỉnh Fansipan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-xl bg-white/5 border ${
                  fieldErrors.title ? "border-red-500" : "border-white/10"
                } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.title}</p>
              )}
            </div>

            {/* Location Name & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Địa điểm <span className="text-[#ff4d1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đỉnh Fansipan, Sa Pa"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl bg-white/5 border ${
                    fieldErrors.locationName ? "border-red-500" : "border-white/10"
                  } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
                />
                {fieldErrors.locationName && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.locationName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Ngày trải nghiệm <span className="text-[#ff4d1a]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={visitedAt}
                  onChange={(e) => setVisitedAt(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl bg-white/5 border ${
                    fieldErrors.visitedAt ? "border-red-500" : "border-white/10"
                  } px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
                />
                {fieldErrors.visitedAt && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.visitedAt}</p>
                )}
              </div>
            </div>

            {/* Coordinates: Latitude & Longitude */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Vĩ độ (Latitude: -90 đến 90) <span className="text-[#ff4d1a]">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ví dụ: 22.3032"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl bg-white/5 border ${
                    fieldErrors.latitude ? "border-red-500" : "border-white/10"
                  } px-3.5 py-2.5 text-sm text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
                />
                {fieldErrors.latitude && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.latitude}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Kinh độ (Longitude: -180 đến 180) <span className="text-[#ff4d1a]">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ví dụ: 103.7753"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl bg-white/5 border ${
                    fieldErrors.longitude ? "border-red-500" : "border-white/10"
                  } px-3.5 py-2.5 text-sm text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
                />
                {fieldErrors.longitude && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.longitude}</p>
                )}
              </div>
            </div>

            {/* Coordinate Preview & Mini-map Pill */}
            {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-2 font-medium">
                  <span className="text-[#ff4d1a]">📍</span>
                  <span>Ghim toạ độ: [{parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}]</span>
                </span>
                <span className="text-[11px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full font-mono">
                  WGS84
                </span>
              </div>
            )}

            {/* Visibility Mode Selector */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Chế độ riêng tư
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("PUBLIC")}
                  disabled={isSubmitting}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                    visibility === "PUBLIC"
                      ? "border-[#ff4d1a] bg-[#ff4d1a]/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <span className="text-base mb-0.5">🌍</span>
                  <span>Công khai</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("UNLISTED")}
                  disabled={isSubmitting}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                    visibility === "UNLISTED"
                      ? "border-[#ff4d1a] bg-[#ff4d1a]/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <span className="text-base mb-0.5">🔗</span>
                  <span>Chỉ có link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("PRIVATE")}
                  disabled={isSubmitting}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                    visibility === "PRIVATE"
                      ? "border-[#ff4d1a] bg-[#ff4d1a]/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <span className="text-base mb-0.5">🔒</span>
                  <span>Riêng tư</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Ghi chú / Cảm nhận trải nghiệm
              </label>
              <textarea
                rows={3}
                placeholder="Chia sẻ kỷ niệm, cảm xúc, kinh nghiệm về địa điểm này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition"
              />
            </div>
          </div>

          {/* Upload Progress Bar if submitting */}
          {isSubmitting && (
            <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between text-xs text-white/80 font-medium">
                <span>{statusMessage || "Đang xử lý..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff4d1a] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4d1a] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#ff4d1a]/25 transition hover:bg-[#e03d0d] active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <span>Ghim kỷ niệm</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
