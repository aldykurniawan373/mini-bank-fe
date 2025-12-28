import type { User } from './auth';
import type { PaginatedResponse } from './api';

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
}

export interface UserListResponse extends PaginatedResponse<User> {}

export interface UserResponse {
  message: string;
  data: User;
}

export type { User } from './auth';

