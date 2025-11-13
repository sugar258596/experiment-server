import { RequestUser } from '../common/interfaces/jwt-payload.interface';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
