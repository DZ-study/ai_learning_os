export interface User {
  id: string;
  email: string;
  nickname: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  email: string;
}

export interface UpdateUserDTO {
  nickname: string | null;
}
