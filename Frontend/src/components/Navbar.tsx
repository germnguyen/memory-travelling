import React from "react";

interface NavbarProps {
  onReplayIntro: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReplayIntro }) => {
  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4 pointer-events-none">
      <header
        data-nav
        className="pointer-events-auto mx-auto flex w-fit max-w-full items-center gap-2 rounded-full bg-[#111111] text-white px-3 py-2 shadow-[0_12px_36px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-md"
      >
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 pl-2 pr-2 text-white group">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff4d1a] text-xs font-black text-white shadow-sm transition group-hover:scale-105">
            MT
          </span>
          <span className="text-sm font-bold tracking-tight hidden sm:inline-block">
            Memory Travelling
          </span>
        </a>

        {/* Navigation links */}
        <nav className="flex items-center gap-0.5 text-xs font-medium text-white/80">
          <a
            href="#map"
            className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition"
          >
            Bản đồ
          </a>
          <a
            href="#leaderboard"
            className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition"
          >
            Điểm đến
          </a>
          <a
            href="#memories"
            className="hidden md:inline-block px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition"
          >
            Bộ sưu tập
          </a>
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-1">
          <button
            type="button"
            onClick={onReplayIntro}
            title="Xem lại Intro hoạt ảnh"
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <span className="text-xs">↺</span>
            <span className="hidden lg:inline-block">Intro</span>
          </button>

          <a
            href="#map"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#ff4d1a] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e03d0d] active:scale-[0.98]"
          >
            <span>Ghim kỷ niệm</span>
            <span className="text-xs">→</span>
          </a>
        </div>
      </header>
    </div>
  );
};
