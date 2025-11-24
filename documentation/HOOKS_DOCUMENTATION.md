# Hooks Documentation

This section provides comprehensive documentation for all custom React hooks in the Tay Training application. These hooks encapsulate reusable logic for state management, pagination, filtering, and UI utilities.

**Last Updated**: November 24, 2025  
**Status**: ✅ Current and Accurate

---

## Overview

The application includes 5 custom hooks, each serving a specific purpose:

| Hook | Purpose | Type |
|------|---------|------|
| `useLoading` | Global loading state management | Zustand Store |
| `usePagination` | Paginated data handling | React Hook |
| `useWorkoutSheetsFilter` | Workout sheets filtering and fetching | React Hook |
| `useIsMobile` | Responsive mobile detection | React Hook |
| `useToast` | Toast notifications system | Custom Implementation |

---

## useLoading

### Purpose

Manages a global loading state that supports multiple concurrent loading operations. Uses a counter-based approach to track loading progress, ensuring the UI remains in a loading state as long as any async operation is pending.

### Implementation

- **Store Type:** Zustand store
- **Pattern:** Singleton pattern (global state)
- **Counter-based:** Increments on start, decrements on stop
- **Auto-reset:** Automatically sets `isLoading` to false when count reaches 0

### API

```typescript
interface LoadingStore {
  isLoading: boolean;           // True if any operation is loading
  loadingCount: number;         // Number of concurrent operations
  startLoading: () => void;     // Increment loading counter
  stopLoading: () => void;      // Decrement loading counter
}
```

### Parameters

None - the hook accesses global state created with Zustand.

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isLoading` | boolean | True if any loading operation is active |
| `loadingCount` | number | Number of concurrent loading operations |
| `startLoading` | function | Increment the loading counter |
| `stopLoading` | function | Decrement the loading counter (prevents negative values) |

### How It Works

1. **Start Loading:** When `startLoading()` is called, the loading counter increments and `isLoading` becomes true
2. **Multiple Operations:** Each async operation calls `startLoading()` independently
3. **Stop Loading:** When `stopLoading()` is called, the counter decrements
4. **Auto-Reset:** When counter reaches 0, `isLoading` automatically becomes false
5. **Safety:** Counter never goes below 0 (clamped using `Math.max`)

### Example Usage

```typescript
import { useLoading } from '@/hooks/use-loading';

export function MyComponent() {
  const { isLoading, startLoading, stopLoading } = useLoading();

  const fetchData = async () => {
    startLoading();
    try {
      const response = await fetch('/api/data');
      // ... handle response
    } finally {
      stopLoading();
    }
  };

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      <button onClick={fetchData} disabled={isLoading}>
        Load Data
      </button>
    </div>
  );
}
```

### Multiple Concurrent Operations

```typescript
const { isLoading, startLoading, stopLoading } = useLoading();

const fetchMultiple = async () => {
  startLoading(); // count = 1
  startLoading(); // count = 2
  
  try {
    const [exercises, methods] = await Promise.all([
      fetch('/api/db/exercises'),
      fetch('/api/db/methods'),
    ]);
    // ...
  } finally {
    stopLoading(); // count = 1
    stopLoading(); // count = 0, isLoading = false
  }
};
```

### UI Loading Indicators

```typescript
export function Page() {
  const { isLoading } = useLoading();

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      {/* Page content */}
    </div>
  );
}
```

---

## usePagination

### Purpose

Provides generic pagination functionality for arrays of data. Automatically resets to the first page when a search dependency changes, making it ideal for paginated search results.

### Implementation

- **Generic:** Works with any data type `<T>`
- **Page-based:** Divides items into fixed-size pages
- **Auto-reset:** Resets to page 1 when `searchDependency` changes
- **Boundaries:** Navigation functions prevent going beyond page limits

### API

```typescript
interface UsePaginationProps<T> {
  items: T[];              // Array of items to paginate
  itemsPerPage: number;    // Number of items per page
  searchDependency?: any;  // Optional: reset page when this changes
}

interface UsePaginationResult<T> {
  currentPage: number;           // Current page number (1-based)
  totalPages: number;            // Total number of pages
  currentPageItems: T[];         // Items on the current page
  goToNextPage: () => void;      // Navigate to next page
  goToPreviousPage: () => void;  // Navigate to previous page
  setCurrentPage: (page: number) => void;  // Jump to specific page
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | T[] | Yes | Array of items to paginate |
| `itemsPerPage` | number | Yes | Number of items per page (e.g., 12) |
| `searchDependency` | any | No | Value that triggers page reset when changed |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `currentPage` | number | Current page (1-based indexing) |
| `totalPages` | number | Total pages available |
| `currentPageItems` | T[] | Items on the current page |
| `goToNextPage` | function | Move to next page (if not on last page) |
| `goToPreviousPage` | function | Move to previous page (if not on first page) |
| `setCurrentPage` | function | Jump to specific page number |

### How It Works

1. **Initialization:** State tracks current page (starts at 1)
2. **Auto-Reset:** When `searchDependency` changes, page resets to 1
3. **Calculation:** Total pages = `Math.ceil(items.length / itemsPerPage)`
4. **Slice:** Current items = `items.slice(startIndex, startIndex + itemsPerPage)`
5. **Navigation:** Next/Previous prevent out-of-bounds navigation

### Example Usage - Basic

```typescript
import { usePagination } from '@/hooks/use-pagination';

export function ExercisesList({ exercises }) {
  const {
    currentPage,
    totalPages,
    currentPageItems,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage,
  } = usePagination({
    items: exercises,
    itemsPerPage: 12,
  });

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {currentPageItems.map(exercise => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={goToPreviousPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Example Usage - With Search

```typescript
export function SearchableExercises({ allExercises }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter exercises based on search
  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination resets to page 1 when searchTerm changes
  const {
    currentPageItems,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
  } = usePagination({
    items: filteredExercises,
    itemsPerPage: 12,
    searchDependency: searchTerm,  // Reset page when search changes
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search exercises..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-4">
        {currentPageItems.map(exercise => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={goToNextPage}
        onPrevious={goToPreviousPage}
      />
    </div>
  );
}
```

### Example Usage - Jump to Page

```typescript
export function PaginatedMethods() {
  const methods = useAllMethods();
  const { currentPageItems, totalPages, setCurrentPage } = usePagination({
    items: methods,
    itemsPerPage: 20,
  });

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className="px-3 py-1"
          >
            {i + 1}
          </button>
        ))}
      </div>

      {currentPageItems.map(method => (
        <MethodItem key={method.id} method={method} />
      ))}
    </div>
  );
}
```

---

## useWorkoutSheetsFilter

### Purpose

Manages fetching and filtering of workout sheets (exercise groups) by category. Combines data fetching, category selection, and error handling in a single reusable hook.

### Implementation

- **Dual Fetching:** Fetches both categories and workout sheets
- **Cascading:** Sheet fetching depends on selected category
- **Automatic Refresh:** Provides refresh function to re-fetch data
- **Error Handling:** Captures and exposes loading/error states

### API

```typescript
export interface Category {
  id: number;
  name: string;
}

export interface WorkoutSheet {
  id: number;
  name: string;
  publicName: string | null;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  exerciseMethods?: any[];
}

interface UseWorkoutSheetsFilterResult {
  sheets: WorkoutSheet[];              // Fetched workout sheets
  categories: Category[];              // Available categories
  selectedCategoryId: number | null;   // Currently selected category
  isLoading: boolean;                  // Loading state
  error: string | null;                // Error message if any
  setSelectedCategoryId: (categoryId: number | null) => void;  // Update category filter
  refreshSheets: () => void;           // Re-fetch sheets
}
```

### Parameters

None - the hook manages its own state and fetching.

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `sheets` | WorkoutSheet[] | Array of workout sheets (exercise groups) |
| `categories` | Category[] | Array of available categories |
| `selectedCategoryId` | number \| null | Currently selected category ID or null |
| `isLoading` | boolean | True while fetching data |
| `error` | string \| null | Error message if fetch failed |
| `setSelectedCategoryId` | function | Update selected category and re-fetch sheets |
| `refreshSheets` | function | Manually trigger sheet refresh |

### How It Works

1. **Mount:** On component mount, fetches categories from `/api/categories`
2. **Category Change:** When `selectedCategoryId` changes, fetches sheets from `/api/exercise-groups?categoryId=X`
3. **Fallback:** If no category selected, fetches all sheets from `/api/exercise-groups`
4. **Error Handling:** Catches errors and sets error state; empty array as fallback
5. **Manual Refresh:** `refreshSheets()` increments refresh trigger to re-fetch current category

### API Endpoints Used

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/api/categories` | Fetch all categories | None |
| `/api/exercise-groups` | Fetch all sheets or filtered | `categoryId` (optional) |

### Example Usage - Basic

```typescript
import { useWorkoutSheetsFilter } from '@/hooks/use-workout-sheets-filter';

export function WorkoutSheetSelector() {
  const {
    sheets,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    isLoading,
    error,
  } = useWorkoutSheetsFilter();

  return (
    <div>
      {error && <div className="text-red-500">{error}</div>}

      <select
        value={selectedCategoryId ?? 'all'}
        onChange={(e) => setSelectedCategoryId(
          e.target.value === 'all' ? null : parseInt(e.target.value)
        )}
      >
        <option value="all">All Categories</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {isLoading && <Spinner />}

      <div className="grid gap-4">
        {sheets.map(sheet => (
          <SheetCard key={sheet.id} sheet={sheet} />
        ))}
      </div>
    </div>
  );
}
```

### Example Usage - With Refresh

```typescript
export function WorkoutSheetManager() {
  const {
    sheets,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    refreshSheets,
    isLoading,
  } = useWorkoutSheetsFilter();

  const handleCreateSheet = async (newSheet) => {
    try {
      const response = await fetch('/api/exercise-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSheet),
      });

      if (response.ok) {
        // Re-fetch sheets to show newly created item
        refreshSheets();
      }
    } catch (error) {
      console.error('Failed to create sheet:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Workout Sheets</h2>
        <button
          onClick={refreshSheets}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <CategoryFilter
        categories={categories}
        selected={selectedCategoryId}
        onChange={setSelectedCategoryId}
      />

      <div className="grid gap-4">
        {sheets.map(sheet => (
          <SheetCard
            key={sheet.id}
            sheet={sheet}
            onUpdate={refreshSheets}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example Usage - Cascading Filters

```typescript
export function AdvancedWorkoutFilter() {
  const {
    sheets,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
  } = useWorkoutSheetsFilter();

  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);

  // When category changes, reset sheet selection
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSheetId(null);
  };

  const selectedSheet = sheets.find(s => s.id === selectedSheetId);

  return (
    <div className="space-y-4">
      <div>
        <label>Category</label>
        <select
          value={selectedCategoryId ?? 'all'}
          onChange={(e) => handleCategoryChange(
            e.target.value === 'all' ? null : parseInt(e.target.value)
          )}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Workout Sheet</label>
        <select
          value={selectedSheetId ?? ''}
          onChange={(e) => setSelectedSheetId(
            e.target.value ? parseInt(e.target.value) : null
          )}
        >
          <option value="">Select a sheet...</option>
          {sheets.map(sheet => (
            <option key={sheet.id} value={sheet.id}>
              {sheet.publicName || sheet.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSheet && (
        <div>
          <h3>{selectedSheet.publicName || selectedSheet.name}</h3>
          {selectedSheet.exerciseMethods?.map(method => (
            <div key={method.id}>{method.rest}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### API Response Structure

When fetching sheets, the hook receives:

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Chest & Back",
      "categoryId": 2,
      "publicName": "Chest & Back Workouts",
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z",
      "exerciseMethods": [
        {
          "id": 1,
          "rest": "60s",
          "observations": "Warm up first",
          "order": 1,
          "exerciseConfigurations": [...]
        }
      ]
    }
  ]
}
```

---

## useIsMobile

### Purpose

Detects if the viewport is at mobile size (below 768px) using media queries. Updates reactively when the window is resized.

### Implementation

- **Media Query:** Uses `window.matchMedia()` with 768px breakpoint
- **Event Listener:** Listens for breakpoint changes on resize
- **Cleanup:** Automatically removes listener on unmount
- **Undefined State:** Initially undefined until component mounts (SSR safe)

### API

```typescript
function useIsMobile(): boolean
```

### Parameters

None.

### Return Values

| Type | Description |
|------|-------------|
| boolean | True if viewport width < 768px, false otherwise |

### How It Works

1. **Initial State:** Set to `undefined` (for SSR compatibility)
2. **Mount:** Creates media query listener and checks current width
3. **Listener:** Whenever screen width changes across 768px boundary, updates state
4. **Return:** Boolean value (false when `undefined` due to `!!isMobile`)
5. **Unmount:** Removes event listener and cleans up

### Breakpoint Reference

- **Mobile:** < 768px
- **Desktop:** ≥ 768px
- **Tailwind Equivalent:** `md` breakpoint

### Example Usage - Conditional Rendering

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

export function ResponsiveLayout() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileNavigation />
      ) : (
        <DesktopNavigation />
      )}
    </div>
  );
}
```

### Example Usage - Adaptive UI

```typescript
export function ExerciseGrid() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'grid-cols-1' : 'grid-cols-3'}>
      {exercises.map(exercise => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
```

### Example Usage - Dialog Size

```typescript
export function ExerciseDialog({ open, onOpenChange }) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? 'max-w-[95vw]' : 'max-w-2xl'}>
        <ExerciseForm />
      </DialogContent>
    </Dialog>
  );
}
```

### Example Usage - Drawer vs Modal

```typescript
export function MobileAwareDrawer() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger>Open Menu</DrawerTrigger>
        <DrawerContent>
          <MenuItem />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Open Menu</DialogTrigger>
      <DialogContent>
        <MenuItem />
      </DialogContent>
    </Dialog>
  );
}
```

---

## useToast

### Purpose

Provides a toast notification system for displaying temporary messages, success/error alerts, and actionable notifications. Uses an imperative API with state management.

### Implementation

- **Memory State:** Maintains state globally outside React
- **Reducer Pattern:** Uses action types to manage toast state
- **Auto-dismiss:** Automatically removes toasts after 1 million ms delay
- **Limit:** Shows maximum 1 toast at a time
- **Manual Control:** Supports dismiss and update operations

### API

```typescript
type Toast = {
  title?: React.ReactNode;      // Toast title
  description?: React.ReactNode; // Toast description
  action?: ToastActionElement;   // Action button
  [key: string]: any;            // Other Radix UI props
};

interface ToastReturn {
  id: string;                           // Unique toast ID
  dismiss: () => void;                  // Dismiss this toast
  update: (props: Partial<Toast>) => void;  // Update this toast
}

function useToast(): {
  toasts: ToasterToast[];  // Array of active toasts
  toast: (props: Toast) => ToastReturn;  // Add new toast
  dismiss: (id?: string) => void;  // Dismiss toast(s)
}

// Also exported as standalone function
function toast(props: Toast): ToastReturn
```

### Parameters

**For `toast()` function:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | ReactNode | No | Toast title/heading |
| `description` | ReactNode | No | Toast message content |
| `action` | ToastActionElement | No | Action button element |
| Other props | any | No | Radix UI Dialog props |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier for this toast |
| `dismiss` | function | Remove this specific toast |
| `update` | function | Update this toast's content |

### How It Works

1. **Global State:** Maintains toast array outside React components
2. **New Toast:** `toast()` generates unique ID and dispatches ADD_TOAST action
3. **Rendering:** `useToast()` subscribes to state changes
4. **Auto-dismiss:** On dismiss, schedules removal after delay
5. **Cleanup:** Listener cleanup on component unmount

### Example Usage - Basic

```typescript
import { useToast } from '@/hooks/use-toast';

export function CreateExercise() {
  const { toast } = useToast();

  const handleCreate = async (exercise) => {
    try {
      const response = await fetch('/api/db/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exercise),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exercise created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create exercise',
      });
    }
  };

  return <ExerciseForm onSubmit={handleCreate} />;
}
```

### Example Usage - Dismissible Toast

```typescript
export function UpdateMethod() {
  const { toast } = useToast();

  const handleUpdate = async (method) => {
    const toastId = toast({
      title: 'Updating...',
      description: 'Please wait while we save your changes',
    });

    try {
      await fetch(`/api/db/methods/${method.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method),
      });

      // Update the existing toast
      toastId.update({
        title: 'Success',
        description: 'Method updated successfully',
      });
    } catch (error) {
      toastId.update({
        title: 'Error',
        description: 'Failed to update method',
      });
    }
  };

  return <MethodForm onSubmit={handleUpdate} />;
}
```

### Example Usage - With Action

```typescript
export function DeleteWorkoutSheet() {
  const { toast } = useToast();

  const handleDelete = async (sheetId) => {
    try {
      await fetch(`/api/training-sheets/${sheetId}`, {
        method: 'DELETE',
      });

      const { dismiss } = toast({
        title: 'Deleted',
        description: 'Workout sheet has been deleted',
        action: (
          <button onClick={() => handleUndo(sheetId)}>
            Undo
          </button>
        ),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workout sheet',
      });
    }
  };

  return <SheetList onDelete={handleDelete} />;
}
```

### Example Usage - Standalone Function

```typescript
// Can be called outside of React components
import { toast } from '@/hooks/use-toast';

export async function fetchUserProfile() {
  try {
    const response = await fetch('/api/user/profile');
    // ...
    toast({
      title: 'Profile Loaded',
      description: 'Your profile has been updated',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to load profile',
    });
  }
}
```

### Example Usage - Chained Updates

```typescript
export function ComplexOperation() {
  const { toast } = useToast();

  const handleComplexTask = async (data) => {
    const toastId = toast({
      title: 'Processing',
      description: 'Starting operation...',
    });

    try {
      // Step 1
      toastId.update({
        description: 'Creating resources...',
      });
      await createResource(data);

      // Step 2
      toastId.update({
        description: 'Associating data...',
      });
      await associateData(data);

      // Success
      toastId.update({
        title: 'Complete',
        description: 'All steps completed successfully',
      });
    } catch (error) {
      toastId.update({
        title: 'Failed',
        description: `Error: ${error.message}`,
      });
    }
  };

  return <ComplexForm onSubmit={handleComplexTask} />;
}
```

### Toast UI Component Integration

The `useToast` hook works with the Radix UI toast components:

```typescript
// In your layout or root component
import { Toaster } from '@/components/ui/toaster';

export function RootLayout() {
  return (
    <div>
      {/* Your layout */}
      <Toaster />
    </div>
  );
}
```

### Toast State Management

```typescript
export function ToastDisplay() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-[100]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="mb-2 p-4 bg-white border rounded shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              {toast.title && <h3>{toast.title}</h3>}
              {toast.description && <p>{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)}>×</button>
          </div>
          {toast.action}
        </div>
      ))}
    </div>
  );
}
```

---

## Hook Comparison

### When to Use Each Hook

| Hook | Best For | Example |
|------|----------|---------|
| `useLoading` | Global loading UI state | Show spinner over entire page |
| `usePagination` | Paginated lists/grids | Exercises grid with 12 per page |
| `useWorkoutSheetsFilter` | Category-filtered data | Workout sheets by category |
| `useIsMobile` | Responsive design | Show drawer on mobile, modal on desktop |
| `useToast` | User notifications | Success/error messages |

### State Management Patterns

**Zustand (useLoading):**
- Global, singleton state
- Persistent across component tree
- Ideal for UI state affecting entire app

**React Hooks (usePagination, useWorkoutSheetsFilter, useIsMobile):**
- Local component state with side effects
- Isolated per component instance
- Each component has own state

**Custom Reducer (useToast):**
- Memory-based state outside React
- Listeners pattern for updates
- Imperative API for notifications

---

## Common Patterns

### Pattern 1: Loading with Pagination

```typescript
export function ExercisesPaginatedWithLoading() {
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [exercises, setExercises] = useState([]);
  const { currentPageItems, totalPages } = usePagination({
    items: exercises,
    itemsPerPage: 12,
  });

  useEffect(() => {
    const loadExercises = async () => {
      startLoading();
      try {
        const response = await fetch('/api/db/exercises');
        const data = await response.json();
        setExercises(data.data);
      } finally {
        stopLoading();
      }
    };

    loadExercises();
  }, []);

  return (
    <div>
      {isLoading && <Spinner />}
      <div className="grid grid-cols-3">
        {currentPageItems.map(e => (
          <ExerciseCard key={e.id} exercise={e} />
        ))}
      </div>
    </div>
  );
}
```

### Pattern 2: Filtered Data with Refresh

```typescript
export function WorkoutSheetsWithRefresh() {
  const {
    sheets,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    refreshSheets,
    isLoading,
  } = useWorkoutSheetsFilter();

  const handleCreateSheet = async (newSheet) => {
    // ... create sheet ...
    refreshSheets(); // Re-fetch to show new item
  };

  return (
    <div>
      <CategorySelector
        categories={categories}
        selected={selectedCategoryId}
        onChange={setSelectedCategoryId}
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <SheetsList sheets={sheets} onCreate={handleCreateSheet} />
      )}
    </div>
  );
}
```

### Pattern 3: Responsive Layout

```typescript
export function ResponsiveWorkoutForm() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await fetch('/api/training-sheets', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast({
        title: 'Success',
        description: 'Workout sheet created',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isMobile ? 'p-4' : 'max-w-2xl mx-auto p-8'}>
      <WorkoutForm
        onSubmit={handleSubmit}
        isLoading={loading}
      />
    </div>
  );
}
```

---

## Testing Hooks

### Testing useLoading

```typescript
import { renderHook, act } from '@testing-library/react';
import { useLoading } from '@/hooks/use-loading';

describe('useLoading', () => {
  it('starts and stops loading', () => {
    const { result } = renderHook(() => useLoading());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.loadingCount).toBe(0);

    act(() => {
      result.current.startLoading();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.loadingCount).toBe(1);

    act(() => {
      result.current.stopLoading();
    });

    expect(result.current.isLoading).toBe(false);
  });
});
```

### Testing usePagination

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/use-pagination';

describe('usePagination', () => {
  const items = Array.from({ length: 50 }, (_, i) => i + 1);

  it('paginates items correctly', () => {
    const { result } = renderHook(() =>
      usePagination({ items, itemsPerPage: 10 })
    );

    expect(result.current.currentPageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.current.totalPages).toBe(5);

    act(() => {
      result.current.goToNextPage();
    });

    expect(result.current.currentPageItems).toEqual([11, 12, ..., 20]);
  });

  it('resets page on search dependency change', () => {
    const { result, rerender } = renderHook(
      ({ search }) => usePagination({ items, itemsPerPage: 10, searchDependency: search }),
      { initialProps: { search: 'test' } }
    );

    act(() => {
      result.current.goToNextPage();
    });
    expect(result.current.currentPage).toBe(2);

    rerender({ search: 'new' });
    expect(result.current.currentPage).toBe(1);
  });
});
```

---

## Performance Considerations

### useLoading
- **Pros:** Singleton, minimal re-renders
- **Cons:** Global state affects entire app
- **Optimization:** Only update UI when `isLoading` boolean changes

### usePagination
- **Pros:** Efficient slicing, no deep computations
- **Cons:** Re-slices on every render if items array changes
- **Optimization:** Memoize items array with `useMemo` if expensive to compute

### useWorkoutSheetsFilter
- **Pros:** Handles all filtering logic
- **Cons:** Makes API calls, consider debouncing category changes
- **Optimization:** Add abort signal to cancel in-flight requests

### useIsMobile
- **Pros:** Lightweight media query check
- **Cons:** Adds event listener
- **Optimization:** Memoize result or use `useCallback` for callbacks

### useToast
- **Pros:** Efficient memory-based state
- **Cons:** Global listeners can accumulate
- **Optimization:** Proper cleanup on unmount

---

## Summary

| Hook | Type | Use Case | Data Flow |
|------|------|----------|-----------|
| `useLoading` | Zustand | Global loading state | State → Component |
| `usePagination` | React | Paginated arrays | Props → State → Items |
| `useWorkoutSheetsFilter` | React | API data + filtering | Fetch → State → Return |
| `useIsMobile` | React | Responsive detection | MediaQuery → State → Boolean |
| `useToast` | Custom | Notifications | Action → Memory → Listener |

All hooks are production-ready and follow React best practices for performance and maintainability.
