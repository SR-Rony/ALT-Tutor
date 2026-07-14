export interface ApiResponse<T> {
  success?: boolean;
  statusCode?: number;
  data: T;
  message?: string | string[];
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload extends AuthTokensResponse {
  user: BackendUser;
}

/** Shape returned by NestJS auth / users endpoints */
export interface BackendUser {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | string;
  avatar?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
}
