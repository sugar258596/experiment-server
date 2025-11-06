# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **University Laboratory Reservation Management System** built with NestJS. The system provides digital laboratory management capabilities supporting student reservations, teacher reviews, and administrator management.

### Tech Stack

- **Framework**: NestJS 10.x
- **Database**: MySQL 8.0.x with TypeORM
- **Authentication**: JWT with bcryptjs
- **Validation**: class-validator & class-transformer
- **Language**: TypeScript

## Development Commands

### Starting the Application
```bash
# Development mode with hot reload
npm run start:dev

# Production build and start
npm run build
npm run start:prod
```

### Testing
```bash
# Run all tests
npm run test

# Watch mode for tests
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Code Quality
```bash
# Lint and auto-fix
npm run lint

# Format code with Prettier
npm run format
```

## Architecture

### Module Structure

The application uses a **modular architecture** with 9 main modules (src/app.module.ts:18-40):

1. **UserModule** - User management (students, teachers, admins)
2. **AuthModule** - Authentication & JWT token handling
3. **LabModule** - Laboratory information management
4. **InstrumentModule** - Equipment/仪器 management and applications
5. **AppointmentModule** - Laboratory reservation system
6. **NewsModule** - Laboratory announcements and updates
7. **NotificationModule** - User notifications
8. **FavoritesModule** - User favorites
9. **EvaluationModule** - Reviews and ratings

### Key Configuration

**Database** (src/config/mysl.config.ts):
- MySQL database with TypeORM
- Auto-sync enabled for development (synchronize: true)
- Entities auto-loaded
- Connection retry logic configured
- Timezone set to +08:00 (Asia/Shanghai)

**Environment Variables** (.env.example):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=lab_management
JWT_SECRET=your-secret-key-change-this-in-production
```

## Authentication Flow

The system implements JWT-based authentication (src/auth/auth.service.ts):

1. **Registration** (auth.service.ts:18): Username uniqueness check, bcrypt password hashing (10 rounds), user creation with role assignment
2. **Login** (auth.service.ts:55): User lookup, password validation, status verification, JWT token generation
3. **Token Structure**: Contains username, user ID (sub), and role

User roles: STUDENT, TEACHER, ADMIN

## Module Details

### Core Patterns

Each module follows NestJS best practices:
- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic
- **Entity**: TypeORM database models
- **DTOs**: Data transfer objects with validation

### User Management

User entity (src/user/entities/user.entity.ts) includes:
- Personal info (username, email, phone)
- Role-based access control
- Status tracking (ACTIVE, DISABLED)

### Laboratory & Appointments

The reservation workflow (src/appointment/):
- Students/teachers can make reservations
- Teachers can review/approve appointments
- Support for multiple time slots (morning/afternoon/evening)
- Status tracking (PENDING/APPROVED/REJECTED/COMPLETED/CANCELLED)

### Equipment Management (InstrumentModule)

Manages:
- Equipment/仪器 information
- Application processes for using equipment
- Repair requests and tracking
- Equipment status management

## Development Environment Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Configure database** (MySQL 8.0+):
   - Create database `lab_management`
   - Update `.env` with connection credentials
   - TypeORM will auto-sync entities in development

3. **Start development server**:
   ```bash
   npm run start:dev
   ```

## Testing

Test files follow the `.spec.ts` naming convention. Current test files:
- src/user/user.controller.spec.ts
- src/user/user.service.spec.ts
- src/app.controller.spec.ts

Run specific test files:
```bash
npm test -- user.service.spec.ts
```

## Important Notes

- Database synchronization is **enabled** for development (src/config/mysl.config.ts:15) - disable in production!
- Entities are auto-loaded by TypeORM (autoLoadEntities: true)
- JWT tokens include user role for authorization decisions
- All timestamps use Asia/Shanghai timezone (+08:00)
- Passwords are bcrypt hashed with 10 salt rounds
- The system follows RESTful API conventions

## API Structure

Controllers are organized by feature module:
- `/api/users` - User management
- `/api/auth` - Authentication
- `/api/labs` - Laboratory operations
- `/api/instruments` - Equipment management
- `/api/appointments` - Reservations
- `/api/news` - Announcements
- `/api/notifications` - Notifications
- `/api/favorites` - User favorites
- `/api/evaluations` - Reviews/ratings

## Troubleshooting

- **Database connection issues**: Check `.env` credentials, ensure MySQL is running
- **JWT errors**: Verify `JWT_SECRET` is set and consistent across environments
- **TypeORM sync issues**: In production, disable `synchronize: true` and use migrations
- **Module import errors**: Ensure all modules are registered in app.module.ts
