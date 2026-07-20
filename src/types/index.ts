import { Request } from 'express';

export interface UserPayload {
  id: number;
  email: string;
  role: string;
  name: string;
  ward?: string;
  area?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}

export interface PaginatedResult<T> {
  success: boolean;
  count: number;
  total?: number;
  page?: number;
  limit?: number;
  data: T[];
}

export interface QueryFilter {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}
