# Database Schema

This section provides comprehensive documentation of the Tay Training application's PostgreSQL database schema, generated and managed through Prisma ORM.

---

## Schema Overview

The database consists of **8 core models** organized into 3 logical groups:

| Group | Models | Purpose |
|-------|--------|---------|
| **Core** | User, Menu | Authentication and configuration |
| **Exercise** | Exercise, Method, ExerciseGroup, ExerciseGroupCategory, ExerciseMethod, ExerciseConfiguration | Exercise library and organization |
| **Training** | TrainingSheet, TrainingDay | Workout schedule templates |

---

## Database Settings

```
Provider: PostgreSQL
ORM: Prisma 6.19.0
Timestamps: UTC (Timestamp)
Auto-increment: Primary keys
Cascading Deletes: Enabled for relational integrity
```

---

## Core Models

### User

Stores application user accounts with authentication credentials.

**Table Name:** `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique user identifier |
| `name` | VARCHAR(255) | NOT NULL | User display name |
| `email` | VARCHAR(255) | NOT NULL | Email address (login credential) |
| `password` | TEXT | NOT NULL | Hashed password string |
| `codeToRecovery` | VARCHAR(255) | NULL | Password reset token |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- None (no foreign keys)

**Example Data Object:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$hashed_password_string",
  "codeToRecovery": null,
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z"
}
```

**Generated SQL:**
```sql
CREATE TABLE "users" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password" TEXT NOT NULL,
  "codeToRecovery" VARCHAR(255),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### Menu

Stores menu/nutrition information with PDF links and calorie ranges.

**Table Name:** `menus`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique menu identifier |
| `name` | VARCHAR(255) | NOT NULL | Menu name |
| `description` | TEXT | NOT NULL | Menu details |
| `pdfUrl` | VARCHAR(500) | NOT NULL | URL to PDF document |
| `minCalories` | INT | NULL | Minimum calorie intake |
| `maxCalories` | INT | NULL | Maximum calorie intake |
| `status` | ENUM | DEFAULT 'ACTIVE' | Menu status (ACTIVE/INACTIVE) |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Enum Values:**
- `ACTIVE` – Menu is active
- `INACTIVE` – Menu is inactive

**Relationships:**
- None (no foreign keys)

**Example Data Object:**
```json
{
  "id": 1,
  "name": "High Protein Diet",
  "description": "High protein, moderate carbs, low fat diet plan",
  "pdfUrl": "https://cdn.example.com/menus/high-protein.pdf",
  "minCalories": 2000,
  "maxCalories": 2500,
  "status": "ACTIVE",
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z"
}
```

**Generated SQL:**
```sql
CREATE TABLE "menus" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "pdf_url" VARCHAR(500) NOT NULL,
  "min_calories" INTEGER,
  "max_calories" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Exercise Models

### Exercise

Master list of all exercises in the system.

**Table Name:** `exercises`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique exercise identifier |
| `name` | VARCHAR(255) | NOT NULL | Exercise name |
| `description` | TEXT | NULL | How to perform the exercise |
| `videoUrl` | VARCHAR(255) | NULL | Link to instructional video |
| `hasMethod` | BOOLEAN | DEFAULT true | Whether exercise uses specific methods |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **One-to-Many:** Exercise → ExerciseConfiguration
  - One exercise can have many configurations
  - Cascading delete enabled

**Example Data Object:**
```json
{
  "id": 1,
  "name": "Bench Press",
  "description": "Barbell bench press for chest development. Lie on flat bench with feet on floor. Lower barbell to chest, press back up.",
  "videoUrl": "https://youtube.com/watch?v=ScF3HXYQejU",
  "hasMethod": true,
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z"
}
```

**Common Exercises:**
- Bench Press
- Squat
- Deadlift
- Barbell Row
- Lat Pulldown
- Leg Press

---

### Method

Training methodologies and rep schemes.

**Table Name:** `methods`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique method identifier |
| `name` | VARCHAR(255) | NOT NULL | Method name |
| `description` | TEXT | NOT NULL | Method description and rules |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **One-to-Many:** Method → ExerciseConfiguration
  - One method can have many configurations
  - Cascading delete enabled

**Example Data Object:**
```json
{
  "id": 1,
  "name": "5x5 Protocol",
  "description": "5 sets of 5 reps with heavy weight. Rest 2-3 minutes between sets. Focuses on compound movements.",
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z"
}
```

**Common Methods:**
- 5x5 Protocol
- Pyramid Sets
- Drop Sets
- High Rep Endurance (3x12-15)
- AMRAP (As Many Reps As Possible)

---

### ExerciseGroupCategory

Categories for organizing exercise groups (e.g., Strength, Hypertrophy, Cardio).

**Table Name:** `exercise_group_categories`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique category identifier |
| `name` | VARCHAR(255) | NOT NULL | Category name |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **One-to-Many:** ExerciseGroupCategory → ExerciseGroup
  - One category can have many exercise groups
  - Cascading delete enabled

**Example Data Object:**
```json
{
  "id": 1,
  "name": "General",
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z"
}
```

**Example Data Object - Another:**
```json
{
  "id": 2,
  "name": "Strength",
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z"
}
```

**Default Categories:**
- General
- Strength
- Hypertrophy
- Cardio

---

### ExerciseGroup

Groups of related exercises (e.g., "Chest & Back", "Legs Day").

**Table Name:** `exercise_groups`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique exercise group identifier |
| `name` | VARCHAR(255) | NOT NULL | Group name (internal) |
| `categoryId` | INT | FK, NOT NULL | Foreign key to ExerciseGroupCategory |
| `publicName` | VARCHAR(255) | NULL | Group name (public display) |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **Many-to-One:** ExerciseGroup ← ExerciseGroupCategory
  - Foreign key: `categoryId` → `exercise_group_categories.id`
  - Cascading delete enabled
- **One-to-Many:** ExerciseGroup → ExerciseMethod
  - One group can have many exercise methods
- **One-to-Many:** ExerciseGroup → TrainingDay
  - One group can be used in many training days

**Example Data Object:**
```json
{
  "id": 5,
  "name": "Chest & Back",
  "categoryId": 2,
  "publicName": "Chest & Back Workouts",
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z",
  "category": {
    "id": 2,
    "name": "Strength"
  },
  "exerciseMethods": [...]
}
```

---

### ExerciseMethod

Specific training methods assigned to an exercise group.

**Table Name:** `exercise_methods`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique exercise method identifier |
| `rest` | VARCHAR(255) | NOT NULL | Rest duration (e.g., "60s", "90s") |
| `observations` | VARCHAR | NULL | Additional notes or warnings |
| `order` | INT | NULL | Execution order within group |
| `exerciseGroupId` | INT | FK, NOT NULL | Foreign key to ExerciseGroup |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **Many-to-One:** ExerciseMethod ← ExerciseGroup
  - Foreign key: `exerciseGroupId` → `exercise_groups.id`
  - Cascading delete enabled
- **One-to-Many:** ExerciseMethod → ExerciseConfiguration
  - One method can have many configurations
  - Cascading delete enabled

**Example Data Object:**
```json
{
  "id": 1,
  "rest": "60s",
  "observations": "Warm up first with lighter weight",
  "order": 1,
  "exerciseGroupId": 5,
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z",
  "exerciseConfigurations": [...]
}
```

---

### ExerciseConfiguration

Specific exercise configuration linking Exercise, Method, and ExerciseMethod with sets and reps.

**Table Name:** `exercise_configurations`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique configuration identifier |
| `series` | VARCHAR(255) | NOT NULL | Number of sets (e.g., "4") |
| `reps` | VARCHAR(255) | NOT NULL | Repetitions (e.g., "8-10", "5") |
| `exerciseMethodId` | INT | FK, NULL | Foreign key to ExerciseMethod |
| `exerciseId` | INT | FK, NULL | Foreign key to Exercise |
| `methodId` | INT | FK, NULL | Foreign key to Method |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **Many-to-One:** ExerciseConfiguration ← ExerciseMethod
  - Foreign key: `exerciseMethodId` → `exercise_methods.id`
  - Cascading delete enabled
- **Many-to-One:** ExerciseConfiguration ← Exercise
  - Foreign key: `exerciseId` → `exercises.id`
  - Cascading delete enabled
- **Many-to-One:** ExerciseConfiguration ← Method
  - Foreign key: `methodId` → `methods.id`
  - Cascading delete enabled

**Example Data Object:**
```json
{
  "id": 1,
  "series": "4",
  "reps": "8-10",
  "exerciseMethodId": 1,
  "exerciseId": 10,
  "methodId": 3,
  "createdAt": "2025-11-21T10:00:00Z",
  "updatedAt": "2025-11-21T10:00:00Z",
  "exercise": {
    "id": 10,
    "name": "Bench Press",
    "description": "Barbell bench press"
  },
  "method": {
    "id": 3,
    "name": "5x5 Protocol",
    "description": "5 sets of 5 reps with heavy weight"
  }
}
```

---

## Training Models

### TrainingSheet

Workout program templates containing multiple training days.

**Table Name:** `training_sheets`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique training sheet identifier |
| `name` | VARCHAR(255) | NOT NULL | Workout program name (internal) |
| `publicName` | VARCHAR(255) | NULL | Workout program name (public display) |
| `slug` | VARCHAR(255) | NULL | URL-friendly slug |
| `offlinePdf` | VARCHAR(255) | NULL | Offline PDF file reference |
| `newTabPdf` | VARCHAR(255) | NULL | PDF to open in new tab |
| `pdfPath` | VARCHAR(255) | NULL | Path to PDF document |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **One-to-Many:** TrainingSheet → TrainingDay
  - One training sheet can have many training days
  - Cascading delete enabled

**Example Data Object:**
```json
{
  "id": 1,
  "name": "Full Body Workout",
  "publicName": "Full Body Strength Program",
  "slug": "full-body-workout",
  "offlinePdf": null,
  "newTabPdf": null,
  "pdfPath": null,
  "createdAt": "2025-11-21T10:30:00Z",
  "updatedAt": "2025-11-21T10:30:00Z",
  "trainingDays": [...]
}
```

**Common Patterns:**
- Full Body Workout
- Push/Pull/Legs (PPL)
- Upper/Lower Split
- 4-Day Split

---

### TrainingDay

Individual days within a training sheet, linking to exercise groups.

**Table Name:** `training_days`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Unique training day identifier |
| `day` | INT | NOT NULL | Day number (1, 2, 3, etc.) |
| `trainingSheetId` | INT | FK, NOT NULL | Foreign key to TrainingSheet |
| `exerciseGroupId` | INT | FK, NOT NULL | Foreign key to ExerciseGroup |
| `shortName` | VARCHAR(255) | NULL | Short name (e.g., "Monday", "Day 1") |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- **Many-to-One:** TrainingDay ← TrainingSheet
  - Foreign key: `trainingSheetId` → `training_sheets.id`
  - Cascading delete enabled
- **Many-to-One:** TrainingDay ← ExerciseGroup
  - Foreign key: `exerciseGroupId` → `exercise_groups.id`
  - Cascading delete enabled

**Example Data Object:**
```json
{
  "id": 1,
  "day": 1,
  "trainingSheetId": 1,
  "exerciseGroupId": 5,
  "shortName": "Monday - Chest & Back",
  "createdAt": "2025-11-21T10:30:00Z",
  "updatedAt": "2025-11-21T10:30:00Z",
  "trainingSheet": {
    "id": 1,
    "name": "Full Body Workout"
  },
  "exerciseGroup": {
    "id": 5,
    "name": "Chest & Back",
    "exerciseMethods": [...]
  }
}
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER                                   │
│ ─────────────────────────────────────────────────────────────── │
│ PK: id (INT)                                                    │
│     name (VARCHAR)                                              │
│     email (VARCHAR)                                             │
│     password (TEXT)                                             │
│     codeToRecovery (VARCHAR, NULL)                              │
│     createdAt, updatedAt (TIMESTAMP)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          MENU                                   │
│ ─────────────────────────────────────────────────────────────── │
│ PK: id (INT)                                                    │
│     name (VARCHAR)                                              │
│     description (TEXT)                                          │
│     pdfUrl (VARCHAR)                                            │
│     minCalories, maxCalories (INT, NULL)                        │
│     status (ENUM: ACTIVE/INACTIVE)                              │
│     createdAt, updatedAt (TIMESTAMP)                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│        EXERCISE GROUP CATEGORY (Central Organizer)              │
│ ──────────────────────────────────────────────────────────────── │
│ PK: id (INT)                                                     │
│     name (VARCHAR)                                               │
│     createdAt, updatedAt (TIMESTAMP)                             │
└──────────────────────────────────────────────────────────────────┘
           │ 1
           │ OneToMany (Cascade Delete)
           │ ∞ Many
           ▼
┌──────────────────────────────────────────────────────────────────┐
│              EXERCISE GROUP                                      │
│ ──────────────────────────────────────────────────────────────── │
│ PK: id (INT)                                                     │
│     name (VARCHAR)                                               │
│ FK: categoryId → ExerciseGroupCategory.id                        │
│     publicName (VARCHAR, NULL)                                   │
│     createdAt, updatedAt (TIMESTAMP)                             │
└──────────────────────────────────────────────────────────────────┘
           │ 1
           │ OneToMany (Cascade Delete)
           ├─────────────────────────────────┐
           │ ∞ Many                          │ ∞ Many
           ▼                                 ▼
    ┌──────────────────────┐         ┌─────────────────────┐
    │ EXERCISE METHOD      │         │ TRAINING DAY        │
    │ ────────────────────│         │────────────────────│
    │ PK: id              │         │ PK: id              │
    │ FK: exerciseGroupId│         │ FK: trainingSheetId│
    │     rest (VARCHAR) │         │ FK: exerciseGroupId│
    │     observations   │         │     day (INT)       │
    │     order (INT)    │         │     shortName       │
    └──────────────────────┘         └─────────────────────┘
           │ 1                               ▲ Many
           │ OneToMany (Cascade Delete)      │
           │ ∞ Many                          │ ManyToOne
           ▼                                 │
    ┌──────────────────────┐         ┌─────────────────────┐
    │ EXERCISE             │         │ TRAINING SHEET      │
    │ CONFIGURATION        │         │─────────────────────│
    │ ────────────────────│         │ PK: id              │
    │ PK: id              │         │     name (VARCHAR)  │
    │ FK: exerciseMethodId│         │     publicName      │
    │ FK: exerciseId      │         │     slug            │
    │ FK: methodId        │         │     offlinePdf      │
    │     series (VARCHAR)│         │     newTabPdf       │
    │     reps (VARCHAR)  │         │     pdfPath         │
    └──────────────────────┘         └─────────────────────┘
           △ Many
           │ ManyToOne (Cascade Delete)
           │
    ┌──────────────────┐    ┌────────────────────┐
    │ EXERCISE         │    │ METHOD             │
    │──────────────────│    │────────────────────│
    │ PK: id           │    │ PK: id             │
    │     name         │    │     name (VARCHAR) │
    │     description  │    │     description    │
    │     videoUrl     │    │     createdAt      │
    │     hasMethod    │    │     updatedAt      │
    └──────────────────┘    └────────────────────┘
```

---

## Cascade Delete Behavior

All relationships implement **onDelete: Cascade** to maintain referential integrity:

| When Deleted | Cascades To | Result |
|--------------|------------|--------|
| ExerciseGroupCategory | ExerciseGroup | All groups in category deleted |
| ExerciseGroup | ExerciseMethod | All methods in group deleted |
| ExerciseGroup | TrainingDay | All training days using group deleted |
| ExerciseMethod | ExerciseConfiguration | All configs using method deleted |
| Exercise | ExerciseConfiguration | All configs using exercise deleted |
| Method | ExerciseConfiguration | All configs using method deleted |
| TrainingSheet | TrainingDay | All days in sheet deleted |

---

## Common Query Patterns

### Get Full Training Sheet with All Details

```prisma
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
                  include: {
                    exercise: true,
                    method: true,
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});
```

### Get Exercise Group with Category

```prisma
const group = await prisma.exerciseGroup.findUnique({
  where: { id: 5 },
  include: {
    category: true,
    exerciseMethods: {
      include: {
        exerciseConfigurations: {
          include: {
            exercise: true,
            method: true,
          }
        }
      }
    }
  }
});
```

### Get All Exercises for a Category

```prisma
const exercises = await prisma.exerciseConfiguration.findMany({
  where: {
    exerciseMethod: {
      exerciseGroup: {
        categoryId: 2
      }
    }
  },
  include: {
    exercise: true,
    method: true
  }
});
```

### Create Training Sheet with Nested Data

```prisma
const sheet = await prisma.trainingSheet.create({
  data: {
    name: "Push/Pull/Legs",
    publicName: "PPL Routine",
    trainingDays: {
      create: [
        {
          day: 1,
          shortName: "Push",
          exerciseGroupId: 1
        },
        {
          day: 2,
          shortName: "Pull",
          exerciseGroupId: 2
        },
        {
          day: 3,
          shortName: "Legs",
          exerciseGroupId: 3
        }
      ]
    }
  },
  include: { trainingDays: true }
});
```

---

## Data Types Reference

| Prisma Type | PostgreSQL Type | Description | Max Length |
|-------------|-----------------|-------------|-----------|
| String | VARCHAR/TEXT | Text data | Varies |
| Int | INTEGER | Whole numbers | 2,147,483,647 |
| Boolean | BOOLEAN | True/False | - |
| DateTime | TIMESTAMP | Date and time | - |
| Enum | TEXT | Fixed set of values | - |

---

## Performance Indexes

Key columns with indexes (implicitly created by Prisma):

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| training_sheets | id | PK | Primary key lookup |
| training_days | trainingSheetId | FK | Query days by sheet |
| training_days | exerciseGroupId | FK | Query days by group |
| exercise_groups | categoryId | FK | Query groups by category |
| exercise_methods | exerciseGroupId | FK | Query methods by group |
| exercise_configurations | exerciseMethodId | FK | Query configs by method |
| exercise_configurations | exerciseId | FK | Query configs by exercise |
| exercise_configurations | methodId | FK | Query configs by method |

---

## Migrations

Schema is version-controlled via Prisma migrations located in `prisma/migrations/`:

| Migration | Changes |
|-----------|---------|
| `20251118133629_init` | Initial schema creation |
| `20251118_add_default_category` | Added default "General" category |
| `20251118_make_categoryid_nullable` | Made categoryId nullable |

---

## Database Constraints

### Primary Keys
- All models use auto-incrementing `INT` primary keys
- Ensures unique identification

### Foreign Keys
- All foreign keys enforce referential integrity
- Cascade delete on removal
- Prevents orphaned records

### Timestamps
- All models include `createdAt` and `updatedAt`
- Automatically managed by Prisma
- UTC timezone

### Enums
- ExerciseStatus: `ACTIVE`, `INACTIVE`
- Enforced at database level

---

## Null Handling

| Field | Nullable | Default Behavior |
|-------|----------|------------------|
| User.codeToRecovery | Yes | NULL until recovery requested |
| Menu.minCalories/maxCalories | Yes | Optional calorie range |
| Exercise.description | Yes | Optional exercise description |
| Exercise.videoUrl | Yes | Optional instructional video |
| ExerciseGroup.publicName | Yes | Uses name if publicName empty |
| ExerciseMethod.observations | Yes | Optional additional notes |
| ExerciseMethod.order | Yes | Execution order (optional) |
| TrainingDay.shortName | Yes | Optional short identifier |

---

## Summary Table

| Model | Rows Estimate | Primary Use | Relationships |
|-------|--------------|-------------|---------------|
| User | 100-1000 | Authentication | None |
| Menu | 10-50 | Nutrition info | None |
| Exercise | 50-200 | Exercise library | Many configs |
| Method | 10-50 | Training methods | Many configs |
| ExerciseGroupCategory | 5-20 | Organization | Many groups |
| ExerciseGroup | 50-200 | Exercise collections | Many methods, days |
| ExerciseMethod | 100-500 | Training specifications | Many configs |
| ExerciseConfiguration | 500-2000 | Set/rep details | Exercises, methods |
| TrainingSheet | 20-100 | Workout programs | Many days |
| TrainingDay | 100-500 | Program days | One group |

---

## Connection String

```
postgresql://username:password@localhost:5432/tay_training
```

Environment variable: `DATABASE_URL`

---

## Prisma Client Usage

Initialize Prisma client in your application:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use prisma for queries
const exercises = await prisma.exercise.findMany();
```

See `src/lib/prisma.ts` for application initialization.
