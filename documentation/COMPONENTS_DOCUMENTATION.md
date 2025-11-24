# Component Documentation

This section provides comprehensive documentation for all important reusable components in the Tay Training application. Components are organized by category: Dialogs, Forms, Layout, and UI Primitives.

**Last Updated**: November 24, 2025  
**Status**: ✅ Current and Accurate  
**New Components**: Exercises.tsx page component added

---

## Overview

| Category | Components | Purpose |
|----------|-----------|---------|
| **Dialogs** | ExerciseDialog, MethodDialog, WorkoutSheetDialog, CategoryFilterDialog | Full-screen modals for complex forms |
| **Forms** | Input, Textarea, Select, Checkbox | Form field components |
| **Layout** | Card, Table, Dialog Content | Structural layout components |
| **UI Primitives** | Button, Skeleton, Badge | Basic interactive elements |

---

## Dialog Components

Dialogs are complex, full-featured modal components for creating, editing, and viewing data. All dialogs use Radix UI Dialog as the base with Framer Motion animations.

### ExerciseDialog

#### Purpose

A comprehensive dialog for creating, editing, and viewing exercises. Supports video URL display, description editing, and method flag configuration. Includes delete functionality in view mode.

#### Props

```typescript
interface ExerciseDialogProps {
  open: boolean;                          // Control dialog visibility
  onOpenChange: (open: boolean) => void;  // Called when dialog should close
  isEditing?: boolean;                    // Edit mode (default: false)
  initialData?: ExerciseData | null;      // Exercise data for editing/viewing
  onSaved?: (exercise: ExerciseData) => void;  // Callback after save
}

interface ExerciseData {
  id?: number;
  name: string;
  description: string;
  videoUrl?: string | null;
  hasMethod?: boolean;
}
```

#### States & Modes

| Mode | Condition | Behavior |
|------|-----------|----------|
| **Create** | `isEditing=false` && `!initialData` | Empty form for new exercise |
| **Edit** | `isEditing=true` && `initialData` | Pre-filled form for updating |
| **View** | `isEditing=false` && `initialData` | Read-only view with video player and delete button |

#### Features

- **Video Display:** Shows embedded video player in view mode using VideoPlayer component
- **Form Fields:** Name, description (required), video URL, hasMethod checkbox
- **Activity Tracking:** Logs exercise creation/editing via ActivityTracker
- **Global Loading:** Uses `useLoading` hook to manage global loading state
- **Toast Notifications:** Shows success/error messages via `useToast`
- **Animations:** Modal slide-up, fade-in, and list item stagger animations

#### Example Usage - Create Exercise

```typescript
import ExerciseDialog from '@/components/dialogs/ExerciseDialog';
import { useState } from 'react';

export function ExercisesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExerciseSaved = (exercise) => {
    console.log('Exercise saved:', exercise);
    // Refresh exercises list
  };

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>
        Add Exercise
      </button>

      <ExerciseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={false}
        onSaved={handleExerciseSaved}
      />
    </>
  );
}
```

#### Example Usage - Edit Exercise

```typescript
function ExerciseCard({ exercise }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card onClick={() => setEditOpen(true)}>
        <h3>{exercise.name}</h3>
        <p>{exercise.description}</p>
      </Card>

      <ExerciseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        isEditing={true}
        initialData={exercise}
        onSaved={() => {
          setEditOpen(false);
          // Refresh list
        }}
      />
    </>
  );
}
```

#### API Integration

- **POST** `/api/db/exercises` – Create new exercise
- **PUT** `/api/db/exercises/{id}` – Update exercise
- **DELETE** `/api/db/exercises/{id}` – Delete exercise
- **Validation:** Description required (min 1 character, trimmed)

---

### MethodDialog

#### Purpose

Dialog for creating, editing, and viewing training methods. Simpler than ExerciseDialog but follows the same pattern with name and description fields.

#### Props

```typescript
interface MethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  initialData?: MethodData | null;
  onSaved?: (method: MethodData) => void;
}

interface MethodData {
  id?: number;
  name: string;
  description: string;
}
```

#### Features

- **Three Modes:** Create, Edit, View
- **Delete Button:** Available in view mode with confirmation
- **Validation:** Name and description both required
- **Activity Tracking:** Logs method changes
- **Global Loading State:** Integrated with useLoading

#### Example Usage

```typescript
import MethodDialog from '@/components/dialogs/MethodDialog';

export function MethodsList({ methods }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEdit = (method) => {
    setSelectedMethod(method);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4">
        {methods.map(method => (
          <Card key={method.id} onClick={() => handleEdit(method)}>
            <h3>{method.name}</h3>
            <p>{method.description}</p>
          </Card>
        ))}
      </div>

      <MethodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={true}
        initialData={selectedMethod}
        onSaved={() => setDialogOpen(false)}
      />
    </>
  );
}
```

#### API Integration

- **POST** `/api/db/methods` – Create method
- **PUT** `/api/db/methods/{id}` – Update method
- **DELETE** `/api/db/methods/{id}` – Delete method

---

### WorkoutSheetDialog

#### Purpose

Complex dialog for creating and editing workout sheets with nested exercise groups, methods, and configurations. Supports multiple exercise groups with hierarchical exercise method organization.

#### Props

```typescript
interface WorkoutSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  initialData?: unknown;
  onSuccess?: (data: unknown) => void;
}
```

#### Structure & Hierarchy

```
WorkoutSheet
├── name (string)
├── categoryId (number)
└── exerciseMethods[] (array)
    ├── rest (string, e.g., "60s")
    ├── observations (string)
    └── exercises[] (array)
        ├── exerciseId (number)
        ├── methodId (number)
        ├── series (string, e.g., "4")
        └── reps (string, e.g., "8-10")
```

#### Features

- **Group Selector Bar:** Switch between multiple exercise groups (max 15)
- **Accordion Interface:** Collapse/expand methods within groups
- **Nested Exercise Cards:** Visual organization of exercises
- **Auto-loading:** Fetches categories, exercises, and methods on dialog open
- **Transactional State:** All nested data updates together
- **Scroll Auto-focus:** Active group button auto-scrolls into view
- **Group Management:** Add/remove/rename groups with full state sync

#### Example Usage - Create Workout Sheet

```typescript
import WorkoutSheetDialog from '@/components/dialogs/WorkoutSheetDialog';

export function TrainingSchedulePage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = (sheet) => {
    console.log('Workout sheet created:', sheet);
    // Refresh sheets list
    setDialogOpen(false);
  };

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>
        Create Workout Sheet
      </button>

      <WorkoutSheetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={false}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

#### Form Sections

**1. Basic Info Section (Blue gradient):**
- Name input
- Category select dropdown

**2. Group Selector (Slate gradient):**
- `GroupSelectorBar` component
- Horizontal scrollable group tabs
- Add group button
- Remove group button

**3. Exercise Methods Section (Per group):**
- Accordion containing methods
- Method inputs: rest time, observations
- Exercise card grid (blue gradient)
- Exercise inputs: exercise select, method select, series, reps

#### API Integration

- **POST** `/api/exercise-groups` – Create group
- **PUT** `/api/exercise-groups/{id}` – Update group
- **GET** `/api/categories` – Load categories
- **GET** `/api/db/exercises` – Load exercises
- **GET** `/api/db/methods` – Load methods

---

### CategoryFilterDialog

#### Purpose

Provides category filtering UI for workout sheets. Allows users to select a single category or view all categories. Includes loading and error states.

#### Props

```typescript
interface CategoryFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  isLoading?: boolean;
  error?: string | null;
}

interface Category {
  id: number;
  name: string;
}
```

#### Features

- **Single Select:** Only one category selected at a time
- **All Categories Option:** First button to view all/clear filter
- **Loading State:** Shows skeleton loaders while fetching
- **Error Display:** Shows error message if fetch fails
- **Visual Feedback:** Checkmark for selected category, styled button states
- **Clear Filter Button:** Remove current filter and show all

#### Example Usage

```typescript
import { CategoryFilterDialog } from '@/components/dialogs/CategoryFilterDialog';
import { useWorkoutSheetsFilter } from '@/hooks/use-workout-sheets-filter';

export function WorkoutSheetsPage() {
  const {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    isLoading,
    error,
  } = useWorkoutSheetsFilter();

  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <button onClick={() => setFilterOpen(true)}>
        Filter by Category
      </button>

      <CategoryFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
```

---

## Form Components

### Input

#### Purpose

Standard text input field for form entries. Base component from Radix UI with custom styling.

#### Props

```typescript
interface InputProps extends React.ComponentProps<"input"> {
  // Standard HTML input attributes
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // ... all standard HTML input props
}
```

#### Styling

- **Height:** 40px (h-10)
- **Border:** 1px solid, muted color
- **Focus:** Ring-2 with offset
- **Disabled:** Reduced opacity, cursor not-allowed

#### Example Usage

```typescript
import { Input } from '@/components/ui/input';

export function SearchForm() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Input
      type="text"
      placeholder="Search exercises..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full"
    />
  );
}
```

---

### Textarea

#### Purpose

Multi-line text input for longer content like descriptions. Similar to Input but for block text.

#### Props

```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // ... all standard HTML textarea props
}
```

#### Styling

- **Min Height:** 80px
- **Resizable:** Yes (default browser behavior)
- **Focus:** Ring-2 with offset
- **Placeholder:** Muted color

#### Example Usage

```typescript
import { Textarea } from '@/components/ui/textarea';

export function ExerciseForm() {
  const [description, setDescription] = useState('');

  return (
    <Textarea
      placeholder="Describe how to execute the exercise..."
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="min-h-[100px]"
      required
    />
  );
}
```

---

## Layout Components

### Card

#### Purpose

Container component for grouping related content. Can be animated with optional entrance animations.

#### Props

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean;    // Enable Framer Motion animations
  delay?: number;        // Animation delay in seconds
  className?: string;
  children?: React.ReactNode;
}
```

#### Sub-components

```typescript
// CardHeader: Top section with padding
<CardHeader className="pb-2">
  {/* Usually contains title and description */}
</CardHeader>

// CardTitle: Large heading (2xl font)
<CardTitle>Bench Press</CardTitle>

// CardDescription: Subtitle text (muted color)
<CardDescription>Upper body push movement</CardDescription>

// CardContent: Main content area
<CardContent>
  {/* Main information */}
</CardContent>

// CardFooter: Bottom section, flex row by default
<CardFooter>
  {/* Buttons or action elements */}
</CardFooter>
```

#### Example Usage - Static Card

```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export function ExerciseCard({ exercise }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.name}</CardTitle>
        <CardDescription>
          {exercise.hasMethod ? 'Uses specific training method' : 'No specific method'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{exercise.description}</p>
      </CardContent>
      <CardFooter>
        <button>Edit</button>
        <button>Delete</button>
      </CardFooter>
    </Card>
  );
}
```

#### Example Usage - Animated Card Grid

```typescript
export function ExercisesGrid({ exercises }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {exercises.map((exercise, index) => (
        <Card key={exercise.id} animated delay={index * 0.1}>
          <CardHeader>
            <CardTitle>{exercise.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{exercise.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### Table

#### Purpose

Semantic table component with proper HTML table structure and consistent styling. Includes hover effects and selection states.

#### Sub-components

```typescript
// Table: Root wrapper, provides horizontal scroll
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
  <TableFooter>...</TableFooter>
</Table>

// TableHeader: <thead> element
<TableHeader>
  <TableRow>
    <TableHead>Column</TableHead>
  </TableRow>
</TableHeader>

// TableBody: <tbody> element
<TableBody>
  <TableRow>
    <TableCell>Data</TableCell>
  </TableRow>
</TableBody>

// TableRow: <tr> with hover state
<TableRow>
  <TableCell>...</TableCell>
</TableRow>

// TableHead: <th> with muted foreground
<TableHead>Header Text</TableHead>

// TableCell: <td> with padding
<TableCell>Cell Data</TableCell>

// TableCaption: Table description below table
<TableCaption>List of exercises</TableCaption>
```

#### Features

- **Responsive:** Horizontal scroll on small screens
- **Hover State:** Rows highlight on hover
- **Selection Support:** `data-[state=selected]` attribute for styling
- **Sticky Header:** Use CSS to make header sticky
- **Word Break:** Auto-wrapping for cell content

#### Example Usage

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';

export function ExercisesTable({ exercises }) {
  return (
    <Table>
      <TableCaption>All exercises in the system</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Video</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map(exercise => (
          <TableRow key={exercise.id}>
            <TableCell className="font-medium">{exercise.name}</TableCell>
            <TableCell>{exercise.description}</TableCell>
            <TableCell>
              {exercise.videoUrl ? (
                <a href={exercise.videoUrl} target="_blank">View</a>
              ) : (
                'No video'
              )}
            </TableCell>
            <TableCell>
              <button>Edit</button>
              <button>Delete</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## UI Primitive Components

### Button

#### Purpose

Interactive button element with multiple variants and sizes. Uses Framer Motion for hover/tap animations.

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'step';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;  // Use slot pattern (e.g., with <a> tags)
  disabled?: boolean;
  className?: string;
}
```

#### Variants

| Variant | Use Case | Colors |
|---------|----------|--------|
| `default` | Primary action | Blue background, white text |
| `destructive` | Delete/danger | Red background, white text |
| `outline` | Secondary action | Border only, subtle background |
| `secondary` | Alternative action | Gray background |
| `ghost` | Minimal action | Transparent, hover highlight |
| `link` | Text link | Underlined primary text |
| `step` | Wizard steps | Circle badges, toggleable state |

#### Sizes

| Size | Dimensions | Use |
|------|-----------|-----|
| `default` | 40px height | General purpose |
| `sm` | 36px height | Compact areas |
| `lg` | 44px height | Prominent CTAs |
| `icon` | 40px × 40px | Icon-only buttons |

#### Animations

- **Hover:** Scale 1.02, slight upward movement
- **Tap:** Scale 0.97 (press effect)
- **Disabled:** No animations, opacity reduced

#### Example Usage - Default Buttons

```typescript
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';

export function ExerciseActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2">
      <Button onClick={onEdit} className="gap-2">
        <Edit className="h-4 w-4" />
        Edit
      </Button>

      <Button onClick={onDelete} variant="destructive" className="gap-2">
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>

      <Button variant="outline">Cancel</Button>

      <Button variant="ghost">Skip</Button>
    </div>
  );
}
```

#### Example Usage - Icon Buttons

```typescript
export function Toolbar() {
  return (
    <div className="flex gap-1">
      <Button size="icon" variant="ghost">
        <Plus className="h-4 w-4" />
      </Button>

      <Button size="icon" variant="ghost">
        <Trash2 className="h-4 w-4" />
      </Button>

      <Button size="icon" variant="outline">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

#### Example Usage - Wizard Steps

```typescript
export function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <Button
          key={i + 1}
          variant="step"
          data-active={i + 1 === currentStep}
          data-completed={i + 1 < currentStep}
        >
          {i + 1}
        </Button>
      ))}
    </div>
  );
}
```

---

### Skeleton

#### Purpose

Loading placeholder component that animates with pulse effect. Used to show content loading state before data arrives.

#### Props

```typescript
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
```

#### Styling

- **Animation:** Pulse (fade in/out)
- **Color:** Muted background
- **Border Radius:** Medium (md)
- **Default Size:** Full width, requires explicit height

#### Example Usage - Card Skeleton

```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ExerciseCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}
```

#### Example Usage - Lazy Loading List

```typescript
export function ExercisesListLoading() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}
```

---

### GroupSelectorBar

#### Purpose

Specialized component for selecting between multiple groups in the WorkoutSheetDialog. Provides horizontal scrolling with auto-focus and add/remove group functionality.

#### Props

```typescript
interface GroupSelectorBarProps {
  groups: Group[];
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onAddGroup: () => void;
  onRemoveGroup: (groupId: string) => void;
  onRenameGroup?: (groupId: string, newName: string) => void;
  isLoading?: boolean;
}

interface Group {
  id: string;
  name: string;
}
```

#### Features

- **Horizontal Scroll:** Groups tab out of view, scroll buttons appear
- **Auto-focus:** Active group button auto-scrolls into center view
- **Dynamic Buttons:** Left/right scroll arrows show/hide based on scroll position
- **Add Group:** Plus button to create new group (max 15 groups)
- **Remove Group:** X button to delete active group (only if > 1 group)
- **Smooth Animation:** Fade and scale animations for show/hide

#### Example Usage

```typescript
import GroupSelectorBar from '@/components/dialogs/GroupSelectorBar';

export function ExerciseGroups() {
  const [groups, setGroups] = useState([
    { id: '1', name: 'Group 1' },
    { id: '2', name: 'Group 2' },
  ]);
  const [activeId, setActiveId] = useState('1');

  const addGroup = () => {
    const newGroup = {
      id: Date.now().toString(),
      name: `Group ${groups.length + 1}`,
    };
    setGroups([...groups, newGroup]);
  };

  const removeGroup = (groupId) => {
    if (groups.length > 1) {
      setGroups(groups.filter(g => g.id !== groupId));
      setActiveId(groups[0].id);
    }
  };

  return (
    <>
      <GroupSelectorBar
        groups={groups}
        activeGroupId={activeId}
        onSelectGroup={setActiveId}
        onAddGroup={addGroup}
        onRemoveGroup={removeGroup}
      />

      {/* Render content for active group */}
      {activeGroup && <GroupContent group={activeGroup} />}
    </>
  );
}
```

---

## Common Patterns

### Pattern 1: Dialog with Loading and Error States

```typescript
export function ExerciseList() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isLoading, startLoading, stopLoading } = useLoading();
  const { toast } = useToast();

  const handleEdit = (exercise) => {
    setSelectedExercise(exercise);
    setDialogOpen(true);
  };

  const handleSaved = async (updated) => {
    startLoading();
    try {
      // Refresh exercise
      const response = await fetch(`/api/db/exercises/${updated.id}`);
      const data = await response.json();
      setSelectedExercise(data.data);
      toast({ title: 'Success', description: 'Exercise updated' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh exercise',
        variant: 'destructive',
      });
    } finally {
      stopLoading();
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="space-y-2">
        {exercises.map(ex => (
          <Card key={ex.id} onClick={() => handleEdit(ex)}>
            <CardHeader>
              <CardTitle>{ex.name}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <ExerciseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={true}
        initialData={selectedExercise}
        onSaved={handleSaved}
      />
    </>
  );
}
```

### Pattern 2: Card Grid with Pagination

```typescript
import { usePagination } from '@/hooks/use-pagination';

export function ExercisesGrid({ exercises }) {
  const {
    currentPageItems,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
  } = usePagination({
    items: exercises,
    itemsPerPage: 12,
  });

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {currentPageItems.map((ex, i) => (
          <Card key={ex.id} animated delay={i * 0.05}>
            <CardHeader>
              <CardTitle>{ex.name}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </>
  );
}
```

### Pattern 3: Filtered List with Table

```typescript
export function MethodsTableWithFilter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [methods, setMethods] = useState([]);

  const filtered = methods.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    currentPageItems,
    totalPages,
  } = usePagination({
    items: filtered,
    itemsPerPage: 20,
    searchDependency: searchTerm,
  });

  return (
    <>
      <Input
        placeholder="Search methods..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPageItems.map(method => (
            <TableRow key={method.id}>
              <TableCell className="font-medium">{method.name}</TableCell>
              <TableCell>{method.description}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
```

---

## Component Composition Hierarchy

```
Layout
├── Card
│   ├── CardHeader
│   │   ├── CardTitle
│   │   └── CardDescription
│   ├── CardContent
│   └── CardFooter
│
├── Table
│   ├── TableHeader
│   │   └── TableRow
│   │       └── TableHead
│   └── TableBody
│       └── TableRow
│           └── TableCell
│
└── Dialog
    ├── DialogHeader
    │   ├── DialogTitle
    │   └── DialogDescription
    ├── DialogContent
    └── DialogFooter
        └── Button

Forms
├── Input
├── Textarea
├── Select
├── Checkbox
└── Label

Dialogs (Complex Components)
├── ExerciseDialog
├── MethodDialog
├── WorkoutSheetDialog
└── CategoryFilterDialog

Utilities
├── Button (multiple variants)
├── Skeleton
├── Badge
└── GroupSelectorBar
```

---

## Accessibility Features

All components include:

| Feature | Implementation |
|---------|-----------------|
| **Focus Management** | Keyboard navigation, visible focus indicators |
| **ARIA Labels** | Proper semantic HTML and ARIA attributes |
| **Color Contrast** | WCAG AA compliant color combinations |
| **Disabled States** | Clear visual indication of disabled elements |
| **Keyboard Support** | Tab, Enter, Escape key handling |

---

## Performance Considerations

### Card Component

- **Animated Cards:** Only animate visible cards to prevent performance issues
- **Delay Prop:** Stagger animations for smoother UX

### Table Component

- **Horizontal Scroll:** Prevents layout shift on small screens
- **Large Datasets:** Consider virtual scrolling for 1000+ rows

### Dialog Components

- **Lazy Loading:** Fetch data on dialog open, not on component mount
- **Nested State:** Use React state carefully to prevent excessive re-renders

### Button Component

- **Motion Animations:** Disabled buttons skip animations to save CPU

---

## Summary

| Component | Type | Use Case | Key Feature |
|-----------|------|----------|-------------|
| ExerciseDialog | Dialog | Create/edit/view exercises | Video player, description editor |
| MethodDialog | Dialog | Create/edit/view methods | Name + description form |
| WorkoutSheetDialog | Dialog | Complex nested forms | Multiple groups, accordion layout |
| CategoryFilterDialog | Dialog | Category selection | Single-select, all categories option |
| Card | Layout | Content container | Animated entrance option |
| Table | Layout | Tabular data | Hover effects, semantic HTML |
| Input | Form | Text entry | Standard field with focus ring |
| Textarea | Form | Multi-line text | Resizable block text |
| Button | UI | User actions | 7 variants, 4 sizes, Framer Motion |
| Skeleton | UI | Loading state | Pulse animation |
| GroupSelectorBar | Specialized | Group selection | Auto-scroll, smooth transitions |

All components are production-ready with full TypeScript support, accessibility features, and Framer Motion animations for smooth user interactions.
