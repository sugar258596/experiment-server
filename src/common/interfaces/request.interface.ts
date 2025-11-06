import { Request } from 'express';
import { Role } from '../enums/role.enum';

export interface UserPayload {
  id: number;
  username: string;
  email: string;
  role: Role;
  status: number;
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

export interface OptionalAuthRequest extends Request {
  user?: UserPayload;
}
