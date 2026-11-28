import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  onReplayIntro: () => void;
  onOpenCreateMemoryModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReplayIntro, onOpenCreateMemoryModal }) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const userInitial = user?.fullName
    ? user.fullName.trim().charAt(0).toUpperCase()
    : "U";

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

          <button
            type="button"
            onClick={onOpenCreateMemoryModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#ff4d1a] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e03d0d] active:scale-[0.98]"
          >
            <span>Ghim kỷ niệm</span>
            <span className="text-xs">→</span>
          </button>

          {/* Auth State Button / Profile */}
          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 pl-1 pr-2.5 py-1 text-xs font-medium text-white transition focus:outline-none focus:ring-1 focus:ring-[#ff4d1a]"
                title={user.fullName}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-6 w-6 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff4d1a] to-[#ff8c42] text-[11px] font-bold text-white shadow-sm">
                    {userInitial}
                  </span>
                )}
                <span className="max-w-[90px] truncate hidden sm:inline-block">
                  {user.fullName}
                </span>
                <span className="text-[10px] text-white/60">▼</span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#181818]/95 border border-white/10 py-1.5 shadow-2xl backdrop-blur-xl text-xs z-50">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="font-semibold text-white truncate">{user.fullName}</p>
                    <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-white/5 transition flex items-center gap-2"
                  >
                    <span>⏻</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition active:scale-[0.98]"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </header>
    </div>
  );
};
