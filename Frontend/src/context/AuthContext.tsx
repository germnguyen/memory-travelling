import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User, AuthResponse, LoginCredentials, RegisterData } from "../types";
import { authService } from "../services/authService";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    emailOrCredentials: string | LoginCredentials,
    password?: string
  ) => Promise<AuthResponse>;
  register: (
    emailOrData: string | RegisterData,
    password?: string,
    fullName?: string,
    avatarUrl?: string
  ) => Promise<AuthResponse>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalTab: "login" | "register";
  setAuthModalTab: (tab: "login" | "register") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("auth_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  }, []);

  const openAuthModal = useCallback((tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Verify and hydrate current user on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (storedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          if (typeof window !== "undefined") {
            localStorage.setItem("auth_user", JSON.stringify(profile));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      logout();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:unauthorized", handleUnauthorized);
      return () => {
        window.removeEventListener("auth:unauthorized", handleUnauthorized);
      };
    }
  }, [logout]);

  const login = useCallback(
    async (
      emailOrCredentials: string | LoginCredentials,
      passwordArg?: string
    ): Promise<AuthResponse> => {
      const credentials: LoginCredentials =
        typeof emailOrCredentials === "string"
          ? { email: emailOrCredentials, password: passwordArg || "" }
          : emailOrCredentials;

      const response = await authService.login(credentials);
      setToken(response.accessToken);
      setUser(response.user);

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.accessToken);
        localStorage.setItem("auth_user", JSON.stringify(response.user));
      }

      return response;
    },
    []
  );

  const register = useCallback(
    async (
      emailOrData: string | RegisterData,
      passwordArg?: string,
      fullNameArg?: string,
      avatarUrlArg?: string
    ): Promise<AuthResponse> => {
      const data: RegisterData =
        typeof emailOrData === "string"
          ? {
              email: emailOrData,
              password: passwordArg || "",
              fullName: fullNameArg || "",
              avatarUrl: avatarUrlArg,
            }
          : emailOrData;

      const response = await authService.register(data);
      setToken(response.accessToken);
      setUser(response.user);

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.accessToken);
        localStorage.setItem("auth_user", JSON.stringify(response.user));
      }

      return response;
    },
    []
  );

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalTab,
        setAuthModalTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
