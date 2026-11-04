import React, { useState } from "react";
import type { MapMarkerPoint } from "../types";

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

export const MapShowcase: React.FC = () => {
  const [activeMarker, setActiveMarker] = useState<MapMarkerPoint>(VIETNAM_MARKERS[1]); // Default Tà Xùa

  return (
    <section id="map" className="px-5 py-16 sm:py-24 max-w-6xl mx-auto">
      {/* Header */}
      <div data-reveal className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900">
          Bản đồ tương tác kỷ niệm
        </h2>
        <p className="mt-3 text-base text-neutral-500">
          Bấm vào từng toạ độ để xem những album ảnh và cảm xúc thực tế mà cộng đồng đã lưu giữ.
        </p>
      </div>

      {/* Map visual showcase card */}
      <div
        data-hero-media
        className="rounded-[2.5rem] bg-white border border-black/10 p-6 sm:p-10 shadow-xl overflow-hidden grid lg:grid-cols-12 gap-8 items-center"
      >
        {/* Left: Vietnam SVG Map Illustration */}
        <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] bg-neutral-50/70 rounded-3xl p-6 border border-neutral-100">
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
              const isSelected = activeMarker.id === m.id;
              // Map percentage coords to SVG viewBox (400 x 650)
              const cx = (m.xPercent / 100) * 400;
              const cy = (m.yPercent / 100) * 650;

              return (
                <g
                  key={m.id}
                  onClick={() => setActiveMarker(m)}
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

        {/* Right: Selected Marker Detail Preview Card */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ff4d1a]/10 px-3 py-1 text-xs font-bold text-[#ff4d1a] w-fit mb-3">
            <span>📍 Toạ độ đang chọn</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            {activeMarker.name}
          </h3>
          <p className="text-sm font-semibold text-neutral-500 mt-1">
            {activeMarker.province}
          </p>

          <p className="mt-4 text-base text-neutral-600 leading-relaxed">
            {activeMarker.description}
          </p>

          {/* Featured Image */}
          <div className="mt-6 overflow-hidden rounded-2xl aspect-[16/9] bg-neutral-100 shadow-md border border-neutral-100">
            <img
              src={activeMarker.coverImage}
              alt={activeMarker.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Stats Bar & Action */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100">
            <div>
              <p className="text-2xl font-black text-neutral-900 tabular-nums">
                {activeMarker.memoriesCount}
              </p>
              <p className="text-xs text-neutral-400 font-medium">Kỷ niệm được chia sẻ</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-lg">★</span>
              <span className="font-bold text-neutral-800">{activeMarker.rating} / 5</span>
            </div>

            <button
              type="button"
              onClick={() => alert(`Chức năng ghim kỷ niệm tại ${activeMarker.name} đang mở!`)}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
            >
              <span>+ Thêm ảnh tại đây</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
