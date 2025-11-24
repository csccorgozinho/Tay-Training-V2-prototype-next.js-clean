# Feature Documentation

This section provides detailed documentation of each major feature in the Tay Training application, including how each works internally and which components/hooks are involved.

**Last Updated**: November 24, 2025  
**Status**: ✅ Current and Accurate  
**New Feature**: Exercises page with full CRUD operations (added November 24)

---

## 1. Exercises Feature

### What It Does
The Exercises feature allows users to manage a catalog of exercises. Users can create new exercises with descriptions and video URLs, search/filter the list, view details, edit existing exercises, and delete exercises. Exercises are paginated for better performance with large datasets.

### How It Works Internally

**Data Flow:**
1. **Load Phase:** Page loads, `useLoading` starts, `apiGet('/api/db/exercises')` fetches all exercises from database
2. **Display Phase:** Exercises stored in local state (`useState`), filtered by search term in real-time
3. **Pagination:** `usePagination` hook breaks list into pages (items per page configured in constants)
4. **Interaction Phase:** User can create (new dialog), edit (pre-filled dialog), view, or delete
5. **Feedback:** `useToast` shows success/error messages; `ActivityTracker` logs the action

**Internal Logic:**
- **Search Filtering:** Filters exercises by name and description (case-insensitive)
- **Edit Mode:** Dialog opens with existing exercise data pre-filled
- **View Mode:** Dialog opens in read-only mode (no editing)
- **Delete:** Confirms deletion, then calls API, removes from state, shows toast

**State Management:**
```typescript
const [exercises, setExercises] = useState<Exercise[]>([]);       // Master list
const [searchTerm, setSearchTerm] = useState("");                 // Search input
const [editingExercise, setEditingExercise] = useState(null);     // Currently editing
const [selectedExercise, setSelectedExercise] = useState(null);   // Currently viewing
```

### Components & Hooks Involved
- **Page:** `src/pages/exercises.tsx`
- **Dialog:** `src/components/dialogs/ExerciseDialog.tsx`
- **Hooks:** `useLoading`, `usePagination`, `useToast`
- **API:** `apiGet('/api/db/exercises')`, `apiPost('/api/db/exercises')`, `apiPut`, `apiDelete`
- **UI Components:** Button, Input, Card, DropdownMenu, Skeleton
- **Services:** `ActivityTracker` (logs exercise creation/modification)

### User Flow
```
1. User navigates to /exercises
2. Page loads all exercises via API
3. LoadingBar shows progress (from useLoading)
4. Exercises display in paginated cards
5. User can:
   - Search by name/description
   - Click "New" to open create dialog
   - Click exercise card to view/edit
   - Click dropdown menu to edit or delete
6. After action, list refreshes and toast shows result
```

---

## 2. Methods Feature

### What It Does
The Methods feature manages training method protocols. Each method has a name and description (e.g., "5x5 Strength Protocol", "High-Rep Endurance"). Users can create, view, edit, and delete methods. Like exercises, methods are paginated and searchable.

### How It Works Internally

**Data Flow:**
Similar to Exercises feature:
1. Fetch all methods via `apiGet('/api/db/methods')`
2. Store in local state, filter by search term
3. Paginate results
4. Show dialogs for CRUD operations
5. Log activities and display toast feedback

**Internal Logic:**
- **Search:** Filters methods by name and description
- **Create:** Dialog accepts method name and description, submits via `apiPost`
- **Edit:** Pre-fills dialog with existing data, submits via `apiPut`
- **Delete:** Confirms and removes via `apiDelete`

**State Management:**
```typescript
const [methods, setMethods] = useState<Method[]>([]);           // Master list
const [searchTerm, setSearchTerm] = useState("");               // Search input
const [editingMethod, setEditingMethod] = useState(null);       // Currently editing
const [selectedMethod, setSelectedMethod] = useState(null);     // Currently viewing
```

### Components & Hooks Involved
- **Page:** `src/pages/methods.tsx`
- **Dialog:** `src/components/dialogs/MethodDialog.tsx`
- **Hooks:** `useLoading`, `usePagination`, `useToast`
- **API:** `apiGet('/api/db/methods')`, `apiPost`, `apiPut`, `apiDelete`
- **UI Components:** Button, Input, Card, DropdownMenu
- **Services:** `ActivityTracker` (logs method operations)

### User Flow
```
1. Navigate to /methods
2. Page loads all methods
3. View paginated list of methods
4. Search by name/description
5. Create new method via dialog
6. Edit or delete existing methods
7. See toast feedback for each action
```

---

## 3. Workout Sheets Feature

### What It Does
Workout Sheets represent grouped exercises (exercise groups). A workout sheet is a template that contains a collection of exercises, each with associated methods and configurations (series/reps). Users can create, view, edit, and delete workout sheets. The feature includes filtering by exercise category.

### How It Works Internally

**Data Flow:**
1. **Fetch Categories & Sheets:** On mount, `useWorkoutSheetsFilter` hook fetches:
   - Categories (from `/api/categories`)
   - Exercise groups (from `/api/exercise-groups`)
2. **Transform Data:** Raw exercise groups are transformed into `WorkoutSheetTransformed` format:
   - Count total exercises (from exerciseConfigurations)
   - Extract method names
   - Format metadata (last updated, type)
3. **Filter by Category:** User selects category → hook filters sheets by `categoryId`
4. **Paginate Results:** Display paginated sheets
5. **CRUD Operations:**
   - Create → opens `WorkoutSheetDialog` with wizard
   - Edit → pre-fills dialog with existing sheet data
   - Delete → API call + state update

**State Management:**
```typescript
const [workoutSheets, setWorkoutSheets] = useState<WorkoutSheetTransformed[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const { sheets, categories, selectedCategoryId, setSelectedCategoryId } = useWorkoutSheetsFilter();
```

**Filtering Logic:**
```typescript
// Filter by category (via hook)
sheets.filter(sheet => 
  selectedCategoryId === null || sheet.categoryId === selectedCategoryId
)

// Filter by search term
filteredSheets.filter(sheet =>
  sheet.name.toLowerCase().includes(searchTerm.toLowerCase())
)
```

### Components & Hooks Involved
- **Page:** `src/pages/workout-sheets.tsx`
- **Dialog:** `src/components/dialogs/WorkoutSheetDialog.tsx`
- **Filter Hook:** `useWorkoutSheetsFilter` – manages category/sheet fetching and filtering
- **Dialogs:** `CategoryFilterDialog` (filter by category), `WorkoutSheetDialog` (CRUD)
- **Hooks:** `useLoading`, `usePagination`, `useToast`
- **API:** `apiGet`, `apiPost`, `apiPut`, `apiDelete`

### User Flow
```
1. Navigate to /workout-sheets
2. Page loads categories and exercise groups (via useWorkoutSheetsFilter)
3. View list of workout sheets with exercise counts
4. Click "Filter" to open category dialog
5. Select category to filter sheets (or clear to see all)
6. Search by sheet name
7. Click "New" to create new sheet (opens dialog with form)
8. Click sheet card to view details
9. Click dropdown menu to edit or delete
10. Activity logged, toast shown
```

---

## 4. Training Schedule Feature

### What It Does
Training Schedule allows users to create multi-day training schedules. A schedule is composed of multiple "training days", each linking to an exercise group. Users can view all schedules, create new ones using a wizard dialog, edit existing schedules, and delete schedules. The schedule displays with metadata (number of days, exercises) and supports search.

### How It Works Internally

**Data Flow:**
1. **Load Schedules:** Fetch all training sheets (which include nested training days) via `apiGet('/api/training-sheets')`
2. **Display:** Show in paginated table/card view with search
3. **Create:** Open `TrainingScheduleDialog_Wizard` (multi-step dialog):
   - Step 1: Schedule name and details
   - Step 2: Define training days and assign exercise groups
   - Step 3: Review and submit
4. **Submit:** Calls `apiPost('/api/training-sheets')` with nested payload
5. **Edit/Delete:** Pre-fill data or confirm deletion

**Nested Data Structure:**
A training sheet contains:
```typescript
TrainingSheet {
  id: number
  name: string
  trainingDays: [
    {
      id: number
      day: number
      exerciseGroup: {
        id: number
        name: string
        exerciseMethods: [
          {
            id: number
            exerciseConfigurations: [
              { series, reps, exercise, method }
            ]
          }
        ]
      }
    }
  ]
}
```

**Deduplication Logic** (in service):
- When creating a schedule, if an exercise group with the same name and category already exists, reuse it
- Prevents duplicate groups in database
- Improves data consistency

**Animations:**
Uses Framer Motion variants:
- `fadeUpIn` – fade in and slide up on load
- `listContainer` + `listItem` – stagger animation for schedule list
- `hoverScale`, `tapScale` – interactive feedback

### Components & Hooks Involved
- **Page:** `src/pages/training-schedule.tsx`
- **Dialog:** `src/components/dialogs/TrainingScheduleDialog_Wizard.tsx` (multi-step wizard)
- **Hooks:** `useLoading`, `useToast`
- **API:** `apiGet('/api/training-sheets')`, `apiPost`, `apiPut`, `apiDelete`
- **Utilities:** `motion-variants.ts` (Framer Motion animations)
- **Services:** `createCompleteTrainingSheet` (server-side transactional creation)

### User Flow
```
1. Navigate to /training-schedule
2. Load all training schedules
3. View paginated list of schedules with metadata
4. Search by schedule name
5. Click "New" to open wizard dialog
6. Step 1: Enter schedule name
7. Step 2: Define training days (day number, exercise group)
8. Step 3: Review and submit
9. On success: schedule added to list, toast shown
10. Click dropdown menu to edit or delete
11. EditingSchedule pre-fills the wizard
```

---

## 5. Home Dashboard Feature

### What It Does
The Home Dashboard is the landing page after login. It displays:
- Quick counts (number of exercises, methods, workout sheets, training schedules)
- Quick access cards linking to main features
- Recent activity log (last 10 user actions)
- Statistics and metadata

### How It Works Internally

**Data Flow:**
1. **Fetch Counts:** Load aggregated counts:
   - Count of exercises: `apiGet('/api/db/exercises')`
   - Count of methods: `apiGet('/api/db/methods')`
   - Count of workout sheets: `apiGet('/api/exercise-groups')`
   - Count of training schedules: `apiGet('/api/training-sheets')`
2. **Fetch Activity:** Load recent activities via `ActivityTracker.getActivities()`
3. **Display:** Show counts, quick access cards, activity log

**Activity Tracking:**
- `ActivityTracker` class stores activities in `localStorage`
- Stores up to 10 most recent activities
- Each activity has: `name`, `type`, `timestamp`
- Activities logged when user creates/edits exercises, methods, sheets, or schedules

**State Management:**
```typescript
const [counts, setCounts] = useState<Counts>({
  exercises: 0,
  methods: 0,
  workoutSheets: 0,
  trainings: 0,
});
const [activities, setActivities] = useState<ActivityItem[]>([]);
```

**Animations:**
- Uses `fadeUpIn` for fade-in effect
- `gridContainer` + `gridItem` for staggered grid animation of cards
- `hoverLift` for card hover effects

### Components & Hooks Involved
- **Page:** `src/pages/home.tsx`
- **Services:** `ActivityTracker` (retrieves and formats activities)
- **Hooks:** `useLoading`, `useToast`
- **API:** Multiple counts endpoints (exercises, methods, sheets, schedules)
- **Utilities:** `motion-variants.ts` (grid animations)
- **UI Components:** Card, Button, Badge

### User Flow
```
1. User logs in or clicks "Home" in navigation
2. Navigate to /home
3. Page fetches counts for all resources
4. Activity list loads from localStorage
5. LoadingBar shows during fetch
6. Dashboard displays:
   - Counts as metric cards
   - Quick access buttons to main features
   - Recent activity log
7. User can click cards to navigate to features
```

---

## 6. Activity Tracker Feature

### What It Does
Activity Tracker logs user actions (creating, editing exercises/methods/sheets/schedules) and displays them on the Home dashboard. It provides a history of recent user interactions for quick context about what was done recently.

### How It Works Internally

**Storage:**
- Uses browser `localStorage` with key `tay_training_activity`
- Stores up to 10 most recent activities (circular buffer)
- Each activity: `{ name: string, type: string, timestamp: number }`

**Core Methods:**

**`addActivity(name, type)`:**
```typescript
// Called after user creates/edits/deletes a resource
ActivityTracker.addActivity('Squat Exercise', 'Exercício');
ActivityTracker.addActivity('5x5 Protocol', 'Método');

// Internally:
// 1. Retrieve existing activities from localStorage
// 2. Prepend new activity to array (unshift)
// 3. Keep only last 10 (slice(0, 10))
// 4. Save back to localStorage
```

**`getActivities()`:**
```typescript
// Returns activities with formatted dates
// Example output:
[
  { name: 'Squat', type: 'Exercício', date: 'Hoje, 14:32' },
  { name: 'Protocol', type: 'Método', date: 'Ontem, 10:15' },
  { name: 'Full Body', type: 'Ficha de Treino', date: '20/11/2025 09:45' },
]
```

**Date Formatting Logic:**
- Today: `"Hoje, HH:mm"` (e.g., "Hoje, 14:32")
- Yesterday: `"Ontem, HH:mm"` (e.g., "Ontem, 10:15")
- Older: Full date format `"DD/MM/YYYY HH:mm"` (e.g., "20/11/2025 09:45")

**Activity Types:**
- `'Exercício'` – Exercise created/edited/deleted
- `'Método'` – Method created/edited/deleted
- `'Ficha de Treino'` – Workout sheet created/edited/deleted
- `'Treino'` – Training schedule created/edited/deleted

**Integration Points:**
- **ExerciseDialog:** Calls `ActivityTracker.addActivity(name, 'Exercício')` after save
- **MethodDialog:** Calls `ActivityTracker.addActivity(name, 'Método')` after save
- **WorkoutSheetDialog:** Calls `ActivityTracker.addActivity(name, 'Ficha de Treino')` after save
- **TrainingScheduleDialog:** Calls `ActivityTracker.addActivity(name, 'Treino')` after save
- **Home Page:** Calls `ActivityTracker.getActivities()` to display on dashboard

### Components & Hooks Involved
- **Service:** `src/lib/activity-tracker.ts`
- **Called from:** All CRUD dialogs (ExerciseDialog, MethodDialog, WorkoutSheetDialog, TrainingScheduleDialog)
- **Displayed on:** `src/pages/home.tsx`

### User Flow
```
1. User creates an exercise named "Squat"
2. ExerciseDialog saves and calls ActivityTracker.addActivity('Squat', 'Exercício')
3. Activity added to localStorage with current timestamp
4. User navigates to Home page
5. Home page calls ActivityTracker.getActivities()
6. Activity appears in "Recent Activity" section with formatted date
```

---

## 7. Dialog Components Feature

### What It Does
Dialogs provide a unified, reusable UI pattern for all CRUD (Create, Read, Update, Delete) operations. Instead of full-page forms, users interact with modal dialogs for:
- Creating new exercises, methods, workout sheets, training schedules
- Editing existing resources
- Viewing resource details (read-only mode)
- Confirming destructive actions (delete)

### How It Works Internally

**Dialog Architecture:**

**Base Dialog Pattern:**
```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableDialogProps extends DialogProps {
  isEditing: boolean;
  initialData?: unknown;
  onSaved?: (data: unknown) => void;
}
```

**Lifecycle:**
1. **Open:** Dialog receives `open={true}` and optional `initialData`
2. **Populate:** If `initialData` provided, pre-fill form fields; else clear form
3. **Display:** Show form (or read-only view if `isViewMode = !isEditing && !!initialData.id`)
4. **Submit:** User submits form → validate → API call → update state → close dialog
5. **Feedback:** Toast shows success/error, activity logged

**States in ExerciseDialog:**
```typescript
const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [videoUrl, setVideoUrl] = useState<string | null>(null);
const [hasMethod, setHasMethod] = useState(true);
const [saving, setSaving] = useState(false);

// Modes
const isViewMode = !isEditing && !!initialData?.id;
const isEditMode = isEditing && !!initialData?.id;
const isCreateMode = !isEditing && !initialData?.id;
```

**Form Submission:**
```typescript
const handleSubmit = async (e: React.FormEvent): Promise<void> => {
  e.preventDefault();
  
  // 1. Validate
  if (!description.trim()) {
    toast({ title: 'Error', description: 'Description required' });
    return;
  }
  
  // 2. Build payload
  const payload = { name, description, videoUrl, hasMethod };
  
  // 3. API call (create or update)
  setSaving(true);
  startLoading();
  try {
    if (isEditing) {
      await apiPut(`/api/db/exercises/${initialData.id}`, payload);
    } else {
      await apiPost('/api/db/exercises', payload);
    }
    
    // 4. Log activity
    ActivityTracker.addActivity(name, 'Exercício');
    
    // 5. Close and callback
    onOpenChange(false);
    onSaved?.(/* data */);
    toast({ title: 'Success', description: 'Exercise saved' });
  } catch (error) {
    toast({ title: 'Error', description: 'Failed to save' });
  } finally {
    setSaving(false);
    stopLoading();
  }
};
```

**Dialog Types in Project:**

1. **ExerciseDialog** – Create/edit/view exercises
2. **MethodDialog** – Create/edit/view methods
3. **WorkoutSheetDialog** – Create/edit/view workout sheets
4. **TrainingScheduleDialog_Wizard** – Multi-step wizard for schedule creation
5. **CategoryFilterDialog** – Filter by category (no CRUD, just selection)
6. **GroupSelectorBar** – Select exercise groups (no CRUD, just selection)
7. **WorkoutSheetAutocomplete** – Autocomplete for quick sheet selection
8. **ConfirmDialog** – Generic confirmation for deletions

### Components & Hooks Involved
- **Dialogs:** All in `src/components/dialogs/`
- **Hooks:** `useLoading`, `useToast`
- **API:** `apiPost`, `apiPut`, `apiDelete`
- **Services:** `ActivityTracker` (for logging)
- **UI Components:** Dialog, Button, Input, Label, Textarea, etc.
- **Animations:** Framer Motion for modal animations

### User Flow (Create Example)
```
1. User clicks "New Exercise" button
2. ExerciseDialog opens with open={true}, isEditing={false}
3. Form fields are empty (fresh state)
4. User fills in name, description, video URL
5. User clicks "Save"
6. Form validates, calls apiPost to create
7. On success:
   - ActivityTracker logs action
   - Toast shows "Exercise created!"
   - Dialog closes
   - Parent component refreshes list
```

### User Flow (Edit Example)
```
1. User clicks edit icon on exercise card
2. ExerciseDialog opens with open={true}, isEditing={true}, initialData={exercise}
3. Form fields pre-filled with exercise data
4. User modifies fields
5. User clicks "Save"
6. Form validates, calls apiPut to update
7. On success:
   - ActivityTracker logs action
   - Toast shows "Exercise updated!"
   - Dialog closes
   - Parent component refreshes list
```

---

## 8. Pagination Feature

### What It Does
Pagination breaks large lists into manageable pages. Users can navigate between pages using next/previous buttons or jump to a specific page. Pagination automatically resets to page 1 when search term changes.

### How It Works Internally

**Hook: `usePagination<T>()`**

```typescript
interface UsePaginationProps<T> {
  items: T[];               // Full list to paginate
  itemsPerPage: number;     // Items per page
  searchDependency?: any;   // Optional: resets page on change
}

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  currentPageItems: T[];    // Only items for current page
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setCurrentPage: (page: number) => void;
}
```

**Usage Example:**
```typescript
const { currentPageItems, currentPage, totalPages, goToNextPage, goToPreviousPage } 
  = usePagination({
    items: filteredExercises,      // Already filtered by search
    itemsPerPage: 12,
    searchDependency: searchTerm   // Reset on search change
  });
```

**Internal Logic:**

**1. Calculate Total Pages:**
```typescript
const totalPages = Math.ceil(items.length / itemsPerPage);
// Example: 37 items, 12 per page → 4 pages
```

**2. Get Current Page Items:**
```typescript
const startIndex = (currentPage - 1) * itemsPerPage;
const currentPageItems = items.slice(startIndex, startIndex + itemsPerPage);

// Example: currentPage=2, itemsPerPage=12
// startIndex = (2-1) * 12 = 12
// slice(12, 24) → items 13-24
```

**3. Auto-Reset on Search:**
```typescript
useEffect(() => {
  setCurrentPageState(1);  // Reset to page 1
}, [searchDependency]);    // When searchTerm changes
```

**4. Navigation:**
```typescript
const goToNextPage = () => {
  if (currentPage < totalPages) {
    setCurrentPageState(currentPage + 1);
  }
};

const goToPreviousPage = () => {
  if (currentPage > 1) {
    setCurrentPageState(currentPage - 1);
  }
};
```

**UI Integration:**
```tsx
// Display current page items
{currentPageItems.map(item => (
  <ExerciseCard key={item.id} exercise={item} />
))}

// Show pagination controls
<Button onClick={goToPreviousPage} disabled={currentPage === 1}>
  Previous
</Button>
<span>{currentPage} of {totalPages}</span>
<Button onClick={goToNextPage} disabled={currentPage === totalPages}>
  Next
</Button>
```

### Components & Hooks Involved
- **Hook:** `src/hooks/use-pagination.ts`
- **Used in:** All list pages (Exercises, Methods, WorkoutSheets, TrainingSchedule)
- **UI Components:** Button, ChevronLeft, ChevronRight icons

### User Flow
```
1. Page loads 50 exercises, paginated as 12 per page → 5 pages total
2. Shows exercises 1-12 (page 1)
3. User clicks "Next" → shows exercises 13-24 (page 2)
4. User types search term → list filters, resets to page 1
5. User clicks "Previous" → shows previous page
6. User clicks specific page button → jumps to that page
```

---

## 9. Filtering System Feature

### What It Does
The Filtering System allows users to narrow down lists by specific criteria. Currently implemented for:
- **Search Filter:** Filters exercises, methods, sheets by name/description (text input)
- **Category Filter:** Filters workout sheets by exercise category (dropdown/dialog)

### How It Works Internally

**Search Filtering (Client-Side):**
```typescript
const [searchTerm, setSearchTerm] = useState("");

// Real-time filter
const filteredExercises = exercises.filter(exercise => {
  return exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
});

// User types → searchTerm updates → filter recalculates → UI updates
```

**Category Filtering (via Hook):**
Hook: `useWorkoutSheetsFilter`

```typescript
const {
  sheets,                    // Already filtered by category
  categories,                // List of categories
  selectedCategoryId,        // Currently selected category
  setSelectedCategoryId,     // Update selected category
  refreshSheets,            // Manually refresh data
} = useWorkoutSheetsFilter();

// Internal flow:
// 1. Fetch categories on mount
// 2. Fetch sheets for selected category
// 3. When selectedCategoryId changes → re-fetch sheets
// 4. If selectedCategoryId === null → fetch all sheets
```

**Combined Filtering (Search + Category):**
```typescript
// Apply category filter (via hook)
const categoryFiltered = sheets;  // Already filtered by hook

// Apply search filter (client-side)
const bothFiltered = categoryFiltered.filter(sheet =>
  sheet.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// Display paginated results
const { currentPageItems } = usePagination({
  items: bothFiltered,
  itemsPerPage: 12,
  searchDependency: searchTerm
});
```

**Filter UI Components:**
- **Search Input:** `<Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />`
- **Category Dialog:** `<CategoryFilterDialog open={filterDialogOpen} categories={categories} onSelect={setSelectedCategoryId} />`
- **Clear Filters:** Button to reset all filters (set searchTerm="" and selectedCategoryId=null)

### Components & Hooks Involved
- **Hook:** `useWorkoutSheetsFilter` (category filtering)
- **Search:** Simple state + array.filter() (all pages)
- **Dialogs:** `CategoryFilterDialog`
- **UI Components:** Input, DropdownMenu, Badge (show selected filters)

### User Flow
```
1. User navigates to workout sheets page
2. See full list of all sheets
3. User types in search → list filters by name in real-time
4. User clicks "Filter" button → CategoryFilterDialog opens
5. User selects category → sheets re-filter by category
6. Search still applies on top → combined filtering
7. User can clear search or category → resets that filter
8. Pagination updates based on filtered results
```

---

## 10. Loading System (Zustand) Feature

### What It Does
Global loading state management via Zustand. Tracks concurrent API requests and displays a progress bar while any request is in-flight. Eliminates need for individual loading flags in every component.

### How It Works Internally

**Zustand Store: `useLoading`**

```typescript
interface LoadingStore {
  isLoading: boolean;      // true if any request in progress
  loadingCount: number;    // counter for concurrent requests
  startLoading: () => void;
  stopLoading: () => void;
}

export const useLoading = create<LoadingStore>((set) => ({
  isLoading: false,
  loadingCount: 0,
  
  startLoading: () => {
    set((state) => {
      const newCount = state.loadingCount + 1;
      return {
        loadingCount: newCount,
        isLoading: true,  // Always true when count > 0
      };
    });
  },
  
  stopLoading: () => {
    set((state) => {
      const newCount = Math.max(0, state.loadingCount - 1);
      return {
        loadingCount: newCount,
        isLoading: newCount > 0,  // false only when count reaches 0
      };
    });
  },
}));
```

**Why a Counter?**
Multiple concurrent requests (e.g., parallel API calls) need a counter:
- Request 1 starts → count = 1 → isLoading = true
- Request 2 starts → count = 2 → isLoading = true
- Request 1 completes → count = 1 → isLoading = true (still loading!)
- Request 2 completes → count = 0 → isLoading = false (now fully loaded)

**Integration with API Client:**

```typescript
// api-client.ts
export async function apiCall<T = unknown>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { skipLoading = false } = config;
  
  // Increment counter
  if (!skipLoading) {
    const loading = useLoading() as ReturnType<typeof useLoading>;
    loading.startLoading();  // count++
  }
  
  try {
    const response = await fetch(endpoint, /* ... */);
    const data = await response.json();
    return extractResponseData<T>(data);
  } finally {
    // Decrement counter
    if (!skipLoading) {
      const loading = useLoading() as ReturnType<typeof useLoading>;
      loading.stopLoading();  // count--
    }
  }
}
```

**LoadingBar Component:**

```typescript
// LoadingBar.tsx
import { useLoading } from '@/hooks/use-loading';

export function LoadingBar() {
  const { isLoading } = useLoading();  // Subscribe to store
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-blue-500"
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </AnimatePresence>
  );
}
```

**Usage in Components:**

```typescript
// Components automatically get loading state from API calls
const { startLoading, stopLoading } = useLoading();

async function handleCreate() {
  startLoading();
  try {
    await apiPost('/api/exercises', payload);
    // LoadingBar automatically shows during fetch
  } finally {
    stopLoading();
  }
}

// Or use API client directly (automatic)
const result = await apiGet('/api/exercises');
// LoadingBar shows automatically!
```

**Optional Skip:**
```typescript
// Skip loading state for non-critical requests
await apiGet('/api/analytics', { skipLoading: true });
// LoadingBar doesn't show for this request
```

### Components & Hooks Involved
- **Store:** `src/hooks/use-loading.ts`
- **Consumer:** `src/components/layout/LoadingBar.tsx`
- **Integration:** `src/lib/api-client.ts`
- **Setup:** Rendered in `pages/_app.tsx`

### Benefits

1. **No Manual Flags:** Components don't need `useState` for loading
2. **Global Coordination:** Multiple async operations automatically queue
3. **Clean UI:** Single loading bar instead of spinners everywhere
4. **Error Handling:** Counter ensures bar hides even if request fails (via finally block)
5. **Concurrent Requests:** Counter handles parallel API calls correctly

### User Flow
```
1. User clicks "Create Exercise"
2. API call starts → startLoading() → count = 1 → isLoading = true
3. LoadingBar appears at top of screen
4. Meanwhile, user navigates to another page → another API call starts
5. count = 2 → isLoading remains true
6. First request completes → count = 1 → LoadingBar still visible
7. Second request completes → count = 0 → isLoading = false
8. LoadingBar disappears
9. User sees smooth UX with single progress indicator
```

---

## Feature Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOME DASHBOARD                           │
│  (Counts + Quick Access + Activity Log)                         │
│  - Displays ActivityTracker.getActivities()                     │
│  - Links to all feature pages                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
    EXERCISES         METHODS              WORKOUT SHEETS
    (List + CRUD)     (List + CRUD)        (List + Filter + CRUD)
    ├─ Pagination    ├─ Pagination        ├─ Pagination
    ├─ Search        ├─ Search            ├─ Search
    ├─ Dialog        ├─ Dialog            ├─ Category Filter
    └─ Activity Log  └─ Activity Log      ├─ Dialog
                                           └─ Activity Log
                              ↓
                    TRAINING SCHEDULE
                      (List + Wizard + CRUD)
                      ├─ Pagination
                      ├─ Search
                      ├─ Multi-step Dialog
                      └─ Activity Log

All features use:
- useLoading (global loading bar)
- useToast (feedback notifications)
- ActivityTracker (activity logging)
- API Client (consistent HTTP)
- Framer Motion (animations)
```

---

## Summary

Each feature follows a consistent pattern:
1. **Fetch data** via API client (with automatic loading state)
2. **Filter/search** locally for real-time results
3. **Paginate** for performance
4. **CRUD via dialogs** for user-friendly interactions
5. **Log activities** for history
6. **Show feedback** via toasts

This modular approach makes adding new features straightforward and maintains consistency across the application.
