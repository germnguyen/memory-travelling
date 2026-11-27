import React, { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/apiClient";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialTab,
}) => {
  const auth = useAuth();
  const isOpen = propIsOpen !== undefined ? propIsOpen : auth.isAuthModalOpen;
  const onClose = propOnClose !== undefined ? propOnClose : auth.closeAuthModal;

  const [selectedTab, setSelectedTab] = useState<"login" | "register" | null>(null);
  const activeTab = selectedTab ?? (initialTab || auth.authModalTab || "login");

  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form fields
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setSelectedTab(null);
    setErrorMessage(null);
    setFieldErrors({});
    onClose();
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  const handleTabSwitch = (tab: "login" | "register") => {
    setSelectedTab(tab);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    if (!loginEmail.trim()) {
      errors.email = "Vui lòng nhập địa chỉ email";
    } else if (!validateEmail(loginEmail.trim())) {
      errors.email = "Địa chỉ email không đúng định dạng";
    }

    if (!loginPassword) {
      errors.password = "Vui lòng nhập mật khẩu";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await auth.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      // Clear fields and close modal
      setLoginEmail("");
      setLoginPassword("");
      handleClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage("Email hoặc mật khẩu không chính xác.");
        } else {
          setErrorMessage(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    if (!regFullName.trim()) {
      errors.fullName = "Vui lòng nhập họ và tên";
    } else if (regFullName.trim().length < 2) {
      errors.fullName = "Họ và tên tối thiểu 2 ký tự";
    }

    if (!regEmail.trim()) {
      errors.email = "Vui lòng nhập địa chỉ email";
    } else if (!validateEmail(regEmail.trim())) {
      errors.email = "Địa chỉ email không đúng định dạng";
    }

    if (!regPassword) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (regPassword.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await auth.register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      // Clear fields and close modal
      setRegFullName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
      handleClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrorMessage("Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.");
        } else {
          setErrorMessage(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#111111]/95 text-white border border-white/10 backdrop-blur-xl shadow-2xl p-6 sm:p-8 transition-all"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng hộp thoại"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>

        {/* Modal Header & Tabs */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#ff4d1a] text-sm font-black text-white shadow-lg shadow-[#ff4d1a]/20">
            MT
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold tracking-tight text-white">
            {activeTab === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
          </h2>
          <p className="mt-1 text-xs text-white/60">
            Lưu giữ và chia sẻ những kỷ niệm du lịch tuyệt vời của bạn
          </p>

          {/* Tab Selector */}
          <div className="mt-5 grid grid-cols-2 rounded-xl bg-white/5 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => handleTabSwitch("login")}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                activeTab === "login"
                  ? "bg-[#ff4d1a] text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch("register")}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                activeTab === "register"
                  ? "bg-[#ff4d1a] text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 flex items-start gap-2">
            <span className="font-bold text-red-400">!</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="ten@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={`w-full rounded-xl bg-white/5 border ${
                  fieldErrors.email ? "border-red-500" : "border-white/10"
                } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={`w-full rounded-xl bg-white/5 border ${
                  fieldErrors.password ? "border-red-500" : "border-white/10"
                } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-[#ff4d1a] py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#ff4d1a]/20 transition hover:bg-[#e03d0d] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>

            <p className="text-center text-xs text-white/60 pt-2">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => handleTabSwitch("register")}
                className="font-semibold text-[#ff4d1a] hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className={`w-full rounded-xl bg-white/5 border ${
                  fieldErrors.fullName ? "border-red-500" : "border-white/10"
                } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="ten@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={`w-full rounded-xl bg-white/5 border ${
                  fieldErrors.email ? "border-red-500" : "border-white/10"
                } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={`w-full rounded-xl bg-white/5 border ${
                  fieldErrors.password ? "border-red-500" : "border-white/10"
                } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className={`w-full rounded-xl bg-white/5 border ${
                  fieldErrors.confirmPassword ? "border-red-500" : "border-white/10"
                } px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d1a] focus:ring-1 focus:ring-[#ff4d1a] transition`}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-[#ff4d1a] py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#ff4d1a]/20 transition hover:bg-[#e03d0d] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                <span>Tạo tài khoản</span>
              )}
            </button>

            <p className="text-center text-xs text-white/60 pt-2">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => handleTabSwitch("login")}
                className="font-semibold text-[#ff4d1a] hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
