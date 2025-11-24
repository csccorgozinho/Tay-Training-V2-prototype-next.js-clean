# Folder Structure

This section describes the organization of the Tay Training Prototype codebase, including the purpose and contents of each major directory.

**Last Updated**: November 24, 2025  
**Status**: ✅ Current and Accurate

---

## Root Level Files

```
.env                          # Environment variables (DATABASE_URL, API keys, etc.)
.gitignore                    # Git ignore rules
package.json                  # Project dependencies and scripts
tsconfig.json                 # TypeScript compiler configuration
next.config.js                # Next.js configuration
tailwind.config.ts            # Tailwind CSS configuration
components.json               # Shadcn UI configuration
eslint.config.js              # ESLint rules configuration
postcss.config.js             # PostCSS configuration
bun.lockb                      # Bun package manager lock file
```

---

## `src/` – Source Code

The main source directory containing all application logic, components, and utilities.

### `src/components/` – React Components

Contains all reusable React components organized by functional area.

#### `src/components/ui/` – UI Primitives
Pre-built, styled UI components from Shadcn UI (Radix UI + Tailwind).

**Contents:**
- Button, Card, Dialog, Input, Select, TextArea, Checkbox, Radio, etc.
- These are low-level, reusable building blocks used throughout the application
- Each component is a wrapper around Radix UI primitives with Tailwind styling

**Purpose:** Provide a consistent, accessible component library for rapid development.

#### `src/components/layout/` – Application Layout
Components that structure the overall page layout and navigation.

**Key Files:**
- **`Layout.tsx`** – Main page wrapper
  - Manages navbar/drawer visibility based on authentication state
  - Includes protected route detection (`AUTHENTICATED_ROUTES`)
  - Passes children components to render inside the layout scaffold
  
- **`Navbar.tsx`** – Top navigation bar
  - Desktop navigation with links to main sections (Exercises, Methods, Training Schedule, etc.)
  - User profile menu and logout
  - Responsive: hidden on mobile, shown on desktop
  
- **`Drawer.tsx`** – Mobile side drawer
  - Slide-out navigation menu for mobile devices
  - Same navigation links as navbar but in a vertical layout
  - Controlled by hamburger menu toggle
  
- **`LoadingBar.tsx`** – Global progress indicator
  - Subscribes to `useLoading` Zustand store
  - Displays animated progress bar at top of page during API requests
  - Auto-hides when all requests complete

**Purpose:** Provide consistent navigation and layout structure across all pages.

#### `src/components/auth/` – Authentication Components
User authentication and credential management.

**Key Files:**
- **`LoginForm.tsx`** – Login form component
  - Email and password input fields
  - Form validation with React Hook Form + Zod
  - Handles sign-in flow
  
- **`ForgotPassword.tsx`** – Password recovery component
  - Email input to request recovery code
  - Recovery code verification
  - Password reset flow

**Purpose:** Handle user authentication UI and credential management.

#### `src/components/dialogs/` – Modal Dialogs
Dialog/modal components for CRUD operations and user workflows.

**Key Files:**
- **`ExerciseDialog.tsx`** – Create/edit exercise
  - Form for exercise name, description, video URL
  - Toggle for "has method" flag
  - Submit creates or updates exercise record
  
- **`MethodDialog.tsx`** – Create/edit training method
  - Form for method name and description
  - Used when defining training protocols
  
- **`TrainingScheduleDialog_Wizard.tsx`** – Multi-step training schedule creation
  - Step 1: Schedule name and details
  - Step 2: Select/create training days
  - Step 3: Assign exercise groups to days
  - Collects all data, then submits as nested payload to API
  
- **`WorkoutSheetDialog.tsx`** – Create/edit workout sheet
  - Form for sheet name, public name, slug
  - Includes training days configuration
  
- **`WorkoutSheetAutocomplete.tsx`** – Autocomplete component
  - Suggests workout sheets as user types
  - Used in forms to quickly select existing sheets
  
- **`CategoryFilterDialog.tsx`** – Filter by exercise category
  - Dropdown to select category
  - Filters displayed exercises/groups by selected category
  
- **`GroupSelectorBar.tsx`** – Exercise group selector
  - Displays available exercise groups
  - Allows selection for building workouts
  
- **`ConfirmDialog.tsx`** – Generic confirmation dialog
  - Reusable component for delete/destructive actions
  - "Are you sure?" prompt with cancel/confirm buttons

**Purpose:** Provide modal-based UI for creating, editing, and deleting domain entities.

#### `src/components/profile/` – User Profile Components
Components related to user profile and account management.

**Contents:**
- Profile display components
- Account settings forms
- Profile update handlers

**Purpose:** Manage user profile information and settings.

#### `src/components/examples/` – Example Components
Placeholder or example components for reference (likely not used in production).

**Purpose:** Serve as templates or reference implementations for new components.

---

### `src/pages/` – Top-Level Page Components
Page-level React components corresponding to routes (Next.js Pages Router).

**Key Files:**
- **`_app.tsx`** – Global app wrapper
  - Sets up providers (SessionProvider, QueryClientProvider, ThemeProvider)
  - Configures global state (Zustand, React Query)
  - Renders LoadingBar, Toaster, and SessionProvider for all pages
  - Defines global styles and contexts
  
- **`index.tsx`** – Home page (route: `/`)
  - Landing page, might redirect to login if unauthenticated
  
- **`login.tsx`** – Login page (route: `/login`)
  - Login form for user authentication
  
- **`forgot-password.tsx`** – Password recovery (route: `/forgot-password`)
  - Password reset form
  
- **`home.tsx`** – Home page (route: `/home`)
  - Dashboard after login
  - Overview and navigation entry points
  
- **`exercises.tsx`** – Exercises management (route: `/exercises`)
  - List of all exercises
  - Filter, search, create, edit, delete exercises
  - Uses ExerciseDialog component
  
- **`methods.tsx`** – Training methods management (route: `/methods`)
  - List of training methods
  - CRUD operations for methods
  - Uses MethodDialog component
  
- **`workout-sheets.tsx`** – Workout sheets management (route: `/workout-sheets`)
  - List of workout templates
  - Filter by category
  - Create/edit/delete sheets
  - Uses WorkoutSheetDialog component
  
- **`training-schedule.tsx`** – Training schedule creation (route: `/training-schedule`)
  - Multi-day schedule builder
  - Wizard-style dialog for guided creation
  - Uses TrainingScheduleDialog_Wizard component
  
- **`404.tsx`** – 404 Not Found page
  - Displayed when route doesn't exist

**Purpose:** Define application routes and top-level page layouts.

---

### `src/hooks/` – Custom React Hooks
Reusable logic extracted into custom hooks for state management and data fetching.

**Key Files:**
- **`use-loading.ts`** – Global loading state
  - Zustand store for tracking concurrent API requests
  - Exposes `isLoading` boolean and `loadingCount` number
  - Methods: `startLoading()`, `stopLoading()`
  - Used by LoadingBar to show/hide progress indicator
  
- **`use-mobile.tsx`** – Mobile device detection
  - Hook that returns boolean indicating if viewport is mobile-sized
  - Used for conditional rendering (drawer vs. navbar)
  - Subscribes to window resize events
  
- **`use-pagination.ts`** – Pagination logic
  - Manages paginated list state
  - Methods: `goToNextPage()`, `goToPreviousPage()`, `setCurrentPage()`
  - Returns `currentPageItems` for display
  - Tracks `currentPage`, `totalPages`
  
- **`use-toast.ts`** – Toast notification management
  - Hook for displaying toast messages
  - Methods: `showToast()`, `showSuccess()`, `showError()`
  - Integrates with Sonner or Radix UI toast system
  
- **`use-workout-sheets-filter.ts`** – Workout sheet filtering
  - Fetches categories and sheets from API
  - Filters sheets by selected category
  - Handles loading and error states
  - Methods: `setSelectedCategoryId()`, `refreshSheets()`

**Purpose:** Extract common state and side-effect logic into reusable hooks.

---

### `src/lib/` – Utilities and Services
Business logic, API client, database utilities, and helper functions.

**Key Files:**

#### Data Access & Services
- **`prisma.ts`** – Prisma ORM singleton
  - Exports single instance of Prisma client
  - Used by all API routes and server-side functions
  - Connection string from `DATABASE_URL` env var
  
- **`training-sheet-service.ts`** – Training sheet business logic
  - Service functions for CRUD operations on training sheets
  - Key function: `createCompleteTrainingSheet()` – transactional creation with nested relations
  - Deduplication logic to reuse exercise groups
  - Includes type definitions for inputs/outputs
  - Examples: `getTrainingSheetFull()`, `updateTrainingSheet()`, `deleteTrainingSheet()`
  
- **`activity-tracker.ts`** – Activity logging utility
  - Foundation for tracking user actions
  - Can log workout completions, exercise selections, etc.
  - Extensible for future analytics

#### API Communication
- **`api-client.ts`** – Unified HTTP client
  - Provides `apiGet()`, `apiPost()`, `apiPut()`, `apiDelete()`, `apiPatch()` functions
  - Automatic request/response transformation
  - Integrates with `useLoading` for global loading state
  - Supports `AbortSignal` for cleanup
  - Error handling with optional callbacks
  - Functions: `apiCall()`, `apiGetMultiple()`, `fetchWithErrorHandling()`
  
- **`api-response.ts`** – Standardized API response helpers
  - `apiSuccess<T>(data, meta?)` – Wrap successful responses
  - `apiError(message)` – Wrap error responses
  - Ensures consistent response format across all API routes
  - Response format: `{ success, data, error?, meta? }`

#### Validation & Configuration
- **`training-sheet-schema.ts`** – Zod validation schemas
  - `CreateTrainingSheetSchema` – Validates nested training sheet payloads
  - `UpdateTrainingSheetSchema` – Validates sheet updates
  - Type inference: `type CreateTrainingSheetInput = z.infer<typeof CreateTrainingSheetSchema>`
  - Used in API routes for input validation
  
- **`auth-config.ts`** – Authentication configuration
  - NextAuth setup and options
  - Callback functions for JWT and session management
  - Provider configurations (credentials, etc.)
  
- **`server-auth.ts`** – Server-side authentication utilities
  - Helper functions for session verification on API routes
  - Extracting user info from session

#### Utilities & Helpers
- **`utils.ts`** – General utility functions
  - String manipulation (slugify, camelCase, etc.)
  - Array/object helpers
  - Date/time utilities
  
- **`motion-variants.ts`** – Framer Motion animation presets
  - Reusable animation definitions (fadeIn, slideIn, etc.)
  - Standardizes animations across components
  - Example: `fadeInVariants`, `slideInVariants`
  
- **`simple-training-schedule.ts`** – Training schedule generation
  - Logic for creating training schedules from templates
  - Day sequencing and naming
  - Schedule template utilities

#### Subdirectories
- **`src/lib/auth/`** – Authentication modules
  - Possibly contains auth-related utilities (session helpers, JWT decode, etc.)

**Purpose:** Encapsulate business logic, API communication, validation, and utilities away from components.

---

### `src/types/` – TypeScript Type Definitions
Centralized type definitions for the entire application.

**Key File:**
- **`index.ts`** – Main types file
  - **Entity Types:** Exercise, Method, ExerciseGroup, ExerciseConfiguration, ExerciseMethod, TrainingSheet, TrainingDay, Category
  - **UI Component Types:** DialogProps, EditableDialogProps, WorkoutSheetTransformed
  - **API Types:** ApiResponse<T>, ApiErrorResponse
  - **Hook Return Types:** UsePaginationResult<T>, UseWorkoutSheetsFilterResult
  - All types derived from Prisma schema or API contracts
  - Enables type-safe component props and API calls

**Purpose:** Define shared TypeScript types and interfaces used across components and services.

---

### `src/config/` – Application Configuration
Global configuration constants.

**Key File:**
- **`constants.ts`** – Global constants
  - API endpoints
  - Default values
  - Enums (exercise status, user roles, etc.)
  - Feature flags

**Purpose:** Centralize configuration and constants for easy modification.

---

## `pages/api/` – Backend API Routes

Next.js API routes (serverless functions) handling all backend logic. Each file corresponds to an HTTP endpoint.

```
pages/api/
├── auth/
│   └── [...nextauth].ts           # NextAuth authentication endpoints
├── user/
│   └── profile.ts                 # User profile endpoints (GET/PUT)
├── categories/
│   └── index.ts                   # Exercise category CRUD
├── exercise-groups/
│   ├── index.ts                   # List/create exercise groups
│   └── [id].ts                    # Get/update/delete specific group
├── exercise-configurations/
│   ├── index.ts                   # List/create exercise configurations
│   └── [id].ts                    # Get/update/delete specific config
├── training-sheets/
│   ├── index.ts                   # List/create training sheets (main CRUD)
│   └── [id].ts                    # Get/update/delete specific sheet
├── training-schedule/
│   └── workouts.ts                # Training schedule operations
├── db/
│   ├── exercises/                 # Exercise endpoints
│   └── methods/                   # Method endpoints
├── init-db.ts                     # Database initialization endpoint
└── workout-sheets.ts              # Workout sheet operations
```

**Pattern:**
Each endpoint file exports a `handler` function accepting `NextApiRequest` and `NextApiResponse`:
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') { /* ... */ }
  else if (req.method === 'POST') { /* ... */ }
  else if (req.method === 'PUT') { /* ... */ }
  else if (req.method === 'DELETE') { /* ... */ }
}
```

**General Flow:**
1. Extract and parse request (body, query params)
2. Validate with Zod schema
3. Call service function (from `src/lib/`)
4. Return standardized API response (`apiSuccess` or `apiError`)
5. Handle errors with proper HTTP status codes

**Purpose:** Provide backend API endpoints for CRUD operations and business logic.

---

## `prisma/` – Database Configuration

Contains Prisma ORM schema and migrations.

### `prisma/schema.prisma` – Database Schema
Prisma schema defining all database tables and relationships.

**Key Sections:**
- **Generator & DataSource:**
  - `generator client` – Generates TypeScript types from schema
  - `datasource db` – PostgreSQL connection via `DATABASE_URL` env var

- **Core Models:**
  - `User` – User accounts with email, password, recovery code
  - `Menu` – Nutritional/meal plans
  - `Exercise` – Exercise definitions
  - `Method` – Training method protocols
  - `ExerciseGroupCategory` – Categories for organizing exercise groups
  - `ExerciseGroup` – Grouped exercises
  - `ExerciseMethod` – Method details within a group
  - `ExerciseConfiguration` – Specific series/reps for exercise + method combo
  - `TrainingSheet` – Workout template
  - `TrainingDay` – Day within a sheet

- **Relationships:**
  - ExerciseGroupCategory (1) → (many) ExerciseGroup
  - ExerciseGroup (1) → (many) ExerciseMethod
  - ExerciseMethod (1) → (many) ExerciseConfiguration
  - TrainingSheet (1) → (many) TrainingDay
  - TrainingDay → ExerciseGroup

**Purpose:** Define the complete database schema and type system.

---

### `prisma/migrations/` – Schema Migrations

Directory of SQL migration files tracking schema changes over time.

**Key Migrations:**
- **`20251118133629_init/`** – Initial schema creation
  - Creates all base tables and relationships
  - Establishes constraints and enums
  
- **`20251118_add_default_category/`** – Added default category support
  - Introduced default category functionality
  
- **`20251118_make_categoryid_nullable/`** – Made categoryId optional
  - Changed categoryId from required to nullable field

**Purpose:** Track and apply incremental schema changes in a version-controlled manner.

---

### `prisma/seed.ts` – Database Seeding Script

Script to populate database with initial/sample data.

**Purpose:**
- Initialize database with default exercises, methods, and categories
- Populate test data for development
- Run with `npm run seed` or `prisma db seed`

---

## `public/` – Static Assets

Public files served directly without processing.

**Typical Contents:**
- **Images** – Logos, icons, background images
- **Favicons** – Browser tab icon (favicon.ico)
- **Robots.txt** – SEO crawler instructions
- **Manifests** – PWA web app manifest

**Purpose:** Serve static files directly to clients (images, fonts, etc.).

---

## `.next/` – Build Output (Generated)

Auto-generated Next.js build directory (not committed to git).

**Contents:**
- `.next/server/` – Compiled API routes and server-side code
- `.next/static/` – Bundled client-side JavaScript, CSS, static assets
- `.next/cache/` – Build cache for faster rebuilds

**Purpose:** Production-ready compiled application.

---

## `types/` – Global Type Definitions (Root Level)

Optional root-level TypeScript types directory (if used alongside `src/types/`).

**Purpose:** Global types accessible across entire codebase.

---

## Directory Tree (Complete Overview)

```
tay-training-prototype/
├── src/
│   ├── components/
│   │   ├── ui/                          # Shadcn UI components (Button, Dialog, etc.)
│   │   ├── layout/
│   │   │   ├── Layout.tsx               # Main page wrapper
│   │   │   ├── Navbar.tsx               # Top navigation
│   │   │   ├── Drawer.tsx               # Mobile navigation
│   │   │   └── LoadingBar.tsx           # Global progress indicator
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── dialogs/
│   │   │   ├── ExerciseDialog.tsx
│   │   │   ├── MethodDialog.tsx
│   │   │   ├── WorkoutSheetDialog.tsx
│   │   │   ├── TrainingScheduleDialog_Wizard.tsx
│   │   │   ├── CategoryFilterDialog.tsx
│   │   │   ├── GroupSelectorBar.tsx
│   │   │   ├── WorkoutSheetAutocomplete.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── profile/
│   │   └── examples/
│   ├── pages/
│   │   ├── Exercises.tsx                # Exercises page logic
│   │   ├── Methods.tsx                  # Methods page logic
│   │   ├── Home.tsx                     # Home page logic
│   │   ├── TrainingSchedule.tsx         # Training schedule logic
│   │   └── WorkoutSheets.tsx            # Workout sheets logic
│   ├── hooks/
│   │   ├── use-loading.ts               # Global loading state (Zustand)
│   │   ├── use-mobile.tsx               # Mobile detection
│   │   ├── use-pagination.ts            # Pagination logic
│   │   ├── use-toast.ts                 # Toast management
│   │   └── use-workout-sheets-filter.ts # Workout sheets filtering
│   ├── lib/
│   │   ├── prisma.ts                    # Prisma client singleton
│   │   ├── api-client.ts                # Unified HTTP client
│   │   ├── api-response.ts              # Response helpers
│   │   ├── training-sheet-service.ts    # Training sheet CRUD logic
│   │   ├── training-sheet-schema.ts     # Zod validation schemas
│   │   ├── auth-config.ts               # NextAuth configuration
│   │   ├── server-auth.ts               # Server-side auth utilities
│   │   ├── activity-tracker.ts          # Activity logging
│   │   ├── motion-variants.ts           # Framer Motion presets
│   │   ├── simple-training-schedule.ts  # Schedule generation
│   │   ├── utils.ts                     # General utilities
│   │   └── auth/                        # Auth-related modules
│   ├── types/
│   │   └── index.ts                     # Shared type definitions
│   ├── config/
│   │   └── constants.ts                 # Global constants
│   └── index.css                        # Global styles
├── pages/
│   ├── _app.tsx                         # Global app wrapper
│   ├── index.tsx                        # Home route (/)
│   ├── login.tsx                        # Login page
│   ├── forgot-password.tsx              # Password recovery
│   ├── home.tsx                         # Dashboard (/home)
│   ├── exercises.tsx                    # Exercises page
│   ├── methods.tsx                      # Methods page
│   ├── workout-sheets.tsx               # Workout sheets page
│   ├── training-schedule.tsx            # Training schedule page
│   ├── 404.tsx                          # 404 Not Found page
│   └── api/
│       ├── auth/[...nextauth].ts        # NextAuth endpoints
│       ├── user/profile.ts              # User profile endpoints
│       ├── categories/index.ts          # Category CRUD
│       ├── exercise-groups/             # Exercise group endpoints
│       ├── exercise-configurations/     # Exercise config endpoints
│       ├── training-sheets/             # Training sheet endpoints
│       ├── training-schedule/workouts.ts# Training schedule ops
│       ├── db/                          # Database endpoints
│       ├── init-db.ts                   # DB initialization
│       └── workout-sheets.ts            # Workout sheet ops
├── prisma/
│   ├── schema.prisma                    # Database schema
│   ├── seed.ts                          # Seeding script
│   └── migrations/                      # Schema migrations
│       ├── 20251118133629_init/
│       ├── 20251118_add_default_category/
│       └── 20251118_make_categoryid_nullable/
├── public/                              # Static assets
├── .next/                               # Build output (generated)
├── package.json                         # Dependencies & scripts
├── tsconfig.json                        # TypeScript config
├── next.config.js                       # Next.js config
├── tailwind.config.ts                   # Tailwind config
├── eslint.config.js                     # ESLint config
├── postcss.config.js                    # PostCSS config
└── .env                                 # Environment variables
```

---

## File Naming Conventions

- **Components:** PascalCase (e.g., `ExerciseDialog.tsx`, `LoadingBar.tsx`)
- **Hooks:** kebab-case prefix with `use-` (e.g., `use-loading.ts`, `use-pagination.ts`)
- **Services:** kebab-case with `-service` suffix (e.g., `training-sheet-service.ts`)
- **Schemas:** kebab-case with `-schema` suffix (e.g., `training-sheet-schema.ts`)
- **Utilities:** kebab-case (e.g., `motion-variants.ts`, `api-client.ts`)
- **Pages:** lowercase (e.g., `exercises.tsx`, `login.tsx`)
- **API Routes:** kebab-case segments (e.g., `/api/training-sheets`, `/api/exercise-groups/[id]`)

---

## Key Principles

1. **Component Isolation:** UI components in `src/components/`, page logic in `pages/`, business logic in `src/lib/`
2. **Reusability:** Hooks in `src/hooks/`, utilities in `src/lib/`, types in `src/types/`
3. **Separation of Concerns:** Each file has a single responsibility
4. **Type Safety:** Shared types in `src/types/`, validation schemas in `src/lib/`
5. **Configuration Centralization:** Constants in `src/config/`, Prisma setup in `prisma/`

This structure scales well from a solo project to a multi-developer team, enabling rapid feature development while maintaining code quality and maintainability.
