# Architecture Summary

## Overview

The Tay Training Prototype is a full-stack Next.js web application with a modern, component-driven architecture. It combines a frontend UI layer, a backend API layer, and persistent data storage through Prisma ORM, enabling users to manage training plans, exercises, and schedules with a reactive, real-time feedback experience.

**Tech Stack:**
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **State Management:** Zustand (lightweight, hook-based)
- **Data Fetching:** TanStack React Query, custom API client
- **UI Components:** Radix UI primitives with Tailwind styling
- **Backend/API:** Next.js API routes (serverless functions)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth v4 with Prisma adapter
- **Forms & Validation:** React Hook Form, Zod schema validation

---

## Architectural Layers

### 1. **Presentation Layer (Frontend Components)**

Located in `src/components/` and `src/pages/`, this layer provides the user interface:

- **Layout Components** (`src/components/layout/`): Main scaffold (Drawer, Layout, LoadingBar)
- **Dialog/Modal Components** (`src/components/dialogs/`): Reusable modals for creating/editing entities (ExerciseDialog, MethodDialog, TrainingScheduleDialog_Wizard, WorkoutSheetDialog, ConfirmDialog)
- **Feature Pages** (`src/pages/`): Top-level pages (Exercises.tsx, Methods.tsx, TrainingSchedule.tsx, WorkoutSheets.tsx, Home.tsx)
- **UI Primitives** (`src/components/ui/`): Low-level Radix UI wrapper components (Button, Card, Dialog, Input, Select, etc.)
- **Auth Components** (`src/components/auth/`): LoginForm, ForgotPassword forms

**Key Principle:** Components use custom hooks and the API client to fetch/mutate data; they do not directly interact with Prisma.

---

### 2. **State Management Layer (Zustand + React Query)**

**Zustand Stores:**
- `useLoading` (`src/hooks/use-loading.ts`): Global loading state with request counter
  - Tracks concurrent API requests (increments on request start, decrements on completion)
  - Shared across all API calls via the `apiCall` utility
  - Consumed by `LoadingBar` component for visual feedback

**React Query (TanStack React Query):**
- Configured in `_app.tsx` as `QueryClientProvider`
- Handles server state caching, deduplication, and background refetching
- Provides hooks like `useQuery` and `useMutation` for data fetching and mutations

**Custom Hooks:**
- `use-pagination.ts`: Pagination state and utilities
- `use-mobile.tsx`: Mobile detection (responsive design)
- `use-workout-sheets-filter.ts`: Filtering logic for workout sheets
- `use-toast.ts`: Toast notification management

---

### 3. **API Client Layer (Data Access)**

**Main utility:** `src/lib/api-client.ts`

Provides a unified interface for all HTTP requests:

```typescript
// Core functions
- apiCall<T>(endpoint, config): Universal fetch wrapper
- apiGet<T>(endpoint): GET requests
- apiPost<T>(endpoint, body): POST requests (create)
- apiPut<T>(endpoint, body): PUT requests (update)
- apiDelete<T>(endpoint): DELETE requests
- apiPatch<T>(endpoint, body): PATCH requests (partial updates)
- apiGetMultiple<T>(endpoints): Parallel fetches
- fetchWithErrorHandling<T>(endpoint, onError): Fetch with error handling
```

**Integration with Loading State:**
- Every API call automatically triggers the Zustand loading store
- Supports `AbortSignal` for cleanup on component unmount
- Standardized response extraction (unwraps ApiResponse wrapper if needed)

---

### 4. **Business Logic Layer (Services)**

Located in `src/lib/`, service modules encapsulate domain logic:

**`training-sheet-service.ts`:**
- Provides CRUD operations for training sheets, days, exercise groups, methods, and configurations
- Key function: `createCompleteTrainingSheet()` – transactional creation of nested training sheet structures with deduplication
- Includes bulk operations with Prisma transactions to ensure data consistency

**`training-sheet-schema.ts`:**
- Zod validation schemas for training sheet payloads
- Ensures type safety at API boundaries

**Other Utilities:**
- `activity-tracker.ts`: Foundation for activity logging
- `server-auth.ts`: Server-side authentication utilities
- `simple-training-schedule.ts`: Schedule generation logic
- `auth-config.ts`: NextAuth configuration

---

### 5. **API Route Layer (Backend Endpoints)**

Located in `pages/api/`, these are Next.js serverless functions handling HTTP requests:

**Route Structure:**
```
pages/api/
  training-sheets/
    [id].ts          # GET/PUT/DELETE single sheet
    index.ts         # GET all / POST create
  training-schedule/
    workouts.ts      # Training schedule endpoints
  exercise-configurations/
    [id].ts          # CRUD exercise configurations
    index.ts
  exercise-groups/
    [id].ts          # CRUD exercise groups
    index.ts
  categories/
    index.ts         # Category operations
  user/
    profile.ts       # User profile endpoints
  auth/
    [...nextauth].ts # NextAuth authentication
  db/
    exercises/       # Exercise endpoints
    methods/         # Method endpoints
  init-db.ts         # Database initialization
```

**Pattern:**
- Request validation using Zod schemas
- Prisma service calls for data operations
- Standardized API responses (apiSuccess, apiError helpers)
- Error handling and HTTP status codes

**Example Flow (POST `/api/training-sheets`):**
```
HTTP Request
    ↓
Parse & Validate with Zod
    ↓
Call createCompleteTrainingSheet() service
    ↓
Transaction executes (create sheet, days, groups, methods, configs)
    ↓
Return apiSuccess(result)
    ↓
HTTP Response with data
```

---

### 6. **Data Persistence Layer (Prisma + PostgreSQL)**

**Prisma Schema** (`prisma/schema.prisma`):

Core entities:
- **User**: Credentials, profile, recovery code (NextAuth integration)
- **Exercise**: Exercise definitions with metadata
- **Method**: Training method protocols
- **ExerciseGroupCategory**: Categories for organizing exercise groups
- **ExerciseGroup**: Grouped exercises within a category
- **ExerciseMethod**: Method details for an exercise group (rest periods, order)
- **ExerciseConfiguration**: Specific series/reps for an exercise + method combo
- **TrainingSheet**: Named workout template
- **TrainingDay**: Day within a sheet, links to an exercise group
- **Menu**: Nutritional/meal plans (auxiliary)

**Relationships:**
```
User (1) ──── (many) Session [NextAuth]

ExerciseGroupCategory (1) ──── (many) ExerciseGroup
ExerciseGroup (1) ──── (many) ExerciseMethod (onDelete: Cascade)
ExerciseMethod (1) ──── (many) ExerciseConfiguration (onDelete: Cascade)
ExerciseConfiguration ──── ExerciseMethod [foreign key]
ExerciseConfiguration ──── Exercise [foreign key]
ExerciseConfiguration ──── Method [foreign key]

TrainingSheet (1) ──── (many) TrainingDay (onDelete: Cascade)
TrainingDay ──── TrainingSheet [foreign key]
TrainingDay ──── ExerciseGroup [foreign key]
```

**Migrations** (`prisma/migrations/`):
- `20251118133629_init`: Initial schema
- `20251118_add_default_category`: Added default category support
- `20251118_make_categoryid_nullable`: Made categoryId optional

---

## Page Components Overview

### Frontend Pages (`src/pages/` & `pages/`)

**Core Page Components:**

| Page | Purpose | Features |
|------|---------|----------|
| `Home.tsx` | Dashboard & Overview | Stats cards, recent activity, navigation |
| `Exercises.tsx` | Exercise Management | CRUD operations, search, filtering |
| `Methods.tsx` | Training Methods | Define & manage protocols |
| `WorkoutSheets.tsx` | Workout Template Management | Create/edit workout sheet templates |
| `TrainingSchedule.tsx` | Schedule Planning | Multi-step wizard for schedule creation |
| `login.tsx` | User Authentication | Credential-based login form |
| `forgot-password.tsx` | Password Recovery | Email-based recovery flow |
| `404.tsx` | Error Handling | Custom 404 page |

**New Component - Exercises Page**

The `Exercises.tsx` component provides full CRUD functionality for exercise management:

```typescript
Features:
- Real-time search across exercise names and descriptions
- Add new exercises with form validation
- Edit existing exercises inline or via dialog
- Delete exercises with confirmation
- Loading states during API calls
- Toast notifications for user feedback
- Mobile-responsive design
- Animation support via Framer Motion
- Authentication via server-side props

Key Hooks:
- useLoading() - Global loading state
- useToast() - Toast notifications
- useRouter() - Navigation

API Endpoints Used:
- GET /api/db/exercises - Fetch all exercises
- POST /api/exercises - Create new exercise
- PUT /api/exercises/[id] - Update exercise
- DELETE /api/exercises/[id] - Delete exercise
```

---

## Architectural Highlights

### 1. **User Interaction → Component**
User interacts with a React component (e.g., clicks "Create Workout Sheet").

### 2. **Component → Dialog / Form**
Dialog or form opens (via Radix UI primitives + Tailwind styling).

### 3. **Form Submission → Validation**
React Hook Form validates input against Zod schema.

### 4. **Validation → API Call**
If valid, component calls `apiPost()` or similar from the API client.

### 5. **Loading State → Visual Feedback**
API client increments Zustand loading counter → `LoadingBar` component animates.

### 6. **API Call → Server**
HTTP request sent to Next.js API route.

### 7. **Response → Component State**
Response received → component updates local/React Query state → UI re-renders.

### 8. **Feedback → User**
Toast notification displays success/error; dialog closes on success.

### 9. **Optional: Query Invalidation**
React Query may invalidate related queries to trigger background refetch (consistency).

**Example: Create Training Sheet**
```
User clicks "New Training Sheet"
    ↓
TrainingScheduleDialog_Wizard opens
    ↓
User fills multi-step form (sheet name, days, exercises)
    ↓
Form submitted, Zod validates structure
    ↓
apiPost('/api/training-sheets', payload)
    ↓
useLoading hook increments loadingCount
    ↓
LoadingBar animates (useLoading.isLoading = true)
    ↓
Server processes request
    ↓
Response returns created sheet with nested relations
    ↓
useLoading increments → decrements
    ↓
loadingCount = 0 → LoadingBar hides
    ↓
Toast shows "Training sheet created!"
    ↓
Dialog closes, page re-fetches sheets (or optimistic update)
```

---

## Server-Side Flow

### 1. **HTTP Request Received**
Next.js API route handler receives request (GET, POST, PUT, DELETE, PATCH).

### 2. **Request Extraction**
Route handler extracts query params, body, and headers.

### 3. **Validation**
Zod schema validates the request payload.

### 4. **Service Call**
Validated data passed to a service function (e.g., `createCompleteTrainingSheet()`).

### 5. **Prisma Transaction**
Service executes one or more Prisma operations within a transaction:
- Query existing data
- Create/update/delete records
- Maintain referential integrity
- All-or-nothing semantics (rollback on error)

### 6. **Database Operation**
Prisma translates operations to PostgreSQL queries and executes them.

### 7. **Response Assembly**
Result is wrapped in `apiSuccess()` or `apiError()`.

### 8. **HTTP Response Sent**
Route handler sends back JSON with appropriate status code.

**Example: POST `/api/training-sheets` (Create Training Sheet)**
```
HTTP POST /api/training-sheets
  Body: { name, publicName, trainingDays: [...] }
    ↓
Parse body, extract schema
    ↓
CreateTrainingSheetSchema.parse(req.body)
    ↓
Call createCompleteTrainingSheet(validatedData)
    ↓
Begin Prisma Transaction:
  1. Create TrainingSheet
  2. For each training day:
     - Query if ExerciseGroup exists (deduplication)
     - If exists: reuse; if not: create + methods + configs
     - Create TrainingDay linked to sheet and group
    ↓
Transaction commits (all-or-nothing)
    ↓
Return {sheet, days, groups, methods, configurations}
    ↓
res.status(201).json(apiSuccess(result))
    ↓
Client receives created sheet with all nested relations
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER / CLIENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           React Components (Pages + Dialogs)           │   │
│  │  • Home, Exercises, Methods, TrainingSchedule, etc.   │   │
│  │  • Dialog components for CRUD operations              │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↕ (events, props)                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Custom React Hooks                        │   │
│  │  • use-loading, use-pagination, use-toast             │   │
│  │  • use-workout-sheets-filter, use-mobile              │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↕ (state, data)                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Zustand (State) + React Query (Server State Cache)    │   │
│  │  • useLoading (global loading state)                  │   │
│  │  • QueryClient (data cache, deduplication)            │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↕ (fetch, mutate)                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         API Client (src/lib/api-client.ts)            │   │
│  │  • apiGet, apiPost, apiPut, apiDelete, apiPatch       │   │
│  │  • Standardized error handling & response extraction  │   │
│  │  • Auto-integration with useLoading                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↕ (HTTP)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Requests/Responses
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVER / API ROUTES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         API Route Handlers (pages/api/*)              │   │
│  │  • Extract & parse request (query, body)              │   │
│  │  • Validate with Zod schemas                          │   │
│  │  • Delegate to service functions                      │   │
│  │  • Return standardized API responses                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↕ (call)                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       Business Logic Services (src/lib/*)             │   │
│  │  • training-sheet-service.ts                          │   │
│  │  • activity-tracker.ts, auth-config.ts                │   │
│  │  • Encapsulate domain operations                      │   │
│  │  • Call Prisma client methods                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↕ (execute)                            │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         Prisma ORM (src/lib/prisma.ts)                │   │
│  │  • Generate & execute SQL queries                     │   │
│  │  • Type-safe data access                              │   │
│  │  • Handle transactions (ACID guarantees)              │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↕ (SQL)                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ SQL Queries/Results
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│  • users, exercises, methods, exercise_groups                  │
│  • exercise_group_categories, exercise_methods                 │
│  • exercise_configurations, training_sheets, training_days     │
│  • menus                                                        │
│  • Managed by Prisma migrations                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Patterns

### 1. **Unified API Client Pattern**
All HTTP calls route through `apiCall()`, ensuring:
- Consistent error handling
- Automatic loading state management
- Standardized response extraction
- Support for AbortSignal cleanup

### 2. **Service Layer Abstraction**
Business logic isolated in `src/lib/services/`:
- Decouples API routes from domain logic
- Enables reuse across multiple routes
- Facilitates testing and maintenance
- Clear contracts via TypeScript interfaces

### 3. **Zod Schema Validation**
Input validation at API boundaries:
- Catches invalid data early
- Type-safe after validation
- Clear error messages
- Reduces downstream bugs

### 4. **Prisma Transactions**
Multi-step operations wrapped in transactions:
- All-or-nothing semantics
- Automatic rollback on error
- Deduplication logic (check, reuse, create)
- Ensures referential integrity

### 5. **Zustand for Global State**
Minimal state management:
- Loading indicator (useLoading) – simple, reactive
- No Redux boilerplate
- Hook-based, easy to subscribe/unsubscribe
- Lightweight (~2KB)

### 6. **React Query for Server State**
Separates async server state from UI state:
- Automatic caching & deduplication
- Background refetch / staleness management
- Reduces boilerplate (no manual loading flags)
- Integrates seamlessly with React hooks

### 7. **Dialog-Driven UI**
Modal dialogs for CRUD operations:
- Non-blocking workflows
- Reusable across features
- Clear intent (create, edit, delete)
- Automatic form validation & feedback

---

## Extension Points

**Future Extensibility:**
1. **Role-Based Access Control (RBAC):** Extend `server-auth.ts` to check roles at API routes (coach vs. trainee).
2. **Activity Logging:** Leverage `activity-tracker.ts` to persist user actions (audit trail, analytics).
3. **Real-Time Updates:** Add WebSocket layer (e.g., Socket.io) to push changes to multiple users.
4. **File Uploads:** Extend API routes to handle PDF/image uploads (training schedules, exercise videos).
5. **Advanced Filtering & Search:** Enhance `use-workout-sheets-filter.ts` and API query params for complex queries.
6. **Caching Strategy:** Implement Redis/Memcached at the Prisma level for high-traffic queries.
7. **Analytics Dashboard:** Add charts/metrics using Recharts and new API endpoints.

---

## Summary

The architecture follows modern full-stack design principles:
- **Separation of Concerns:** Each layer (UI, state, API, service, data) has a clear responsibility.
- **Type Safety:** TypeScript + Zod + Prisma ensure compile-time and runtime type checking.
- **Scalability:** Service layer design enables feature additions without affecting routes.
- **User Experience:** Loading states, error handling, animations, and feedback prioritized throughout.
- **Performance:** Caching, deduplication, transaction batching, and connection pooling optimized.

---

**Last Updated**: November 24, 2025  
**Version**: 2.0 (Updated with Exercises component)  
**Status**: ✅ Current and Accurate
- **Scalability:** Service layer and transaction patterns support complex domain operations.
- **Developer Experience:** Clear file structure, reusable utilities, and consistent patterns reduce friction.
- **Maintainability:** Centralized API client, validation, and error handling make debugging and enhancements straightforward.

This foundation is designed to scale from a solo project to a multi-user SaaS application with minimal refactoring.
