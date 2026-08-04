import api from "@/shared/utils/api";
import type { User, UpdateUserDTO } from "../types";

export const userService = {
  getProfile: () => api.get<User>("/users/me"),
  updateProfile: (data: UpdateUserDTO) => api.put<User>("/users/me", data),
};
