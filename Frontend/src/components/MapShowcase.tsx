import React, { useState, useEffect, useCallback, useRef } from "react";
import type { MapMarkerPoint, MemoryMapMarkerResponse, BoundingBoxQuery, Memory } from "../types";
import { MapLibreMap } from "./map/MapLibreMap";
import { memoryService } from "../services/memoryService";

// Predefined Vietnam landmarks for SVG Map
const VIETNAM_MARKERS: MapMarkerPoint[] = [
  {
    id: "hagiang",
    name: "Hà Giang",
    province: "Hà Giang",
    xPercent: 46,
    yPercent: 12,
    memoriesCount: 312,
    rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    description: "Đèo Mã Pí Lèng, sông Nho Quế màu ngọc bích và cao nguyên đá Đồng Văn hùng vĩ.",
  },
  {
    id: "taxua",
    name: "Tà Xùa",
    province: "Bắc Yên, Sơn La",
    xPercent: 38,
    yPercent: 18,
    memoriesCount: 428,
    rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    description: "Sống lưng khủng long giữa biển mây trắng bồng bềnh chạm đỉnh trời Tây Bắc.",
  },
  {
    id: "hanoi",
    name: "Hà Nội",
    province: "Thủ đô Hà Nội",
    xPercent: 52,
    yPercent: 24,
    memoriesCount: 520,
    rating: 4.8,
    coverImage: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    description: "36 phố phường cổ kính, hồ Gươm mùa thu và hương cốm thơm ngát.",
  },
  {
    id: "ninhbinh",
    name: "Tràng An",
    province: "Ninh Bình",
    xPercent: 55,
    yPercent: 30,
    memoriesCount: 260,
    rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
    description: "Kỳ quan sông nước và núi đá vôi uốn lượn được UNESCO vinh danh di sản thế giới.",
  },
  {
    id: "danang",
    name: "Đà Nẵng & Hội An",
    province: "Đà Nẵng - Quảng Nam",
    xPercent: 68,
    yPercent: 48,
    memoriesCount: 460,
    rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
    description: "Cầu Vàng Bà Nà Hills, bán đảo Sơn Trà và phố cổ đèn lồng lãng mạn bên sông Hoài.",
  },
  {
    id: "dalat",
    name: "Đà Lạt",
    province: "Lâm Đồng",
    xPercent: 67,
    yPercent: 74,
    memoriesCount: 395,
    rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    description: "Thành phố ngàn hoa se lạnh, đồi thông bạt ngàn và những quán cafe sương mờ.",
  },
  {
    id: "phuquoc",
    name: "Phú Quốc",
    province: "Kiên Giang",
    xPercent: 45,
    yPercent: 92,
    memoriesCount: 310,
    rating: 4.8,
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    description: "Hoàng hôn ngũ sắc trên biển Bãi Sao, cáp treo Hòn Thơm và làng chài êm đềm.",
  },
];

// Rich sample memories for MapLibre vector map clustering
const SAMPLE_MAP_MARKERS: MemoryMapMarkerResponse[] = [
  {
    memoryId: "hg-1",
    title: "Đèo Mã Pí Lèng hùng vĩ",
    provinceName: "Hà Giang",
    latitude: 22.8233,
    longitude: 104.9839,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-10-15",
    visibility: "PUBLIC",
  },
  {
    memoryId: "hg-2",
    title: "Cột cờ Lũng Cú cực Bắc",
    provinceName: "Hà Giang",
    latitude: 23.3619,
    longitude: 105.3184,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-10-16",
    visibility: "PUBLIC",
  },
  {
    memoryId: "tx-1",
    title: "Sống lưng khủng long Tà Xùa",
    provinceName: "Sơn La",
    latitude: 21.2858,
    longitude: 104.4608,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-11-02",
    visibility: "PUBLIC",
  },
  {
    memoryId: "sp-1",
    title: "Thung lũng Mường Hoa Sapa",
    provinceName: "Lào Cai",
    latitude: 22.3364,
    longitude: 103.8438,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-09-30",
    visibility: "PUBLIC",
  },
  {
    memoryId: "hn-1",
    title: "Hồ Gươm sương sớm mùa thu",
    provinceName: "Hà Nội",
    latitude: 21.0285,
    longitude: 105.8542,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-10-20",
    visibility: "PUBLIC",
  },
  {
    memoryId: "hn-2",
    title: "Hoàng thành Thăng Long",
    provinceName: "Hà Nội",
    latitude: 21.0338,
    longitude: 105.8402,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-10-22",
    visibility: "PUBLIC",
  },
  {
    memoryId: "nb-1",
    title: "Quần thể danh thắng Tràng An",
    provinceName: "Ninh Bình",
    latitude: 20.2506,
    longitude: 105.9048,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-09-18",
    visibility: "PUBLIC",
  },
  {
    memoryId: "hue-1",
    title: "Đại Nội Huế & Cố đô di sản",
    provinceName: "Thừa Thiên Huế",
    latitude: 16.4637,
    longitude: 107.5909,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-08-20",
    visibility: "PUBLIC",
  },
  {
    memoryId: "dn-1",
    title: "Bình minh biển Mỹ Khê & Cầu Rồng",
    provinceName: "Đà Nẵng",
    latitude: 16.0544,
    longitude: 108.2022,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-08-12",
    visibility: "PUBLIC",
  },
  {
    memoryId: "ha-1",
    title: "Phố cổ đèn lồng Hội An",
    provinceName: "Quảng Nam",
    latitude: 15.8801,
    longitude: 108.3380,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-08-14",
    visibility: "PUBLIC",
  },
  {
    memoryId: "nt-1",
    title: "Lặn ngắm san hô Hòn Mun",
    provinceName: "Khánh Hòa",
    latitude: 12.2388,
    longitude: 109.1967,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-07-10",
    visibility: "PUBLIC",
  },
  {
    memoryId: "dl-1",
    title: "Đồi thông ngắm sương mờ Đà Lạt",
    provinceName: "Lâm Đồng",
    latitude: 11.9404,
    longitude: 108.4583,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-11-10",
    visibility: "PUBLIC",
  },
  {
    memoryId: "dl-2",
    title: "Hồ Tuyền Lâm chiều tĩnh lặng",
    provinceName: "Lâm Đồng",
    latitude: 11.8887,
    longitude: 108.4286,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-11-11",
    visibility: "PUBLIC",
  },
  {
    memoryId: "sg-1",
    title: "Nhà thờ Đức Bà Sài Gòn",
    provinceName: "TP. Hồ Chí Minh",
    latitude: 10.7798,
    longitude: 106.6990,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-11-15",
    visibility: "PUBLIC",
  },
  {
    memoryId: "pq-1",
    title: "Hoàng hôn ngũ sắc Bãi Sao",
    provinceName: "Kiên Giang",
    latitude: 10.2899,
    longitude: 103.9840,
    coverThumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    visitedAt: "2026-07-25",
    visibility: "PUBLIC",
  },
];

type MapMode = "maplibre" | "svg";

export interface MapShowcaseProps {
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  newlyCreatedMemory?: Memory | null;
}

export const MapShowcase: React.FC<MapShowcaseProps> = ({ onLocationSelect, newlyCreatedMemory }) => {
  // Mode selection: MapLibre Vector Map vs Artistic SVG Map
  const [mapMode, setMapMode] = useState<MapMode>("maplibre");

  // SVG Mode active marker
  const [activeSvgMarker, setActiveSvgMarker] = useState<MapMarkerPoint>(VIETNAM_MARKERS[1]);

  // MapLibre Markers & Pin selection state
  const [mapMarkers, setMapMarkers] = useState<MemoryMapMarkerResponse[]>(SAMPLE_MAP_MARKERS);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isPinMode, setIsPinMode] = useState<boolean>(false);
  const [activeVectorMarker, setActiveVectorMarker] = useState<MemoryMapMarkerResponse>(SAMPLE_MAP_MARKERS[2]);
  const [flyToCoords, setFlyToCoords] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null);
  const lastRequestIdRef = useRef<number>(0);

  // Sync newly created memory to map markers and trigger camera flyTo
  useEffect(() => {
    if (newlyCreatedMemory && newlyCreatedMemory.location) {
      const newMarker: MemoryMapMarkerResponse = {
        memoryId: newlyCreatedMemory.id,
        locationId: newlyCreatedMemory.location.id || `loc-${newlyCreatedMemory.id}`,
        title: newlyCreatedMemory.title,
        provinceName: newlyCreatedMemory.location.province?.name || newlyCreatedMemory.location.name || "Việt Nam",
        latitude: newlyCreatedMemory.location.latitude,
        longitude: newlyCreatedMemory.location.longitude,
        coverThumbnailUrl: newlyCreatedMemory.mediaList?.[0]?.downloadUrl || newlyCreatedMemory.mediaList?.[0]?.thumbnailKey || "",
        coverStorageKey: newlyCreatedMemory.mediaList?.[0]?.thumbnailKey || newlyCreatedMemory.mediaList?.[0]?.storageKey || "",
        visitedAt: newlyCreatedMemory.visitedAt,
        visibility: newlyCreatedMemory.visibility,
      };

      queueMicrotask(() => {
        setMapMode("maplibre");
        setMapMarkers((prev) => [newMarker, ...prev.filter((m) => m.memoryId !== newMarker.memoryId)]);
        setActiveVectorMarker(newMarker);
        setFlyToCoords({
          latitude: newlyCreatedMemory.location.latitude,
          longitude: newlyCreatedMemory.location.longitude,
          zoom: 12,
        });
      });
    }
  }, [newlyCreatedMemory]);

  // Load backend markers or fallback with request tracking to avoid race conditions
  const fetchMarkersInBounds = useCallback(async (bbox: BoundingBoxQuery) => {
    const requestId = ++lastRequestIdRef.current;
    try {
      const data = await memoryService.getMapMarkers(bbox);
      if (requestId === lastRequestIdRef.current && data && data.length > 0) {
        setMapMarkers(data);
      }
    } catch {
      // Backend unavailable or empty; sample markers are retained
    }
  }, []);

  // Fetch on initial mount with Vietnam bounding box
  useEffect(() => {
    let ignore = false;
    memoryService
      .getMapMarkers({
        minLng: 102.0,
        minLat: 8.0,
        maxLng: 110.0,
        maxLat: 24.0,
      })
      .then((data) => {
        if (!ignore && data && data.length > 0) {
          setMapMarkers(data);
        }
      })
      .catch(() => {
        // Backend unavailable or empty; sample markers are retained
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleBoundsChange = (bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
    fetchMarkersInBounds(bounds);
  };

  const handleLocationSelect = (coords: { latitude: number; longitude: number }) => {
    setSelectedCoords(coords);
  };

  const handleMarkerClick = (marker: MemoryMapMarkerResponse) => {
    setActiveVectorMarker(marker);
  };

  return (
    <section id="map" className="px-5 py-16 sm:py-24 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div data-reveal className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900">
          Bản đồ tương tác kỷ niệm
        </h2>
        <p className="mt-3 text-base text-neutral-500">
          Khám phá những vùng đất qua toạ độ không gian, album ảnh thực tế và cụm kỷ niệm được cộng đồng lưu giữ.
        </p>

        {/* View Mode Toggle Switcher */}
        <div className="mt-8 inline-flex p-1.5 bg-neutral-100 rounded-full border border-neutral-200 shadow-inner">
          <button
            type="button"
            onClick={() => setMapMode("maplibre")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              mapMode === "maplibre"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <span>🗺️ Bản đồ số MapLibre</span>
            <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-[#ff4d1a] text-[10px] font-black">
              WebGL
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode("svg")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              mapMode === "svg"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <span>🎨 Bản đồ Nghệ thuật SVG</span>
          </button>
        </div>
      </div>

      {/* Map visual showcase container */}
      <div
        data-hero-media
        className="rounded-[2.5rem] bg-white border border-black/10 p-6 sm:p-8 shadow-xl overflow-hidden grid lg:grid-cols-12 gap-8 items-center"
      >
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {mapMode === "maplibre" ? (
            <div className="relative flex flex-col">
              {/* Map Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPinMode((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isPinMode
                        ? "bg-[#ff4d1a] text-white shadow-md shadow-orange-500/20"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200"
                    }`}
                  >
                    <span>{isPinMode ? "✕ Hủy ghim" : "📍 Ghim toạ độ mới"}</span>
                  </button>

                  {selectedCoords && (
                    <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                      Đã chọn: {selectedCoords.latitude.toFixed(4)}, {selectedCoords.longitude.toFixed(4)}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-neutral-400 font-medium">
                  {mapMarkers.length} địa điểm hiển thị
                </div>
              </div>

              {/* MapLibre WebGL Viewport */}
              <div className="min-h-[480px] h-[520px] rounded-3xl overflow-hidden border border-neutral-200 shadow-inner bg-neutral-50">
                <MapLibreMap
                  markers={mapMarkers}
                  onBoundsChange={handleBoundsChange}
                  onLocationSelect={handleLocationSelect}
                  selectedCoords={selectedCoords}
                  isPinMode={isPinMode}
                  onMarkerClick={handleMarkerClick}
                  flyToCoords={flyToCoords}
                  className="w-full h-full"
                />
              </div>
            </div>
          ) : (
            /* Original Vietnam SVG Map Illustration */
            <div className="relative flex items-center justify-center min-h-[480px] h-[520px] bg-neutral-50/70 rounded-3xl p-6 border border-neutral-100">
              <svg
                viewBox="0 0 400 650"
                className="w-full max-w-[340px] h-auto drop-shadow-md select-none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Vietnam S-Shape stylized silhouette */}
                <path
                  d="M170 30 C 220 30, 240 60, 220 110 C 200 150, 230 180, 250 240 C 270 300, 280 360, 275 420 C 270 480, 255 530, 210 570 C 180 600, 150 610, 160 580 C 170 540, 210 500, 215 450 C 220 400, 210 320, 180 260 C 150 200, 130 150, 140 100 C 145 60, 155 40, 170 30 Z"
                  fill="#f0f2f5"
                  stroke="#e2e8f0"
                  strokeWidth="2"
                />
                {/* Paracel & Spratly Islands indicators */}
                <circle cx="340" cy="360" r="8" fill="#e2e8f0" />
                <text x="325" y="380" fontSize="10" fill="#94a3b8" fontWeight="600">
                  Hoàng Sa
                </text>
                <circle cx="330" cy="520" r="10" fill="#e2e8f0" />
                <text x="315" y="542" fontSize="10" fill="#94a3b8" fontWeight="600">
                  Trường Sa
                </text>

                {/* Interactive Location Markers */}
                {VIETNAM_MARKERS.map((m) => {
                  const isSelected = activeSvgMarker.id === m.id;
                  const cx = (m.xPercent / 100) * 400;
                  const cy = (m.yPercent / 100) * 650;

                  return (
                    <g
                      key={m.id}
                      onClick={() => setActiveSvgMarker(m)}
                      className="cursor-pointer transition-transform duration-300"
                    >
                      {/* Outer pulse when selected */}
                      {isSelected && (
                        <circle cx={cx} cy={cy} r="16" fill="#ff4d1a" opacity="0.25">
                          <animate
                            attributeName="r"
                            values="12;22;12"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Marker Pin Circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 9 : 6}
                        fill={isSelected ? "#ff4d1a" : "#111111"}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="transition-all duration-200"
                      />

                      {/* Pin Label */}
                      <text
                        x={cx + 12}
                        y={cy + 4}
                        fontSize={isSelected ? "13" : "11"}
                        fontWeight={isSelected ? "bold" : "600"}
                        fill={isSelected ? "#ff4d1a" : "#333333"}
                      >
                        {m.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Right Column: Active Destination Details Card */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          {mapMode === "maplibre" ? (
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ff4d1a]/10 px-3 py-1 text-xs font-bold text-[#ff4d1a] w-fit mb-3">
                <span>📍 Điểm xem trên bản đồ</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {activeVectorMarker.title}
              </h3>
              <p className="text-sm font-semibold text-neutral-500 mt-1 flex items-center gap-2">
                <span>{activeVectorMarker.provinceName || "Việt Nam"}</span>
                {activeVectorMarker.visitedAt && (
                  <span className="text-neutral-400">• Ngày thăm: {activeVectorMarker.visitedAt}</span>
                )}
              </p>

              {/* Cover Image */}
              <div className="mt-5 overflow-hidden rounded-2xl aspect-[16/10] bg-neutral-100 shadow-md border border-neutral-100">
                <img
                  src={
                    activeVectorMarker.coverThumbnailUrl ||
                    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={activeVectorMarker.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Selected Coordinates info if any */}
              {selectedCoords && (
                <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-neutral-500 font-medium">Toạ độ ghim mới</p>
                    <p className="text-neutral-800 font-mono font-bold">
                      {selectedCoords.latitude.toFixed(6)}, {selectedCoords.longitude.toFixed(6)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCoords(null)}
                    className="text-xs text-neutral-400 hover:text-neutral-700"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                <div>
                  <p className="text-xs text-neutral-400 font-medium">Trạng thái chia sẻ</p>
                  <p className="text-sm font-bold text-neutral-800">
                    {activeVectorMarker.visibility === "PRIVATE" ? "Riêng tư 🔒" : "Công khai 🌍"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const lat = selectedCoords?.latitude ?? activeVectorMarker.latitude;
                    const lng = selectedCoords?.longitude ?? activeVectorMarker.longitude;
                    if (onLocationSelect) {
                      onLocationSelect({ latitude: lat, longitude: lng });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
                >
                  <span>+ Ghim kỷ niệm tại đây</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ff4d1a]/10 px-3 py-1 text-xs font-bold text-[#ff4d1a] w-fit mb-3">
                <span>📍 Toạ độ đang chọn</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {activeSvgMarker.name}
              </h3>
              <p className="text-sm font-semibold text-neutral-500 mt-1">
                {activeSvgMarker.province}
              </p>

              <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                {activeSvgMarker.description}
              </p>

              {/* Featured Image */}
              <div className="mt-6 overflow-hidden rounded-2xl aspect-[16/9] bg-neutral-100 shadow-md border border-neutral-100">
                <img
                  src={activeSvgMarker.coverImage}
                  alt={activeSvgMarker.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Stats Bar & Action */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                <div>
                  <p className="text-2xl font-black text-neutral-900 tabular-nums">
                    {activeSvgMarker.memoriesCount}
                  </p>
                  <p className="text-xs text-neutral-400 font-medium">Kỷ niệm được chia sẻ</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-amber-500 text-lg">★</span>
                  <span className="font-bold text-neutral-800">{activeSvgMarker.rating} / 5</span>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Chức năng ghim kỷ niệm tại ${activeSvgMarker.name} đang mở!`)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
                >
                  <span>+ Thêm ảnh tại đây</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
