import React, { useRef } from "react";
import gsap from "gsap";

export const Footer: React.FC = () => {
  const mascotRef = useRef<HTMLDivElement>(null);

  const handleMascotHover = () => {
    if (!mascotRef.current) return;
    gsap.fromTo(
      mascotRef.current,
      { rotate: -8 },
      {
        rotate: 8,
        duration: 0.12,
        yoyo: true,
        repeat: 5,
        ease: "sine.inOut",
        onComplete: () => {
          gsap.to(mascotRef.current, { rotate: 0, duration: 0.2 });
        },
      }
    );
  };

  return (
    <footer className="px-5 pt-12 pb-16 text-center border-t border-neutral-200/60 bg-white">
      <div className="mx-auto max-w-xl flex flex-col items-center gap-4">
        {/* Playful animated mascot */}
        <div
          ref={mascotRef}
          onMouseEnter={handleMascotHover}
          onClick={handleMascotHover}
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-100 border border-neutral-200 text-4xl cursor-pointer select-none shadow-sm transition hover:scale-105 active:scale-95 will-change-transform"
          title="Chạm vào tôi!"
        >
          🎒
        </div>

        <p className="text-sm font-semibold text-neutral-800">
          Memory Travelling · Đồng hành trên mọi cung đường Việt Nam
        </p>

        <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
          Được thiết kế dựa trên các nguyên lý kiến trúc mở, hiệu ứng hoạt ảnh cao cấp và kết nối cộng đồng yêu du lịch thực tế.
        </p>

        <div className="flex items-center gap-4 text-xs font-medium text-neutral-500 mt-2">
          <a href="#map" className="hover:text-neutral-900 transition">
            Bản đồ
          </a>
          <span>·</span>
          <a href="#leaderboard" className="hover:text-neutral-900 transition">
            Điểm đến
          </a>
          <span>·</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-900 transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
