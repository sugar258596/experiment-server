import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUserMiddleware } from './current-user.middleware';
import { Request, Response, NextFunction } from 'express';
import { Role } from '../enums/role.enum';

describe('CurrentUserMiddleware', () => {
  let middleware: CurrentUserMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrentUserMiddleware],
    }).compile();

    middleware = module.get<CurrentUserMiddleware>(CurrentUserMiddleware);

    mockRequest = {
      user: {
        sub: 1,
        username: 'testuser',
        role: 'student',
        email: 'test@example.com',
        status: 1,
      },
    };

    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should convert JWT payload to UserPayload format', () => {
    middleware.use(
      mockRequest as Request & { user?: any },
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({
      id: 1,
      username: 'testuser',
      role: Role.STUDENT,
      email: 'test@example.com',
      status: 1,
    });
  });

  it('should handle missing optional fields', () => {
    mockRequest.user = {
      sub: 2,
      username: 'testuser2',
      role: 'teacher',
    };

    middleware.use(
      mockRequest as Request & { user?: any },
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({
      id: 2,
      username: 'testuser2',
      role: Role.TEACHER,
      email: '',
      status: 1,
    });
  });

  it('should not modify request if no user is present', () => {
    mockRequest.user = undefined;

    middleware.use(
      mockRequest as Request & { user?: any },
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.user).toBeUndefined();
  });
});
