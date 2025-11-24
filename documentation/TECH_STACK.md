# Tech Stack

## Overview

The Tay Training Prototype uses a modern, full-stack JavaScript/TypeScript ecosystem optimized for rapid development, type safety, and scalability. Below is a detailed breakdown of each technology, its role, and its specific usage in the project.

---

## Frontend Framework & Runtime

### **Next.js 14**
**Version:** `^14.0.0`

**Purpose:** 
Next.js is the full-stack React framework that powers both the frontend UI and backend API routes. It provides server-side rendering, static generation, and serverless API capabilities.

**Specific Usage in Project:**
- **App & Pages Router:** The project uses the Pages Router (located in `pages/` directory) for route definitions
- **API Routes:** Serverless functions in `pages/api/` handle all backend logic (authentication, CRUD operations, data validation)
- **Server-Side Rendering:** Pages are rendered server-side for SEO and initial load performance
- **Image Optimization:** Automatic image optimization for production builds
- **Development Server:** `npm run dev` starts a local development server with hot reload
- **Build & Deployment:** `npm run build` bundles the app for production via `npm start`

**Key Files:**
- `next.config.js` – Next.js configuration
- `pages/_app.tsx` – Global app wrapper (providers setup)
- `pages/api/` – All backend endpoints

---

### **React 18**
**Version:** `^18.3.1`

**Purpose:** 
React is the UI library used to build interactive components. React 18 provides improved concurrency features, automatic batching, and new hooks.

**Specific Usage in Project:**
- **Component Model:** All pages and dialogs are React functional components using hooks
- **State Management:** Components use custom hooks (e.g., `useLoading`, `use-pagination`) and React Query for server state
- **Event Handlers:** Form submissions, button clicks, and user interactions trigger component state updates
- **Conditional Rendering:** Dialog visibility, loading states, and error messages use React conditionals
- **Lists & Keys:** Exercise, method, and training sheet lists use React keys for efficient re-rendering
- **Context API:** SessionProvider (NextAuth) wraps the app for authentication context

**Key Components:**
- `src/components/` – All React components (dialogs, forms, layouts)
- `src/pages/` – Top-level page components
- `src/hooks/` – Custom React hooks for shared logic

---

### **TypeScript 5.5.3**
**Version:** `^5.5.3`

**Purpose:** 
TypeScript adds static type checking to JavaScript, catching bugs at compile-time and improving developer experience with autocomplete and IDE support.

**Specific Usage in Project:**
- **Type Definitions:** All `.ts` and `.tsx` files are TypeScript
- **Props & State Types:** Component props, state, and hook return types are explicitly typed
- **API Contracts:** Request/response types defined via TypeScript interfaces and Zod schemas
- **Database Models:** Prisma generates TypeScript types from the schema
- **Form Validation:** Zod schemas provide runtime type checking + TypeScript type inference
- **Configuration Files:**
  - `tsconfig.json` – Compiler options (baseUrl, paths, strict mode disabled for flexibility)
  - `tsconfig.node.json` – Config for Node.js build tools

**Key Type Files:**
- `src/types/index.ts` – Shared types (ApiResponse, etc.)
- `next-auth.d.ts` – NextAuth type augmentation
- Every `.ts(x)` file includes types for functions, components, and data structures

---

## State Management & Data Fetching

### **Zustand 5.0.8**
**Version:** `^5.0.8`

**Purpose:** 
Zustand is a lightweight state management library for React. It provides global state without Redux boilerplate.

**Specific Usage in Project:**
- **Global Loading State:** `useLoading` store tracks API request count and loading flag
  - Located in `src/hooks/use-loading.ts`
  - Used by `LoadingBar` component to show visual feedback during API calls
  - Automatically incremented/decremented by the API client
  
**Store Definition:**
```typescript
interface LoadingStore {
  isLoading: boolean;
  loadingCount: number;
  startLoading: () => void;
  stopLoading: () => void;
}
```

**Integration:**
- Every API call via `apiCall()` increments `loadingCount`
- `LoadingBar` component subscribes to `useLoading()` and displays progress bar when `isLoading === true`
- Once all requests complete, loading bar hides

**Why Zustand?**
- Minimal bundle size (~2KB)
- Hook-based API (no class-based components)
- No provider boilerplate (though LoadingBar is wrapped by SessionProvider in `_app.tsx`)
- Excellent for global UI state (loading, toasts, modals)

---

### **TanStack React Query 5.56.2**
**Version:** `^5.56.2`

**Purpose:** 
React Query (now called TanStack Query) manages server state—data fetched from APIs. It handles caching, deduplication, synchronization, and background refetching.

**Specific Usage in Project:**
- **QueryClient Setup:** Initialized in `pages/_app.tsx` and wrapped via `QueryClientProvider`
- **Server State Caching:** Automatically caches API responses to avoid redundant fetches
- **Deduplication:** Multiple components requesting the same data only trigger one API call
- **Background Refetch:** Stale data is refetched silently in the background
- **Invalidation:** After mutations (create, update, delete), related queries can be invalidated to trigger refetch
- **Loading & Error States:** Built-in `isLoading`, `isError`, `data` properties for easy UI feedback

**Example Usage (in components):**
```typescript
// Fetch training sheets
const { data: sheets, isLoading } = useQuery({
  queryKey: ['training-sheets'],
  queryFn: () => apiGet('/training-sheets'),
});

// Create a training sheet
const { mutate: createSheet } = useMutation({
  mutationFn: (payload) => apiPost('/training-sheets', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['training-sheets'] });
  },
});
```

**Why React Query?**
- Reduces boilerplate (no manual state flags for loading, error, success)
- Automatic cache management
- Seamless integration with custom hooks
- Built-in support for pagination, infinite queries, dependent queries

---

## Backend & Database

### **Prisma 6.19.0**
**Version:** `^6.19.0`

**Purpose:** 
Prisma is an ORM (Object-Relational Mapping) that provides type-safe database access with an intuitive query API.

**Specific Usage in Project:**
- **Schema Definition:** `prisma/schema.prisma` defines all database tables (User, Exercise, Method, ExerciseGroup, TrainingSheet, TrainingDay, ExerciseConfiguration, ExerciseMethod, Menu)
- **Type Generation:** `@prisma/client` generates TypeScript types for all models (Exercise, User, TrainingSheet, etc.)
- **Database Client:** `src/lib/prisma.ts` exports a singleton Prisma client for use in API routes and services
- **CRUD Operations:** Services in `src/lib/` use Prisma methods:
  - `prisma.trainingSheet.create()` – Create
  - `prisma.trainingSheet.findUnique()` – Read
  - `prisma.trainingSheet.update()` – Update
  - `prisma.trainingSheet.delete()` – Delete
- **Relations:** Prisma handles joins automatically (e.g., fetching a training sheet with all nested training days)
- **Transactions:** `prisma.$transaction()` ensures multi-step operations are atomic (all-or-nothing)
- **Migrations:** `prisma/migrations/` tracks schema changes over time
  - `20251118133629_init` – Initial schema
  - `20251118_add_default_category` – Added default category
  - `20251118_make_categoryid_nullable` – Made categoryId optional

**Key Files:**
- `prisma/schema.prisma` – Schema definition
- `prisma/seed.ts` – Seeding script for initial data
- `src/lib/prisma.ts` – Prisma client singleton
- `src/lib/training-sheet-service.ts` – Service layer wrapping Prisma operations

**Example Usage:**
```typescript
// Fetch a training sheet with all nested relations
const sheet = await prisma.trainingSheet.findUnique({
  where: { id: 1 },
  include: {
    trainingDays: {
      include: {
        exerciseGroup: {
          include: {
            exerciseMethods: {
              include: {
                exerciseConfigurations: {
                  include: { exercise: true, method: true }
                }
              }
            }
          }
        }
      }
    }
  }
});

// Create within a transaction
const result = await prisma.$transaction(async (tx) => {
  const sheet = await tx.trainingSheet.create({ data: {...} });
  const day = await tx.trainingDay.create({ data: {...} });
  return { sheet, day };
});
```

---

### **PostgreSQL**
**Provider:** PostgreSQL database (version managed by hosting/Docker setup)

**Purpose:** 
PostgreSQL is the relational database that persistently stores all application data.

**Specific Usage in Project:**
- **Data Storage:** Stores users, exercises, methods, training sheets, schedules, and configuration data
- **Referential Integrity:** Foreign key constraints ensure data consistency (e.g., a TrainingDay cannot reference a non-existent TrainingSheet)
- **Transactions:** Supports ACID transactions for multi-step operations
- **Connection:** Connected via environment variable `DATABASE_URL` (in `.env`)
- **Migrations:** Prisma migrations generate and apply SQL schema changes

**Database URL:**
```
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
```

**Schema Highlights:**
- Tables use snake_case naming (e.g., `training_sheets`, `exercise_groups`)
- Timestamps: `created_at`, `updated_at` track entity lifecycle
- Enums: `ExerciseStatus` (ACTIVE, INACTIVE) enforces valid statuses
- Cascading deletes: Removing an exercise group cascades to its methods and configurations

---

## Styling & UI Components

### **Tailwind CSS 3.4.11**
**Version:** `^3.4.11`

**Purpose:** 
Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS, you compose styles using utility classes.

**Specific Usage in Project:**
- **Global Styles:** `src/index.css` imports Tailwind directives
- **Component Styling:** All components in `src/components/` use Tailwind classes
  - Examples: `bg-blue-500`, `text-white`, `p-4`, `flex`, `rounded-lg`, `shadow-md`
- **Responsive Design:** Mobile-first responsive classes (e.g., `md:flex`, `lg:grid`)
- **Dark Mode:** Tailwind dark mode is configured (via `next-themes`)
- **Theme Customization:** `tailwind.config.ts` extends default Tailwind theme
- **Plugins:** 
  - `@tailwindcss/typography` – Prose styles for rich text
  - `tailwindcss-animate` – Animation utilities
  - `tailwind-scrollbar-hide` – Hide scrollbars

**Configuration:**
```javascript
// tailwind.config.ts
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { /* custom theme */ },
  plugins: [require('tailwindcss-animate')],
};
```

**Benefits:**
- Faster CSS delivery (only used utilities included in build)
- Consistent spacing, colors, and typography across the app
- Easy maintenance (no naming conflicts or CSS specificity issues)
- Rapid prototyping and iteration

---

### **Shadcn UI**
**Status:** UI component library used (not explicitly in package.json, but inferred from component structure)

**Purpose:** 
Shadcn UI provides pre-built, customizable React components built on Radix UI primitives and styled with Tailwind CSS.

**Specific Usage in Project:**
- **Component Library:** `src/components/ui/` contains Shadcn components (Button, Card, Dialog, Input, Select, etc.)
- **Radix UI Foundation:** Shadcn wraps Radix UI accessibility primitives:
  - `@radix-ui/react-dialog` – Modal dialogs
  - `@radix-ui/react-select` – Custom select dropdowns
  - `@radix-ui/react-alert-dialog` – Confirmation dialogs
  - `@radix-ui/react-tabs` – Tab navigation
  - And 20+ other Radix UI components

**Example Components:**
```tsx
// src/components/ui/button.tsx
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' }
>(({ className, variant = 'default', ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
));

// Usage in components
<Button onClick={handleCreate}>Create Exercise</Button>
```

**Why Shadcn UI?**
- Headless components (you own the code, not vendor-locked)
- Fully accessible (built on Radix UI)
- Styled with Tailwind (easy to customize)
- No package dependency (copy-paste components into `src/components/ui/`)

---

### **Radix UI Components (20+ packages)**
**Versions:** `^1.1.0` to `^2.2.1`

**Purpose:** 
Radix UI provides unstyled, accessible UI primitives. Shadcn UI wraps these and applies Tailwind styling.

**Components Used:**
- `@radix-ui/react-dialog` – Modal/dialog foundation
- `@radix-ui/react-select` – Dropdown/select menus
- `@radix-ui/react-alert-dialog` – Confirmation prompts
- `@radix-ui/react-toast` – Toast notifications
- `@radix-ui/react-checkbox` – Checkboxes
- `@radix-ui/react-radio-group` – Radio buttons
- `@radix-ui/react-tabs` – Tab navigation
- `@radix-ui/react-accordion` – Collapsible sections
- `@radix-ui/react-dropdown-menu` – Dropdown menus
- `@radix-ui/react-popover` – Popover/tooltip
- `@radix-ui/react-tooltip` – Tooltips
- `@radix-ui/react-slider` – Sliders
- `@radix-ui/react-scroll-area` – Scrollable areas
- `@radix-ui/react-progress` – Progress bars
- `@radix-ui/react-label` – Form labels
- `@radix-ui/react-switch` – Toggle switches
- `@radix-ui/react-separator` – Visual dividers
- Plus others (aspect-ratio, avatar, context-menu, hover-card, menubar, navigation-menu, toggle, toggle-group)

**Accessibility Features:**
- ARIA labels, roles, and keyboard navigation built-in
- Screen reader support
- Focus management for modals and dropdowns

---

## Form Management & Validation

### **React Hook Form 7.53.0**
**Version:** `^7.53.0`

**Purpose:** 
React Hook Form reduces form boilerplate by managing form state, validation, and submission with minimal re-renders.

**Specific Usage in Project:**
- **Form Registration:** Components use `register()` to connect input fields to form state
- **Validation:** Integrated with Zod for schema-based validation
- **Submission Handling:** `handleSubmit()` validates and triggers submission
- **Error Display:** `formState.errors` provides validation error messages
- **Watch & Dynamic Fields:** `watch()` can trigger conditional rendering

**Example:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTrainingSheetSchema } from '@/lib/training-sheet-schema';

export function TrainingSheetForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(CreateTrainingSheetSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Sheet name" />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Create</button>
    </form>
  );
}
```

---

### **Zod 3.23.8**
**Version:** `^3.23.8`

**Purpose:** 
Zod is a TypeScript-first schema validation library. It provides runtime type checking and automatic TypeScript type inference.

**Specific Usage in Project:**
- **API Request Validation:** `src/lib/training-sheet-schema.ts` defines schemas for all inputs
- **Type Inference:** TypeScript types automatically inferred from schemas (no need to maintain separate types)
- **Client-Side Validation:** React Hook Form uses Zod for form validation
- **Server-Side Validation:** API routes parse incoming requests with Zod before processing

**Example Schemas:**
```typescript
// src/lib/training-sheet-schema.ts
import { z } from 'zod';

export const CreateTrainingSheetSchema = z.object({
  name: z.string().min(1, 'Sheet name is required'),
  publicName: z.string().optional(),
  slug: z.string().optional(),
  trainingDays: z.array(
    z.object({
      day: z.number().min(1),
      shortName: z.string().optional(),
      exerciseGroup: z.object({
        name: z.string(),
        categoryId: z.number().optional(),
        exerciseMethods: z.array(
          z.object({
            rest: z.string(),
            observations: z.string().optional(),
            exerciseConfigurations: z.array(
              z.object({
                series: z.string(),
                reps: z.string(),
                exerciseId: z.number(),
                methodId: z.number().optional(),
              })
            ),
          })
        ),
      }),
    })
  ),
});

// Type is automatically inferred
type CreateTrainingSheetInput = z.infer<typeof CreateTrainingSheetSchema>;
```

**Usage in API Route:**
```typescript
// pages/api/training-sheets/index.ts
const validatedData = CreateTrainingSheetSchema.parse(req.body);
// Now validatedData is type-safe and validated
```

---

## Authentication

### **NextAuth 4.24.13**
**Version:** `^4.24.13`

**Purpose:** 
NextAuth handles user authentication, session management, and credential-based login.

**Specific Usage in Project:**
- **Authentication Provider:** `SessionProvider` wraps the app in `pages/_app.tsx`
- **API Route:** `pages/api/auth/[...nextauth].ts` handles authentication logic
- **Session Management:** Users can log in with email/password, and sessions persist
- **Password Recovery:** Forgot password flow with recovery codes (stored in DB as `codeToRecovery`)
- **Type Augmentation:** `next-auth.d.ts` augments NextAuth types with custom user fields

**Configuration (in `pages/api/auth/[...nextauth].ts`):**
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Verify email/password against DB
        // Return user object or null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { /* ... */ },
    async session({ session, token }) { /* ... */ },
  },
};
```

### **@next-auth/prisma-adapter 1.0.7**
**Version:** `^1.0.7`

**Purpose:** 
Adapter that connects NextAuth to the Prisma database for session and user storage.

**Specific Usage:**
- Automatically creates `User`, `Account`, `Session`, `VerificationToken` tables (via Prisma migration)
- Stores sessions and user data persistently
- Enables multi-device session management

---

## Utilities & Libraries

### **bcryptjs 3.0.3**
**Version:** `^3.0.3`

**Purpose:** 
Hashing library for securely storing passwords in the database.

**Specific Usage:**
- **Password Hashing:** When a user registers or changes password, bcryptjs hashes it before storage
- **Password Verification:** During login, the entered password is hashed and compared to the stored hash
- **One-Way Function:** Bcrypt is intentionally slow, making brute-force attacks impractical

**Example Usage:**
```typescript
import bcrypt from 'bcryptjs';

// Hash password on registration
const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
await prisma.user.create({ data: { email, password: hashedPassword } });

// Verify on login
const user = await prisma.user.findUnique({ where: { email } });
const isValid = await bcrypt.compare(plainTextPassword, user.password);
```

---

### **Framer Motion 12.23.24**
**Version:** `^12.23.24`

**Purpose:** 
Framer Motion is a React animation library for smooth, performant animations and transitions.

**Specific Usage in Project:**
- **Motion Variants:** `src/lib/motion-variants.ts` defines reusable animation presets
- **Fade-in/Slide Animations:** Dialogs, pages, and list items animate on enter/exit
- **Gesture Animations:** Hover and tap animations for buttons and interactive elements
- **Transitions:** Smooth page transitions between routes

**Example Motion Variants (from `src/lib/motion-variants.ts`):**
```typescript
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export const slideInVariants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
  transition: { duration: 0.2 },
};
```

**Usage in Components:**
```tsx
import { motion } from 'framer-motion';
import { fadeInVariants } from '@/lib/motion-variants';

<motion.div {...fadeInVariants}>
  <ExerciseDialog />
</motion.div>
```

---

### **Sonner 1.5.0**
**Version:** `^1.5.0`

**Purpose:** 
Sonner provides an alternative toast notification system (lightweight alternative to Radix UI toast).

**Specific Usage:**
- **Toast Notifications:** Success, error, and info messages displayed as non-blocking toasts
- **Auto-Dismiss:** Toasts automatically disappear after a timeout
- **Customizable:** Can be styled with Tailwind classes

**Usage in Components:**
```typescript
import { toast } from 'sonner';

toast.success('Training sheet created!');
toast.error('Failed to save changes');
toast.loading('Saving...');
```

---

### **Recharts 2.12.7**
**Version:** `^2.12.7`

**Purpose:** 
Recharts is a charting library for React. Though not heavily used yet, it's included for future analytics/visualization features.

**Potential Usage:**
- Training progress charts
- Workout statistics and graphs
- Activity heatmaps

---

### **React Day Picker 8.10.1**
**Version:** `^8.10.1`

**Purpose:** 
Date picker component for calendar-based date selection.

**Specific Usage:**
- **Date Inputs:** Used in dialogs where users select training start dates
- **Accessible:** Keyboard navigation and screen reader support

---

### **Embla Carousel 8.3.0**
**Version:** `^8.3.0`

**Purpose:** 
Carousel/slider library for displaying lists in a scrollable carousel format.

**Potential Usage:**
- Exercise galleries
- Workout sheet carousel navigation

---

### **React Resizable Panels 2.1.3**
**Version:** `^2.1.3`

**Purpose:** 
Allows panels/sections to be resizable (drag-to-resize).

**Potential Usage:**
- Layout customization in exercise or training views
- Admin dashboards with adjustable panels

---

### **Date-fns 3.6.0**
**Version:** `^3.6.0`

**Purpose:** 
Utility library for date manipulation and formatting.

**Specific Usage:**
- **Date Formatting:** Convert timestamps to readable dates (e.g., "Nov 21, 2025")
- **Date Arithmetic:** Add days, calculate durations, etc.
- **Timezone Handling:** Parse and format dates with timezone awareness

**Example:**
```typescript
import { format, addDays } from 'date-fns';

format(new Date(), 'MMM dd, yyyy') // "Nov 21, 2025"
addDays(new Date(), 7) // One week from today
```

---

### **Class Variance Authority (CVA) 0.7.1**
**Version:** `^0.7.1`

**Purpose:** 
CVA helps manage component variants (e.g., primary button, secondary button) with type safety.

**Specific Usage:**
- **Button Variants:** Define primary, outline, ghost button styles
- **Component Composition:** Used in Shadcn UI components to manage styling variations

**Example:**
```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('px-4 py-2 rounded', {
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white',
      outline: 'border border-gray-300 text-gray-700',
    },
  },
});

// Usage: buttonVariants({ variant: 'primary' })
```

---

### **CLSX 2.1.1**
**Version:** `^2.1.1`

**Purpose:** 
Utility for conditionally joining classNames together.

**Specific Usage:**
- **Conditional Classes:** Combine Tailwind classes based on conditions
- **Simplifies:** Replaces ternary operators for class management

**Example:**
```typescript
import { clsx } from 'clsx';

const buttonClass = clsx(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
);
```

---

### **Tailwind Merge 2.5.2**
**Version:** `^2.5.2`

**Purpose:** 
Prevents conflicting Tailwind CSS classes when merging class strings.

**Specific Usage:**
- **Class Merging:** When combining component base classes with user-provided classes
- **Conflict Resolution:** `tailwind-merge` removes conflicting utilities

**Example:**
```typescript
import { twMerge } from 'tailwind-merge';

twMerge('px-4 px-8') // Result: 'px-8' (latest takes precedence)
```

---

### **Cmdk 1.0.0**
**Version:** `^1.0.0`

**Purpose:** 
Command palette component for fast keyboard-based navigation and search.

**Potential Usage:**
- Quick search for exercises
- Keyboard shortcuts for common actions
- Command palette for power users

---

### **Lucide React 0.462.0**
**Version:** `^0.462.0`

**Purpose:** 
Icon library with 1000+ customizable SVG icons.

**Specific Usage:**
- **UI Icons:** Navigation icons, action icons (delete, edit, create)
- **Semantic Icons:** Checkmarks, errors, warnings, info icons
- **Lightweight:** Tree-shakeable (only imported icons are bundled)

**Example:**
```tsx
import { CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';

<CheckCircle className="w-5 h-5 text-green-500" />
<Trash2 className="w-4 h-4 cursor-pointer" onClick={handleDelete} />
```

---

### **Input OTP 1.2.4**
**Version:** `^1.2.4`

**Purpose:** 
One-Time Password (OTP) input component for multi-factor authentication or recovery codes.

**Potential Usage:**
- 2FA setup
- Password recovery with verification codes

---

### **Next Themes 0.3.0**
**Version:** `^0.3.0`

**Purpose:** 
Theme management for dark/light mode switching.

**Specific Usage:**
- **Theme Provider:** Wraps app to enable theme context
- **Dark Mode:** `dark:` Tailwind classes respect theme selection
- **Persistence:** Theme preference saved to localStorage

**Usage:**
```tsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="light">
  <App />
</ThemeProvider>

// In components
import { useTheme } from 'next-themes';
const { theme, setTheme } = useTheme();
```

---

### **Vaul 0.9.3**
**Version:** `^0.9.3`

**Purpose:** 
Drawer component for mobile-friendly slide-out navigation.

**Specific Usage:**
- **Mobile Navigation:** Drawer replaces top navigation on small screens
- **Responsive Layout:** Uses `use-mobile` hook to conditionally render drawer vs. desktop nav

---

## Development Tools

### **ESLint 9.9.0 + TypeScript ESLint 8.0.1**
**Purpose:** 
Linting and code quality checks.

**Configuration:**
- `eslint.config.js` – ESLint configuration
- `@eslint/js` – ESLint core rules
- `typescript-eslint` – TypeScript-specific linting
- `eslint-plugin-react-hooks` – Enforces React hooks rules
- `eslint-plugin-react-refresh` – Ensures components are React refresh compatible

---

### **Prisma CLI 6.19.0**
**Purpose:** 
Tooling for Prisma migrations, schema management, and database operations.

**Commands:**
```bash
prisma migrate dev --name migration_name  # Create and apply migration
prisma db seed                            # Run seed script
prisma studio                             # Open GUI for database browsing
```

---

### **Tailwind CSS 3.4.11 (dev)**
**Dev Dependency** for build-time CSS generation.

---

### **PostCSS 8.4.47 + Autoprefixer 10.4.20**
**Purpose:** 
CSS processing pipeline for vendor prefixes and transformations.

---

## Summary Table

| Technology | Version | Role | Key Usage |
|------------|---------|------|-----------|
| Next.js | 14.x | Full-stack framework | Pages, API routes, SSR |
| React | 18.x | UI library | Components, hooks, state |
| TypeScript | 5.5.3 | Type system | All .ts/.tsx files |
| Prisma | 6.19.0 | ORM | Database queries, types |
| PostgreSQL | 12+ | Database | Data persistence |
| Tailwind CSS | 3.4.11 | Styling | Utility-first CSS classes |
| Radix UI | 1-2.x | UI primitives | Accessible component foundations |
| Shadcn UI | - | Component library | Pre-built, styled components |
| React Hook Form | 7.53.0 | Form state | Form validation & submission |
| React Query | 5.56.2 | Server state | API caching, deduplication |
| Zustand | 5.0.8 | State management | Global loading state |
| Zod | 3.23.8 | Validation | Schema validation |
| NextAuth | 4.24.13 | Authentication | Login, sessions, security |
| bcryptjs | 3.0.3 | Security | Password hashing |
| Framer Motion | 12.23.24 | Animations | Smooth transitions |
| Sonner | 1.5.0 | UI feedback | Toast notifications |
| Lucide React | 0.462.0 | Icons | UI icons (460+) |
| date-fns | 3.6.0 | Date utilities | Date formatting |
| Embla Carousel | 8.3.0 | Carousel | Scrollable lists |
| Next Themes | 0.3.0 | Dark mode | Theme switching |
| Vaul | 0.9.3 | Mobile drawer | Drawer navigation |
| Recharts | 2.12.7 | Charting | Future analytics |

---

## Recent Updates & Additions

### November 24, 2025
- ✅ Created `Exercises.tsx` component with full CRUD operations
- ✅ Added React import to `TrainingScheduleDialog_Wizard.tsx` (fixing compilation error)
- ✅ Added Eye icon button to Training Schedule list for future visualization feature
- ✅ Updated documentation to reflect new Exercises page

### Component Additions
The new `Exercises` component provides:
- Exercise listing with real-time search
- Add/Edit/Delete operations
- Category filtering
- Loading states and animations
- Toast notifications for user feedback
- Mobile-responsive design

---

**Last Updated**: November 24, 2025  
**Status**: ✅ Current and Accurate

