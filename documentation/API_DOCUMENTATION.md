# API Documentation

This section provides comprehensive documentation for all REST API endpoints available in the Tay Training application. All endpoints follow a standardized response format and implement validation using Zod schemas.

---

## Response Format

All API responses follow a standardized format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "count": 10,
    "page": 1,
    "pageSize": 20,
    "total": 50
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": "Error message describing what went wrong"
}
```

---

## Training Sheets

### GET /api/training-sheets
Retrieve all training sheets or a specific sheet by ID.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | No | If provided, returns single sheet; otherwise returns all sheets |

**Response (All Sheets - Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Full Body Workout",
      "publicName": "Full Body Workout",
      "slug": "full-body-workout",
      "offlinePdf": null,
      "newTabPdf": null,
      "pdfPath": null,
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z",
      "trainingDays": [
        {
          "id": 1,
          "day": 1,
          "trainingSheetId": 1,
          "exerciseGroupId": 5,
          "shortName": "Day 1",
          "createdAt": "2025-11-21T10:30:00Z",
          "updatedAt": "2025-11-21T10:30:00Z",
          "exerciseGroup": {
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
                "exerciseGroupId": 5,
                "createdAt": "2025-11-21T10:30:00Z",
                "updatedAt": "2025-11-21T10:30:00Z",
                "exerciseConfigurations": [
                  {
                    "id": 1,
                    "series": "4",
                    "reps": "8-10",
                    "exerciseMethodId": 1,
                    "exerciseId": 10,
                    "methodId": 3,
                    "createdAt": "2025-11-21T10:30:00Z",
                    "updatedAt": "2025-11-21T10:30:00Z",
                    "exercise": {
                      "id": 10,
                      "name": "Bench Press",
                      "description": "Barbell bench press",
                      "videoUrl": null,
                      "hasMethod": true,
                      "createdAt": "2025-11-21T10:30:00Z",
                      "updatedAt": "2025-11-21T10:30:00Z"
                    },
                    "method": {
                      "id": 3,
                      "name": "5x5 Protocol",
                      "description": "5 sets of 5 reps",
                      "createdAt": "2025-11-21T10:30:00Z",
                      "updatedAt": "2025-11-21T10:30:00Z"
                    }
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ],
  "meta": {
    "count": 1
  }
}
```

**Response (Single Sheet - Status 200):**
Same structure as above but wrapped in single object.

**Error Responses:**
- **404:** Sheet not found - `{ "success": false, "data": null, "error": "Training sheet not found" }`
- **400:** Invalid ID format - `{ "success": false, "data": null, "error": "Training sheet ID is required" }`
- **500:** Server error - `{ "success": false, "data": null, "error": "Internal server error" }`

---

### POST /api/training-sheets
Create a new training sheet with nested training days, exercise groups, methods, and configurations.

**Request Body:**
```json
{
  "name": "Full Body Strength",
  "publicName": "Full Body Strength Program",
  "slug": "full-body-strength",
  "trainingDays": [
    {
      "day": 1,
      "shortName": "Monday",
      "exerciseGroup": {
        "name": "Chest & Triceps",
        "categoryId": 2,
        "publicName": "Chest & Triceps Day",
        "exerciseMethods": [
          {
            "rest": "60s",
            "observations": "Warm up before starting",
            "order": 1,
            "exerciseConfigurations": [
              {
                "series": "4",
                "reps": "8-10",
                "exerciseId": 10,
                "methodId": 3
              }
            ]
          }
        ]
      }
    },
    {
      "day": 2,
      "shortName": "Wednesday",
      "exerciseGroup": {
        "name": "Back & Biceps",
        "categoryId": 2,
        "publicName": "Back & Biceps Day",
        "exerciseMethods": [...]
      }
    }
  ]
}
```

**Validation Rules:**
- `name` (string, required) – Sheet name, minimum 1 character
- `publicName` (string, optional) – Public display name
- `slug` (string, optional) – URL-friendly slug
- `trainingDays` (array, required) – Array of training day objects
  - `day` (number, required) – Day number (1, 2, 3, etc.)
  - `shortName` (string, optional) – Short name (e.g., "Monday")
  - `exerciseGroup` (object, required)
    - `name` (string, required) – Group name
    - `categoryId` (number, optional) – Category ID
    - `exerciseMethods` (array, required)
      - `rest` (string, required) – Rest duration (e.g., "60s")
      - `observations` (string, optional) – Notes
      - `exerciseConfigurations` (array, required)
        - `series` (string, required) – Number of sets
        - `reps` (string, required) – Reps range (e.g., "8-10")
        - `exerciseId` (number, required) – Exercise ID
        - `methodId` (number, optional) – Method ID

**Response (Status 201):**
```json
{
  "success": true,
  "data": {
    "sheet": {
      "id": 1,
      "name": "Full Body Strength",
      "publicName": "Full Body Strength Program",
      "slug": "full-body-strength",
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    },
    "days": [
      { "id": 1, "day": 1, "shortName": "Monday", "trainingSheetId": 1, "exerciseGroupId": 5 }
    ],
    "groups": [
      { "id": 5, "name": "Chest & Triceps", "categoryId": 2 }
    ],
    "methods": [
      { "id": 1, "rest": "60s", "exerciseGroupId": 5, "order": 1 }
    ],
    "configurations": [
      { "id": 1, "series": "4", "reps": "8-10", "exerciseId": 10, "exerciseMethodId": 1 }
    ]
  }
}
```

**Error Responses:**
- **400:** Validation error - `{ "success": false, "data": null, "error": "Validation error" }`
- **500:** Server error - `{ "success": false, "data": null, "error": "Internal server error" }`

---

### PUT /api/training-sheets
Update an existing training sheet (replaces all nested data).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Training sheet ID to update |

**Request Body:**
Same schema as POST `/api/training-sheets`

**Response (Status 200):**
Returns the complete updated training sheet with all nested relations (same as GET by ID).

**Error Responses:**
- **400:** Invalid ID or validation error
- **404:** Sheet not found
- **500:** Server error

---

### DELETE /api/training-sheets/:id
Delete a training sheet and all nested data (cascading delete).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Training sheet ID to delete |

**Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "message": "Training sheet deleted successfully"
  }
}
```

**Error Responses:**
- **400:** Invalid ID
- **404:** Sheet not found
- **500:** Server error

---

## Exercises

### GET /api/db/exercises
Retrieve all exercises.

**Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bench Press",
      "description": "Barbell bench press for chest development",
      "videoUrl": "https://youtube.com/watch?v=...",
      "hasMethod": true,
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Squat",
      "description": "Barbell back squat",
      "videoUrl": null,
      "hasMethod": true,
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    }
  ],
  "meta": {
    "count": 2
  }
}
```

---

### POST /api/db/exercises
Create a new exercise.

**Request Body:**
```json
{
  "name": "Deadlift",
  "description": "Barbell deadlift for posterior chain",
  "videoUrl": "https://youtube.com/watch?v=...",
  "hasMethod": true
}
```

**Validation Rules:**
- `description` (string, required, non-empty) – Exercise description
- `name` (string, optional) – Exercise name
- `videoUrl` (string, optional) – Link to instructional video
- `hasMethod` (boolean, optional, default: true) – Whether exercise uses methods

**Response (Status 201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Deadlift",
    "description": "Barbell deadlift for posterior chain",
    "videoUrl": "https://youtube.com/watch?v=...",
    "hasMethod": true,
    "createdAt": "2025-11-21T10:30:00Z",
    "updatedAt": "2025-11-21T10:30:00Z"
  }
}
```

**Error Responses:**
- **400:** Description missing or invalid - `{ "success": false, "data": null, "error": "Description is required." }`
- **500:** Server error

---

### GET /api/db/exercises/:id
Retrieve a specific exercise by ID.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Exercise ID |

**Response (Status 200):**
Single exercise object (same format as GET all).

**Error Responses:**
- **400:** Invalid ID format - `{ "success": false, "data": null, "error": "Missing exercise id" }`
- **404:** Exercise not found - `{ "success": false, "data": null, "error": "Not found" }`
- **500:** Server error

---

### PUT /api/db/exercises/:id
Update an existing exercise.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Exercise ID |

**Request Body:**
```json
{
  "name": "Deadlift (Updated)",
  "description": "Conventional barbell deadlift",
  "videoUrl": "https://youtube.com/watch?v=new",
  "hasMethod": true
}
```

**Validation Rules:**
- `description` (string, required, non-empty) – Exercise description
- Other fields are optional; omitted fields remain unchanged

**Response (Status 200):**
Updated exercise object.

**Error Responses:**
- **400:** Invalid ID or validation error
- **500:** Server error

---

### PATCH /api/db/exercises/:id
Partial update of an exercise (same as PUT).

---

### DELETE /api/db/exercises/:id
Delete an exercise.

**Response (Status 204):**
No content response.

**Error Responses:**
- **400:** Invalid ID
- **500:** Server error

---

## Methods

### GET /api/db/methods
Retrieve all training methods.

**Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "5x5 Protocol",
      "description": "5 sets of 5 reps with heavy weight",
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    },
    {
      "id": 2,
      "name": "High Rep Endurance",
      "description": "3 sets of 12-15 reps",
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    }
  ],
  "meta": {
    "count": 2
  }
}
```

---

### POST /api/db/methods
Create a new training method.

**Request Body:**
```json
{
  "name": "Pyramid Sets",
  "description": "Start light, increase weight each set, pyramid down"
}
```

**Validation Rules:**
- `name` (string, required, non-empty) – Method name
- `description` (string, required, non-empty) – Method description

**Response (Status 201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Pyramid Sets",
    "description": "Start light, increase weight each set, pyramid down",
    "createdAt": "2025-11-21T10:30:00Z",
    "updatedAt": "2025-11-21T10:30:00Z"
  }
}
```

**Error Responses:**
- **400:** Name or description missing - `{ "success": false, "data": null, "error": "Name is required." }` or `{ "success": false, "data": null, "error": "Description is required." }`
- **500:** Server error

---

### GET /api/db/methods/:id
Retrieve a specific method (endpoint structure similar to exercises).

---

### PUT /api/db/methods/:id
Update a method (endpoint structure similar to exercises).

---

### DELETE /api/db/methods/:id
Delete a method (endpoint structure similar to exercises).

---

## Exercise Groups

### GET /api/exercise-groups
Retrieve all exercise groups, optionally filtered by category.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `categoryId` | number | No | Filter by category ID; "all" returns all |

**Response (Status 200):**
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
      "category": {
        "id": 2,
        "name": "Strength"
      },
      "exerciseMethods": [
        {
          "id": 1,
          "rest": "60s",
          "observations": "Warm up first",
          "order": 1,
          "exerciseGroupId": 5,
          "exerciseConfigurations": [...]
        }
      ]
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

### POST /api/exercise-groups
Create a new exercise group with optional nested methods and configurations.

**Request Body:**
```json
{
  "name": "Legs Day",
  "categoryId": 2,
  "publicName": "Leg Workout",
  "exerciseMethods": [
    {
      "rest": "90s",
      "observations": "Heavy compound movements",
      "exerciseConfigurations": [
        {
          "exerciseId": 2,
          "methodId": 1,
          "series": "4",
          "reps": "6-8"
        }
      ]
    }
  ]
}
```

**Validation Rules:**
- `name` (string, required, min 1) – Group name
- `categoryId` (number, required, positive integer) – Category ID
- `publicName` (string, optional) – Public display name
- `exerciseMethods` (array, optional)
  - `rest` (string, optional) – Rest duration
  - `observations` (string, optional) – Notes
  - `exerciseConfigurations` (array)
    - `exerciseId` (number, required, positive) – Exercise ID
    - `methodId` (number, optional, positive) – Method ID
    - `series` (string, required) – Sets
    - `reps` (string, required) – Reps

**Response (Status 201):**
Created exercise group with nested data.

**Error Responses:**
- **400:** Validation error (Zod)
- **500:** Server error

---

### GET /api/exercise-groups/:id
Retrieve a specific exercise group with all methods and configurations.

**Response (Status 200):**
Single exercise group object with full nested structure.

**Error Responses:**
- **400:** Invalid ID
- **404:** Group not found
- **500:** Server error

---

### PUT /api/exercise-groups/:id
Update an exercise group (name and/or publicName).

**Request Body:**
```json
{
  "name": "Legs Day (Updated)",
  "publicName": "Advanced Leg Workout"
}
```

**Validation Rules:**
- `name` (string, optional, min 1) – New group name
- `publicName` (string, optional) – New public name

**Response (Status 200):**
Updated exercise group with all relations.

---

### DELETE /api/exercise-groups/:id
Delete an exercise group (cascades to methods and configurations).

**Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "message": "Exercise group deleted successfully"
  }
}
```

---

## Exercise Configurations

### GET /api/exercise-configurations
Retrieve all exercise configurations, optionally filtered by exercise method.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `exerciseMethodId` | number | No | Filter by exercise method ID |

**Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "series": "4",
      "reps": "8-10",
      "exerciseMethodId": 1,
      "exerciseId": 10,
      "methodId": 3,
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z",
      "exercise": {
        "id": 10,
        "name": "Bench Press",
        "description": "Barbell bench press"
      },
      "method": {
        "id": 3,
        "name": "5x5 Protocol",
        "description": "5 sets of 5 reps"
      }
    }
  ]
}
```

---

### POST /api/exercise-configurations
Create a new exercise configuration.

**Request Body:**
```json
{
  "series": "5",
  "reps": "5",
  "exerciseMethodId": 1,
  "exerciseId": 10,
  "methodId": 3
}
```

**Validation Rules:**
- `series` (string, required, min 1) – Number of sets
- `reps` (string, required, min 1) – Reps or reps range
- `exerciseMethodId` (number, required) – Exercise method ID
- `exerciseId` (number, required) – Exercise ID
- `methodId` (number, required) – Method ID

**Response (Status 201):**
Created exercise configuration with all relations.

---

### GET /api/exercise-configurations/:id
Retrieve a specific exercise configuration.

---

### PUT /api/exercise-configurations/:id
Update an exercise configuration.

**Request Body:**
```json
{
  "series": "6",
  "reps": "4-6",
  "methodId": 2
}
```

**Validation Rules:**
All fields optional; omitted fields remain unchanged.

---

### DELETE /api/exercise-configurations/:id
Delete an exercise configuration.

---

## Categories

### GET /api/categories
Retrieve all exercise group categories.

**Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "General",
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Strength",
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    }
  ],
  "meta": {
    "count": 2
  }
}
```

---

## User Profile

### GET /api/user/profile
Retrieve the authenticated user's profile.

**Authentication:** Requires valid NextAuth session.

**Response (Status 200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- **401:** Not authenticated - `{ "message": "Não autenticado" }`
- **404:** User not found - `{ "message": "Usuário não encontrado" }`
- **500:** Server error - `{ "message": "Erro ao carregar perfil" }`

---

### PUT /api/user/profile
Update the authenticated user's profile.

**Authentication:** Requires valid NextAuth session.

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Validation Rules:**
- `name` (string, optional) – New user name

**Response (Status 200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jane Doe"
  }
}
```

**Error Responses:**
- **401:** Not authenticated
- **500:** Server error - `{ "message": "Erro ao atualizar perfil" }`

---

## Training Schedule

### GET /api/training-schedule/workouts
Retrieve available workout sheets for training schedules.

**Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Full Body Workout",
      "createdAt": "2025-11-21T10:30:00Z",
      "updatedAt": "2025-11-21T10:30:00Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

**Error Responses:**
- **500:** Server error - `{ "success": false, "data": null, "error": "..." }`

---

## Workout Sheets

### GET /api/workout-sheets
Retrieve workout sheet IDs, optionally filtered by category.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `categoryId` | number | No | Filter by category ID; "all" or omitted returns all |

**Response (Status 200):**
```json
[1, 2, 3, 4]
```

**Error Responses:**
- **400:** Invalid categoryId - `{ "error": "Invalid categoryId" }`
- **500:** Server error

---

## Database Initialization

### POST /api/init-db
Initialize database with default data (creates default category).

**Response (Status 200):**
```json
{
  "success": true,
  "message": "Default category created",
  "category": {
    "id": 1,
    "name": "General"
  }
}
```

**Error Responses:**
- **405:** Method not allowed (GET, PUT, DELETE, etc.)
- **500:** Server error - `{ "success": false, "error": "..." }`

---

## Authentication

### POST /api/auth/[...nextauth]
NextAuth authentication route.

**Supported Flows:**
- Credential login (email/password)
- Session management
- JWT handling

**Endpoints:**
- `/api/auth/signin` – Sign in
- `/api/auth/session` – Get session
- `/api/auth/providers` – List providers
- `/api/auth/callback/credentials` – Credential callback

See NextAuth documentation for detailed usage.

---

## Error Handling

### Common Error Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Data retrieved/updated |
| 201 | Created | Resource created successfully |
| 204 | No Content | Delete successful (no response body) |
| 400 | Bad Request | Validation error or invalid parameters |
| 401 | Unauthorized | Not authenticated (user profile endpoints) |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | Wrong HTTP method for endpoint |
| 500 | Internal Server Error | Server-side error |

### Validation Errors

When Zod validation fails, the response includes details:
```json
{
  "success": false,
  "data": null,
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["name"],
      "message": "String must contain at least 1 character"
    }
  ]
}
```

---

## Rate Limiting

Currently, no explicit rate limiting is implemented. Consider adding rate limiting middleware in production.

---

## CORS

CORS is configured at the Next.js server level. Endpoints are accessible from the same origin by default.

---

## Authentication

All endpoints except `/api/auth/*` and `/api/init-db` may require authentication via NextAuth in production. Currently, most endpoints are accessible without authentication for development purposes.

**To Enable Authentication:**
Add session checks in API route handlers:
```typescript
const session = await getServerSession(req, res, authConfig);
if (!session?.user?.email) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

---

## Usage Examples

### Create a Complete Training Schedule

```bash
curl -X POST http://localhost:3000/api/training-sheets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Push/Pull/Legs",
    "trainingDays": [
      {
        "day": 1,
        "shortName": "Push",
        "exerciseGroup": {
          "name": "Push Day",
          "categoryId": 1,
          "exerciseMethods": [
            {
              "rest": "60s",
              "exerciseConfigurations": [
                {
                  "exerciseId": 1,
                  "methodId": 1,
                  "series": "4",
                  "reps": "8-10"
                }
              ]
            }
          ]
        }
      }
    ]
  }'
```

### Get All Exercises

```bash
curl http://localhost:3000/api/db/exercises
```

### Filter Exercise Groups by Category

```bash
curl http://localhost:3000/api/exercise-groups?categoryId=2
```

---

## Pagination

Most list endpoints support the following response format:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "count": 10,
    "total": 50
  }
}
```

Pagination is handled by frontend pagination hooks (`usePagination`). Implement server-side pagination if needed.

---

## Summary

All endpoints follow RESTful conventions:
- **GET** – Retrieve data
- **POST** – Create data
- **PUT** – Replace/update data
- **DELETE** – Delete data
- **PATCH** – Partial update (some endpoints)

Use the standardized response format for consistency. Validate all inputs with Zod schemas for type safety and clear error messages.

---

**Last Updated**: November 24, 2025  
**Status**: ✅ Current and Accurate  
**All Endpoints**: ✅ Documented  
**Examples**: ✅ Complete
