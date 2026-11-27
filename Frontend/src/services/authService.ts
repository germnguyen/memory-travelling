import { apiRequest } from "./apiClient";
import type { AuthResponse, LoginCredentials, RegisterData, User } from "../types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<User> => {
    return apiRequest<User>("/auth/me", {
      method: "GET",
    });
  },
};
