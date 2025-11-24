# Project Overview

## Executive Summary

The Tay Training Prototype is a modern, full-stack web application designed for comprehensive training plan management and exercise organization. It enables users to create, organize, and manage structured workout programs with an intuitive, responsive interface backed by a robust database and secure authentication system.

---

## What the System Does

The application is a web-based training planning and exercise management platform that enables authenticated users to:

- **Organize Training Resources**: Centralize exercises, training methods, and grouped configurations with metadata management
- **Create Structured Workouts**: Build detailed workout sheets with exercise groupings, methods, and parameters
- **Plan Training Schedules**: Assemble multi-day/multi-week training schedules with reusable components
- **Track Activity**: Log interactions and build a foundation for future analytics
- **Manage Profiles**: Update personal information and training preferences

All data persists through a relational PostgreSQL database accessed via Prisma ORM, with a modern component-driven UI providing clear feedback through toasts, confirmations, and real-time animations.

---

## Main Purpose & Goals

### Primary Objectives

1. **Streamlined Workflow** - Provide an efficient, configurable interface for planning structured training programs
2. **Data Centralization** - Centralize exercise, method, and grouping metadata to reduce duplication and inconsistency
3. **Rapid Creation & Reuse** - Enable fast creation and reuse of workout sheets and schedules
4. **Progressive Refinement** - Support iterative improvements (editing sheets, adjusting schedules) without friction
5. **User Confidence** - Deliver responsive, accessible UI with immediate feedback on all actions
6. **Extensibility** - Maintain clean architecture for future features (analytics, coaching, role-based access)

### Strategic Goals

- Reduce training program setup time by 70% through template reuse
- Maintain data integrity through transaction-based operations
- Support future scaling with role-based authorization (trainer vs. athlete)
- Provide analytical foundation for activity metrics and progress tracking

---

## Primary Audience

### Current Users
- **Individual Trainees** - Seeking organized, personalized training plans
- **Coaches & Instructors** - Managing small cohorts with reusable exercise catalogs
- **Fitness Enthusiasts** - Iterating on strength or conditioning programs

### Potential Future Users
- **Coaching Organizations** - Multi-user, role-based management
- **Fitness Centers** - Multi-athlete management with trainer oversight
- **Personal Trainers** - Client-specific program generation and tracking

---

## Core Features

### 1. Exercise Management
- **Catalog System**: Create, read, update, delete exercises with metadata
- **Categorization**: Organize exercises by type, muscle group, or difficulty
- **Metadata**: Store variations, notes, and configurable parameters
- **Consistency**: Enforced through Prisma schema and API validation

### 2. Training Methods
- **Protocol Definition**: Define standardized training methodologies
- **Reusable Templates**: Store common training approaches (e.g., 3x8, 5x5 with rest periods)
- **Method Configuration**: Attach methods to exercises for consistency

### 3. Workout Sheet Management
- **Template Creation**: Build structured workout templates with exercise groupings
- **Autocomplete Support**: Smart search for exercises and methods
- **Advanced Filtering**: Filter sheets by category, date, or custom criteria
- **Batch Operations**: Create multiple sheets efficiently
- **Edit & Delete**: Modify or remove sheets with confirmation dialogs

### 4. Training Schedule Wizard
- **Multi-Step Interface**: 4-step guided process for schedule creation
- **Weekly Planning**: Configure 1-4 week plans with daily assignments
- **Workout Selection**: Choose exercises/methods for each day
- **Custom Naming**: Personalize workout names for client display
- **Visual Feedback**: Step indicators, loading states, and confirmation screens

### 5. User Authentication
- **Secure Login** - Credential-based authentication with bcrypt hashing
- **Session Management** - NextAuth.js v4 with persistent sessions
- **Password Recovery** - Forgot password flow with recovery codes
- **User Profiles** - Account information and preferences

### 6. User Experience
- **Dialog Components** - Reusable modals for creating/editing entities
- **Confirmation Dialogs** - Prevent accidental deletions
- **Toast Notifications** - Real-time feedback on all operations
- **Loading States** - Visual indicators during API requests
- **Animations** - Smooth transitions and motion effects with Framer Motion
- **Responsive Layout** - Mobile-first design with adaptive navigation

### 7. Data Tracking
- **Activity Logging** - Foundation for tracking user interactions
- **Event Recording** - Log create/update/delete operations
- **Future Analytics** - Basis for analytics dashboards and progress reports

---

## High-Level User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ACCESS & AUTHENTICATION                                      │
│  ├─ User lands on login page                                    │
│  ├─ Options: Login or Forgot Password                           │
│  └─ Successful auth → Establishes NextAuth session              │
├─────────────────────────────────────────────────────────────────┤
│ 2. DASHBOARD & NAVIGATION                                       │
│  ├─ Home page displays overview                                 │
│  ├─ Quick access buttons for main features                      │
│  └─ Recent activity shown in sidebar                            │
├─────────────────────────────────────────────────────────────────┤
│ 3. RESOURCE CATALOG EXPLORATION                                 │
│  ├─ Browse Exercises (filter by category/search)                │
│  ├─ Browse Training Methods                                     │
│  ├─ Add/Edit/Delete resources via dialogs                       │
│  └─ Activity tracked for each action                            │
├─────────────────────────────────────────────────────────────────┤
│ 4. WORKOUT SHEET CREATION                                       │
│  ├─ Create new workout sheet                                    │
│  ├─ Use autocomplete to select exercises                        │
│  ├─ Assign methods and parameters                               │
│  ├─ Save sheet with validation                                  │
│  └─ Sheet becomes available for schedule use                    │
├─────────────────────────────────────────────────────────────────┤
│ 5. SCHEDULE ASSEMBLY (WIZARD)                                   │
│  ├─ Step 1: Enter schedule name and description                 │
│  ├─ Step 2: Configure weekly plan (1-4 weeks)                   │
│  ├─ Step 3: Assign workout sheets to days                       │
│  ├─ Step 4: Customize names and review                          │
│  └─ Submit → Creates multi-day training plan                    │
├─────────────────────────────────────────────────────────────────┤
│ 6. ONGOING ITERATION                                            │
│  ├─ Edit existing sheets/schedules                              │
│  ├─ Add new exercises/methods                                   │
│  ├─ Adjust daily assignments                                    │
│  └─ Activity logged for all changes                             │
├─────────────────────────────────────────────────────────────────┤
│ 7. PERSISTENCE & FEEDBACK                                       │
│  ├─ All operations flow through API routes                      │
│  ├─ Prisma handles database transactions                        │
│  ├─ Toast notifications confirm success/failure                 │
│  └─ Loading bar shows request status                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture (High-Level)

### Frontend Layer
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript 5.5 for type safety
- **Styling**: Tailwind CSS with responsive design
- **Components**: Radix UI primitives styled with Tailwind
- **State Management**: Zustand for global UI state, React Query for server state
- **Animations**: Framer Motion for smooth transitions

### API Layer
- **Runtime**: Next.js API Routes (serverless functions)
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Standardized API response wrappers
- **Authentication**: NextAuth.js v4 middleware

### Data Layer
- **ORM**: Prisma 6.19.0 for type-safe database access
- **Database**: PostgreSQL for reliable data persistence
- **Relationships**: Properly configured foreign keys and cascading deletes
- **Transactions**: Atomic multi-step operations for data consistency

### Supporting Services
- **Authentication**: NextAuth.js with Prisma adapter
- **Hashing**: bcryptjs for secure password storage
- **API Client**: Centralized fetch wrapper with loading state integration
- **Utilities**: Activity tracking, date formatting, schema validation

---

## Assumptions & Scope

### Current Scope
- Single-user authentication with credential-based login
- Basic user profile management
- Central exercise and method catalog
- Template-based workout scheduling
- Activity logging foundation

### Future Extensibility Points
- **Multi-user Support**: Add role-based access (trainer, athlete, admin)
- **Analytics**: Enhanced activity tracking with progress metrics
- **Versioning**: Track historical changes to sheets and schedules
- **Coaching Features**: Trainer assignment, client management, progress monitoring
- **Data Export**: Generate PDF/CSV reports for offline use

### Known Limitations
See `LIMITATIONS_AND_KNOWN_ISSUES.md` for detailed technical debt items.

---

## System Requirements

### Minimum
- Node.js 18.x
- PostgreSQL 12.x
- 2GB RAM
- 2GB Disk Space

### Recommended
- Node.js 20.x LTS
- PostgreSQL 15.x
- 4GB+ RAM
- 4GB+ Disk Space

---

## Data Model Overview

```
User ──────────────────────┐
  ├── owns multiple        │
  │   Exercises            │
  │                        │
  ├── owns multiple        │
  │   ExerciseMethods      │
  │                        │
  ├── owns multiple        │
  │   ExerciseGroups       │
  │   ├── contains         │
  │   │   ExerciseMethods  │
  │   │   ├── contains     │
  │   │   │   ExerciseConfigurations
  │   │   │   ├── refs     │
  │   │   │   │   Exercise │
  │   │   │   └── refs     │
  │   │   │       ExerciseMethod
  │   │   └── refs Category
  │   │                    │
  │   └── used by          │
  │       TrainingDays     │
  │                        │
  ├── owns multiple        │
  │   TrainingSheets       │
  │   ├── contains         │
  │   │   TrainingDays     │
  │   │   └── refs         │
  │   │       ExerciseGroups
  │   │                    │
  │   └── ordered by  ─────┘
  │       createdAt
  │
  └── organizes
      Categories (used in filtering)
```

---

## Success Metrics

The application is considered successful when:

✅ Users can create comprehensive training plans in <5 minutes  
✅ All CRUD operations complete within <2 seconds  
✅ Schedule wizard completion rate >90%  
✅ Zero unhandled runtime errors  
✅ Mobile interface usable on screens <480px  
✅ Database queries consistently <100ms  
✅ Zero data loss in transactions  

---

## Related Documentation

For more detailed information, see:

- **`TECH_STACK.md`** - Detailed technology breakdown
- **`ARCHITECTURE_SUMMARY.md`** - System architecture and layers
- **`INSTALLATION_AND_RUNNING_GUIDE.md`** - Setup instructions
- **`API_DOCUMENTATION.md`** - API endpoint reference
- **`DATABASE_SCHEMA.md`** - Detailed database schema
- **`LIMITATIONS_AND_KNOWN_ISSUES.md`** - Known issues and technical debt
- **`FINAL_SUMMARY.md`** - Codebase assessment

---

**Last Updated**: November 24, 2025  
**Version**: 2.0 (Updated)  
**Status**: ✅ Current and Accurate
