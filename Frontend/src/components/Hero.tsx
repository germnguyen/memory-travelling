import React from "react";

interface HeroProps {
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  const voters = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80",
  ];

  return (
    <section className="px-5 pt-28 sm:pt-36 lg:pt-40 text-center max-w-4xl mx-auto">
      {/* Badge */}
      <div data-hero className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-[#ff4d1a]" />
          <span>Interactive Vietnam Map · Kỷ niệm hành trình</span>
        </span>
      </div>

      {/* Main Headline with Split Words */}
      <h1
        data-split
        className="mt-6 text-[2.75rem] font-black tracking-tight leading-[1.02] text-neutral-900 sm:text-6xl lg:text-7xl"
      >
        Chuyến đi tiếp theo của bạn sẽ ở đâu?
      </h1>

      {/* Subtitle */}
      <p data-hero className="mx-auto mt-6 max-w-[46ch] text-base text-neutral-500 sm:text-lg">
        Lưu giữ trọn vẹn những cung đường, khoảnh khắc và album ảnh chân thực gắn liền với từng toạ độ thực tế trên bản đồ Việt Nam.
      </p>

      {/* CTA Buttons */}
      <div data-hero className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onExploreClick}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4d1a] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-[#ff4d1a]/25 transition hover:bg-[#e03d0d] hover:shadow-xl active:scale-[0.98]"
        >
          <span>Ghim kỷ niệm của bạn</span>
          <span>→</span>
        </button>

        <a
          href="#map"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-base font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-50"
        >
          Khám phá bản đồ
        </a>
      </div>

      {/* Live Activity Counters */}
      <div data-hero className="mt-8 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-500 sm:text-sm">
          {/* Active memories counter */}
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            </span>
            <span className="font-bold text-neutral-900 tabular-nums">1,425</span> kỷ niệm đã ghim
          </span>

          <span className="text-neutral-300 hidden sm:inline">|</span>

          {/* Active online users */}
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span className="font-bold text-neutral-900 tabular-nums">48</span> người đang xem
          </span>
        </div>

        {/* User Avatar Stack */}
        <div className="flex items-center gap-2.5 mt-1">
          <div className="flex -space-x-2">
            {voters.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Traveler avatar"
                className="h-7 w-7 rounded-full object-cover ring-2 ring-white shadow-xs"
              />
            ))}
          </div>
          <span className="text-xs text-neutral-400">vừa thêm album mới</span>
        </div>
      </div>
    </section>
  );
};
