# Arquitetura do Sistema

## 📐 Visão Geral

O **Tay Training** é construído como uma aplicação **Full-Stack Monolítica** utilizando Next.js, onde frontend e backend coexistem no mesmo projeto. A arquitetura segue o padrão **SSR (Server-Side Rendering)** com **API Routes Serverless** e **SPA (Single Page Application)** após hidratação.

---

## 🏗️ Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE APRESENTAÇÃO                   │
│  (React Components + Pages + Layout + UI Components)        │
│                                                              │
│  - Home.tsx, Exercises.tsx, Methods.tsx, etc.               │
│  - LoginForm, Navbar, Drawer, Dialogs                       │
│  - Shadcn/ui components (Button, Card, Input, etc.)         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓ Next.js Router + getServerSideProps
┌─────────────────────────────────────────────────────────────┐
│                   CAMADA DE ROTEAMENTO                       │
│        (Next.js Pages Router + Middleware)                   │
│                                                              │
│  - pages/index.tsx → Redirect to /login                     │
│  - pages/home.tsx → Dashboard                               │
│  - pages/exercises.tsx → Exercise Management                │
│  - pages/api/* → API Routes (Backend)                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓ HTTP Requests / API Calls
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE NEGÓCIO                         │
│         (API Routes + Services + Middleware)                 │
│                                                              │
│  - pages/api/db/exercises/* → Exercise endpoints            │
│  - pages/api/db/methods/* → Method endpoints                │
│  - pages/api/training-sheets/* → Training sheet endpoints   │
│  - pages/api/auth/[...nextauth].ts → Authentication         │
│  - src/lib/training-sheet-service.ts → Business logic       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE ACESSO A DADOS                     │
│              (Prisma Client + Schema)                        │
│                                                              │
│  - src/lib/prisma.ts → Prisma singleton                     │
│  - prisma/schema.prisma → Database models                   │
│  - Queries, Mutations, Relations                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓ SQL Queries
┌─────────────────────────────────────────────────────────────┐
│                   CAMADA DE DADOS                            │
│                  (PostgreSQL Database)                       │
│                                                              │
│  - users, exercises, methods, training_sheets               │
│  - exercise_groups, exercise_configurations                 │
│  - training_days, menus, categories                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados

### **1. Requisição do Usuário (Frontend → Backend)**

```
User Action (Click Button)
     ↓
React Component Event Handler
     ↓
API Client Function (src/lib/api-client.ts)
     ↓
HTTP Request (fetch)
     ↓
Next.js API Route (pages/api/*)
     ↓
Validation (Zod Schema)
     ↓
Prisma Service Call
     ↓
PostgreSQL Query
     ↓
Database Response
```

### **2. Resposta do Backend (Backend → Frontend)**

```
PostgreSQL Result
     ↓
Prisma Client Parsing
     ↓
API Response Helper (apiSuccess/apiError)
     ↓
JSON Response
     ↓
API Client Parsing
     ↓
React State Update (useState/Zustand)
     ↓
Component Re-render
     ↓
UI Update (Display Data)
```

---

## 📁 Estrutura de Pastas e Módulos

### **Frontend (src/)**

```
src/
├── pages/                    # React page components
│   ├── Home.tsx             # Dashboard principal
│   ├── Exercises.tsx        # Gestão de exercícios
│   ├── Methods.tsx          # Gestão de métodos
│   ├── TrainingSchedule.tsx # Agendamento
│   └── WorkoutSheets.tsx    # Fichas de treino
│
├── components/              # Componentes reutilizáveis
│   ├── auth/               # LoginForm, ForgotPassword
│   ├── dialogs/            # Modals (ExerciseDialog, etc.)
│   ├── layout/             # Navbar, Drawer, Layout
│   ├── profile/            # Perfil do usuário
│   └── ui/                 # Shadcn/ui primitives
│
├── lib/                    # Utilitários e serviços
│   ├── api-client.ts       # Cliente HTTP
│   ├── prisma.ts           # Prisma singleton
│   ├── auth-config.ts      # NextAuth setup
│   ├── training-sheet-service.ts  # Lógica de negócio
│   └── utils.ts            # Funções auxiliares
│
├── hooks/                  # Custom React hooks
│   ├── use-loading.ts
│   ├── use-toast.ts
│   └── use-dialog-handlers.ts
│
└── types/                  # TypeScript types
    └── index.ts
```

### **Backend (pages/api/)**

```
pages/api/
├── auth/
│   └── [...nextauth].ts         # Autenticação NextAuth
│
├── db/
│   ├── exercises/
│   │   ├── index.ts            # GET, POST /exercises
│   │   └── [id].ts             # GET, PUT, DELETE /exercises/:id
│   └── methods/
│       ├── index.ts            # GET, POST /methods
│       └── [id].ts             # GET, PUT, DELETE /methods/:id
│
├── training-sheets/
│   ├── index.ts                # CRUD training sheets
│   └── [id].ts
│
├── exercise-groups/
│   ├── index.ts
│   └── [id].ts
│
├── exercise-configurations/
│   ├── index.ts
│   └── [id].ts
│
├── training-schedule/
│   └── workouts.ts
│
├── categories/
│   └── index.ts
│
├── user/
│   └── profile.ts
│
└── init-db.ts                  # Database seeding
```

---

## 🔗 Comunicação entre Módulos

### **Frontend ↔ Backend Communication**

**1. Requisição HTTP via API Client:**

```typescript
// src/lib/api-client.ts
export async function fetchExercises() {
  const response = await fetch('/api/db/exercises');
  const data = await response.json();
  return data;
}
```

**2. Backend API Route Handler:**

```typescript
// pages/api/db/exercises/index.ts
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const exercises = await prisma.exercise.findMany();
    return res.status(200).json(apiSuccess(exercises));
  }
}
```

**3. Frontend Component Consumption:**

```typescript
// src/pages/Exercises.tsx
const [exercises, setExercises] = useState([]);

useEffect(() => {
  fetchExercises().then(data => setExercises(data));
}, []);
```

### **Backend ↔ Database Communication**

**Prisma ORM abstrai consultas SQL:**

```typescript
// Direct Prisma call in API route
const exercises = await prisma.exercise.findMany({
  where: { hasMethod: true },
  include: { exerciseConfigurations: true }
});
```

**Equivalente SQL gerado:**

```sql
SELECT 
  e.*, 
  ec.*
FROM exercises e
LEFT JOIN exercise_configurations ec ON ec.exercise_id = e.id
WHERE e.has_method = true;
```

---

## 🔐 Autenticação e Autorização

### **NextAuth Flow:**

```
1. User submits login form
     ↓
2. POST /api/auth/signin (NextAuth)
     ↓
3. Credentials Provider validates email/password
     ↓
4. bcrypt.compare(password, hashedPassword)
     ↓
5. Session created with JWT
     ↓
6. Cookie set in browser
     ↓
7. Redirect to /home
```

### **Protected Routes:**

```typescript
// Server-side authentication check
export const getServerSideProps = requireAuthGetServerSideProps;

// Redirects to /login if not authenticated
```

---

## 📊 Diagrama de Relacionamento dos Dados

```
┌─────────┐         ┌─────────────────┐         ┌─────────────┐
│  User   │         │ TrainingSheet   │         │ ExerciseGroup│
│         │         │                 │         │              │
│ id      │         │ id              │         │ id           │
│ name    │         │ name            │◄───┐    │ name         │
│ email   │         │ slug            │    │    │ categoryId   │
│ password│         └─────────────────┘    │    └──────┬───────┘
└─────────┘                 │              │           │
                            │1            *│           │1
                            ▼              │           │
                    ┌──────────────┐      │           │*
                    │ TrainingDay  │──────┘           │
                    │              │                  │
                    │ id           │◄─────────────────┘
                    │ day          │
                    │ shortName    │
                    └──────────────┘

┌─────────────┐         ┌──────────────────┐         ┌────────────┐
│  Exercise   │         │ ExerciseMethod   │         │   Method   │
│             │         │                  │         │            │
│ id          │         │ id               │         │ id         │
│ name        │         │ rest             │         │ name       │
│ description │         │ observations     │         │ description│
│ videoUrl    │         │ order            │         └─────┬──────┘
│ hasMethod   │         └────────┬─────────┘               │
└──────┬──────┘                  │1                        │1
       │                         │                         │
       │1                       *│                        *│
       │            ┌────────────▼─────────────────────────▼┐
       └────────────►  ExerciseConfiguration              │
                    │                                     │
                    │ id                                  │
                    │ series                              │
                    │ reps                                │
                    └─────────────────────────────────────┘
```

---

## 🚀 Padrões Arquiteturais Utilizados

### **1. Repository Pattern (via Prisma)**
- Abstração de acesso a dados
- Queries reutilizáveis
- Facilita testes e manutenção

### **2. Service Layer Pattern**
- Lógica de negócio isolada em `src/lib/*-service.ts`
- API routes delegam para services
- Exemplo: `training-sheet-service.ts`

### **3. API Response Wrapper**
- Respostas padronizadas: `apiSuccess()` e `apiError()`
- Estrutura consistente em todos os endpoints
- Facilita tratamento de erros no frontend

### **4. Component Composition**
- Componentes pequenos e reutilizáveis
- Separação clara de responsabilidades
- Exemplo: `<Card>` + `<CardHeader>` + `<CardContent>`

### **5. Custom Hooks Pattern**
- Lógica reutilizável encapsulada
- Exemplos: `useLoading()`, `useToast()`, `usePagination()`

---

## 🔧 Configuração e Inicialização

### **Startup Flow:**

```
1. Next.js Server Start
     ↓
2. Load Environment Variables (.env)
     ↓
3. Initialize Prisma Client (singleton)
     ↓
4. Connect to PostgreSQL
     ↓
5. Load NextAuth Configuration
     ↓
6. Start HTTP Server (port 3000)
     ↓
7. Ready to accept requests
```

### **Database Initialization:**

```bash
# Run migrations
npx prisma migrate dev

# Seed database with default data
npm run seed
```

---

## 📦 Dependências entre Módulos

```
pages/_app.tsx
  └─ Layout
      ├─ Navbar
      ├─ Drawer
      └─ LoadingBar

pages/home.tsx
  ├─ requireAuthGetServerSideProps (SSR check)
  ├─ useLoading() hook
  ├─ useToast() hook
  └─ fetchCounts() → API calls

pages/api/db/exercises/index.ts
  ├─ prisma singleton
  ├─ apiSuccess/apiError helpers
  └─ Database queries

src/lib/training-sheet-service.ts
  ├─ prisma client
  ├─ zod schemas
  └─ business logic functions
```

---

## 🌐 Deploy e Infraestrutura

### **Recomendação de Deploy:**

**Frontend + Backend:** Vercel (Next.js nativo)  
**Database:** Supabase / Railway / Neon (PostgreSQL)  
**File Storage:** Vercel Blob / AWS S3 (PDFs)  
**CDN:** Vercel Edge Network (automático)

### **Variáveis de Ambiente Necessárias:**

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=random_secret_string
NEXTAUTH_URL=https://yourdomain.com
```

---

## 🔮 Escalabilidade Futura

### **Possíveis Evoluções Arquiteturais:**

1. **Separação Frontend/Backend**
   - Frontend: Next.js (Vercel)
   - Backend: Node.js + Express (Railway)
   - Comunicação via REST/GraphQL

2. **Microservices**
   - Service de Exercícios
   - Service de Fichas
   - Service de Autenticação
   - API Gateway (Kong/Traefik)

3. **Cache Layer**
   - Redis para cache de queries frequentes
   - Redução de carga no PostgreSQL

4. **Queue System**
   - RabbitMQ/Bull para geração de PDFs
   - Processamento assíncrono

5. **Real-time Features**
   - WebSockets (Socket.io)
   - Notificações em tempo real

---

## 📊 Performance e Otimizações

### **SSR vs CSR Decisão:**

- **SSR:** Páginas de listagem (SEO, initial load)
- **CSR:** Dashboards interativos (reatividade)
- **ISR:** Páginas estáticas (documentação)

### **Code Splitting:**

```typescript
// Dynamic imports para componentes pesados
const HeavyDialog = dynamic(() => import('./HeavyDialog'), {
  ssr: false,
  loading: () => <Spinner />
});
```

### **Database Indexing:**

```sql
-- Índices críticos já definidos no Prisma schema
CREATE INDEX idx_exercise_name ON exercises(name);
CREATE INDEX idx_training_sheet_slug ON training_sheets(slug);
```

---

**Última atualização:** Novembro 2025  
**Versão da Arquitetura:** 1.0
