export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface ApiListResponse<T = any> extends ApiResponse<T[]> {
  total: number;
}

export interface PaginatedResponse<T = any> {
  list: T[];
  total: number;
}
