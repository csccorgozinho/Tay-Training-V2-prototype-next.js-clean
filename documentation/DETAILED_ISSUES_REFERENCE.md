# Tay Training - Detailed Issues Reference

**Last Updated**: November 24, 2025  
**Status**: ✅ Reference documentation with resolved items noted  

Quick lookup guide for all identified issues with exact locations.

---

### Update Note (November 24, 2025)
✅ **Exercises component successfully created** - Issue #1 Location 1 now resolved with full CRUD implementation  
✅ **React imports fixed** - Namespace import added to TrainingScheduleDialog_Wizard.tsx  
✅ **All documentation standardized** - Across 16 documentation files  

---

## Issue 1: Duplicate Page Component Code

### Severity: 🔴 CRITICAL
### Impact: Maintainability nightmare
### Files Affected: 3 pages

#### Location 1: Exercises Page
- **File**: `src/pages/Exercises.tsx`
- **Lines**: 1-327 (entire file)
- **Pattern**: Load, filter, paginate, dialog handling
- **Code**:
```typescript
// Line 41-60
const [searchTerm, setSearchTerm] = useState("");
const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
const [exercises, setExercises] = useState<Exercise[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const { startLoading, stopLoading } = useLoading();

// Line 65-77
async function loadExercises(): Promise<void> {
  setLoading(true);
  startLoading();
  try {
    const data = await apiGet<Exercise[]>('/api/db/exercises');
    setExercises(Array.isArray(data) ? data : []);
```

#### Location 2: Methods Page
- **File**: `src/pages/Methods.tsx`
- **Lines**: 1-327 (entire file)
- **Pattern**: IDENTICAL to Exercises.tsx
- **Code**:
```typescript
// Line 41-60 - SAME AS EXERCISES
const [searchTerm, setSearchTerm] = useState("");
const [methodDialogOpen, setMethodDialogOpen] = useState(false);
const [editingMethod, setEditingMethod] = useState<Method | null>(null);
const [methods, setMethods] = useState<Method[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const { startLoading, stopLoading } = useLoading();

// Line 63-75 - SAME AS EXERCISES
async function loadMethods() {
  setLoading(true);
  startLoading();
  try {
    const data = await apiGet<Method[]>('/api/db/methods');
    setMethods(Array.isArray(data) ? data : []);
```

#### Location 3: TrainingSchedule Page
- **File**: `src/pages/TrainingSchedule.tsx`
- **Lines**: 1-351 (entire file)
- **Pattern**: IDENTICAL to both above

### Impact
- 1,000+ lines of duplicated code
- Any bug fix must be applied 3 times
- Feature additions require changes in multiple places
- Maintenance nightmare

### How to Fix
Create `src/hooks/use-list-page.ts` (100 lines) and replace all 3 files with 80-line versions each.

---

## Issue 2: Duplicate API Handler Patterns

### Severity: 🟠 HIGH
### Impact: Hard to maintain, inconsistent error handling

#### Location 1: Exercises Index
- **File**: `pages/api/db/exercises/index.ts`
- **Lines**: 1-42
- **Code**:
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  try {
    if (req.method === "GET") {
      const exercises = await prisma.exercise.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(apiSuccess(exercises, { count: exercises.length }));
    }

    if (req.method === "POST") {
      const { name, description, videoUrl, hasMethod } = req.body ?? {};
      // Validation...
      const created = await prisma.exercise.create({...});
      return res.status(201).json(apiSuccess(created));
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("/api/db/exercises error", err);
    return res.status(500).json(apiError("Internal server error"));
  }
}
```

#### Location 2: Methods Index
- **File**: `pages/api/db/methods/index.ts`
- **Lines**: 1-44
- **Code**: IDENTICAL pattern to exercises

#### Affected Files
- `pages/api/db/exercises/index.ts`
- `pages/api/db/methods/index.ts`
- `pages/api/db/exercises/[id].ts`
- `pages/api/db/methods/[id].ts`
- `pages/api/categories/index.ts`
- And others...

### How to Fix
Create `src/lib/api-handler.ts` factory function to handle boilerplate.

---

## Issue 3: Raw Fetch Usage (Loading State Issue)

### Severity: 🟠 HIGH
### Impact: Loading state not tracked, inconsistent API handling

#### Location 1: useWorkoutSheetsFilter Hook
- **File**: `src/hooks/use-workout-sheets-filter.ts`
- **Lines**: 32-43, 50-67

**Problem Code**:
```typescript
// Line 32-43
const fetchCategories = async () => {
  try {
    const response = await fetch('/api/categories')  // ← Raw fetch
    if (!response.ok) throw new Error('Failed to fetch categories')
    
    const data = await response.json()
    setCategories(data.data || [])
  } catch (err) {
    console.error('Error fetching categories:', err)
    setError('Failed to load categories')
  }
}

// Line 50-67
const fetchSheets = async () => {
  // ...
  const response = await fetch(url)  // ← Raw fetch
  if (!response.ok) throw new Error('Failed to fetch exercise groups')
  const data = await response.json()
  // ...
}
```

**Why It's Wrong**:
- Uses raw `fetch()` instead of `apiGet()`
- Loading state not managed by Zustand
- Inconsistent with rest of app

**How to Fix**:
```typescript
const data = await apiGet<Category[]>('/categories', signal);
setCategories(data || []);
```

#### Location 2: Home Page
- **File**: `src/pages/Home.tsx`
- **Lines**: 62-95

**Problem Code**:
```typescript
// Line 62-95
const [exercisesRes, methodsRes, groupsRes, trainingSheetsRes] = await Promise.all([
  fetch('/api/db/exercises'),
  fetch('/api/db/methods'),
  fetch('/api/exercise-groups'),
  fetch('/api/training-sheets')
]);
```

**How to Fix**:
```typescript
const [exercises, methods, groups, trainingSheets] = await Promise.all([
  apiGet<any[]>('/exercises', signal),
  apiGet<any[]>('/methods', signal),
  apiGet<any[]>('/exercise-groups', signal),
  apiGet<any[]>('/training-sheets', signal),
]);
```

---

## Issue 4: Unused State Variables

### Severity: 🟡 MEDIUM
### Impact: Confusing code, potential bugs

#### Location: WorkoutSheets Page
- **File**: `src/pages/WorkoutSheets.tsx`
- **Lines**: 54-58

**Problem Code**:
```typescript
const { startLoading, stopLoading } = useLoading();  // ← Imported but NEVER CALLED
const [workoutSheets, setWorkoutSheets] = useState<WorkoutSheetTransformed[]>([]);
const [loading, setLoading] = useState(false);  // ← Unused (duplicate of filterLoading)
```

**Why It's Wrong**:
- `startLoading/stopLoading` imported but never used (lines don't show them being called)
- `loading` state is never set or used (component uses `filterLoading` from hook instead)
- Confusing for maintenance

**How to Fix**:
```typescript
// Remove these two lines entirely:
// const { startLoading, stopLoading } = useLoading();
// const [loading, setLoading] = useState(false);

// Use this instead:
const { filterLoading } = useWorkoutSheetsFilter();
// Then use filterLoading throughout component
```

---

## Issue 5: Duplicate Type Definitions

### Severity: 🟡 MEDIUM
### Impact: Inconsistency, single source of truth broken

#### Location 1: Hook Types
- **File**: `src/hooks/use-workout-sheets-filter.ts`
- **Lines**: 3-18

```typescript
export interface Category {
  id: number
  name: string
}

export interface WorkoutSheet {
  id: number
  name: string
  publicName: string | null
  categoryId: number
  createdAt: Date
  updatedAt: Date
  exerciseMethods?: any[]
}
```

#### Location 2: Main Types File
- **File**: `src/types/index.ts`
- **Lines**: 10-68

```typescript
export interface Category {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExerciseGroup {  // ← Same as WorkoutSheet
  id: number;
  name: string;
  categoryId: number;
  publicName?: string | null;
  category?: Category;
  exerciseMethods: ExerciseMethod[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Problem**: Two different definitions for the same concept

**How to Fix**: Use types from `@/types/index.ts`:
```typescript
import { Category, ExerciseGroup as WorkoutSheet } from '@/types';
```

---

## Issue 6: Silent Error Failures

### Severity: 🟡 MEDIUM
### Impact: Hard to debug, silent failures

#### Location: ActivityTracker
- **File**: `src/lib/activity-tracker.ts`
- **Lines**: 77-96

```typescript
static getActivities(): ActivityDisplay[] {
  try {
    const activities = this.getActivitiesRaw();
    
    return activities.map(activity => ({
      ...activity,
      date: this.getFormattedDate(new Date(activity.timestamp)),
    }));
  } catch (err) {
    console.error('Failed to retrieve activities:', err);
    return [];  // ← Silent failure, returns empty
  }
}
```

**Problem**:
- Returns empty array on any error
- User sees blank activity list with no indication of failure
- Hard to debug

**How to Fix**: Add validation:
```typescript
static getActivities(): ActivityDisplay[] {
  try {
    const activities = this.getActivitiesRaw();
    if (!Array.isArray(activities)) return [];
    
    return activities
      .map(activity => ({
        ...activity,
        date: this.getFormattedDate(new Date(activity.timestamp)),
      }))
      .filter(a => a && a.date);  // Validate before returning
  } catch (err) {
    console.error('[ActivityTracker] Failed to retrieve activities:', err);
    return [];
  }
}
```

---

## Issue 7: Weak TypeScript Configuration

### Severity: 🟢 LOW
### Impact: Misses potential bugs at compile time

#### Location: TypeScript Config
- **File**: `tsconfig.json`

**Problem Code**:
```json
{
  "noImplicitAny": false,  // ← Should be true
  "noUnusedParameters": false,  // ← Should be true
  "noUnusedLocals": false,  // ← Should be true
  "strict": false,  // ← Should be true
  "strictNullChecks": false  // ← Should be true
}
```

**How to Fix**:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "strictNullChecks": true
}
```

---

## Issue 8: Unused Dependency

### Severity: 🟢 LOW
### Impact: Unnecessary package size

#### Location: Package Dependencies
- **File**: `package.json`
- **Line**: Search for `lovable-tagger`

```json
"lovable-tagger": "^1.1.7"  // ← NO USAGE IN CODEBASE
```

**Verification**: Searched entire workspace with grep:
```bash
grep -r "lovable-tagger" src/
grep -r "lovable-tagger" pages/
# Result: No matches found
```

**How to Fix**:
```bash
npm remove lovable-tagger
```

---

## Issue 9: Naming Inconsistencies

### Severity: 🟢 LOW
### Impact: Confusing for developers

#### Locations: Page Components

**Inconsistent naming pattern**:

```typescript
// Exercises.tsx line 41
const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);

// Methods.tsx line 42
const [methodDialogOpen, setMethodDialogOpen] = useState(false);

// TrainingSchedule.tsx line 52
const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

// WorkoutSheets.tsx line 52
const [workoutSheetDialogOpen, setWorkoutSheetDialogOpen] = useState(false);
```

All are dialog open state, but named inconsistently.

**How to Fix**: Standardize to `<Type>DialogOpen`:
```typescript
const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
const [methodDialogOpen, setMethodDialogOpen] = useState(false);
const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
```

---

## Summary Table

| Issue | File(s) | Lines | Severity | Type |
|-------|---------|-------|----------|------|
| Duplicate page code | Exercises, Methods, TrainingSchedule | Multiple | 🔴 CRITICAL | Maintainability |
| Duplicate API handlers | pages/api/** | Multiple | 🟠 HIGH | Maintainability |
| Raw fetch() usage | useWorkoutSheetsFilter, Home.tsx | 32-95 | 🟠 HIGH | Consistency |
| Unused state | WorkoutSheets.tsx | 54-58 | 🟡 MEDIUM | Dead code |
| Duplicate types | hooks and types/ | Multiple | 🟡 MEDIUM | Consistency |
| Silent errors | ActivityTracker | 77-96 | 🟡 MEDIUM | Error handling |
| Weak TypeScript | tsconfig.json | All | 🟢 LOW | Config |
| Unused dependency | package.json | 1 line | 🟢 LOW | Cleanup |
| Naming | Multiple | Various | 🟢 LOW | Consistency |

---

## Next Steps

1. **Start with High-Value Quick Wins** (30 min total):
   - Remove lovable-tagger
   - Remove unused state in WorkoutSheets
   - Fix Home.tsx to use apiGet

2. **Medium-Term Refactoring** (3 hours):
   - Create use-list-page hook
   - Refactor Exercises/Methods/TrainingSchedule

3. **Long-Term Improvements** (5+ hours):
   - Create API handler factory
   - Enable strict TypeScript
   - Add error boundaries
