# Guia do Frontend

## 🎨 Visão Geral

O frontend do **Tay Training** é construído com **React 18** e **Next.js 14**, utilizando o padrão **Pages Router** com **Server-Side Rendering (SSR)** e **Single Page Application (SPA)** após hidratação. A interface é moderna, responsiva e oferece uma experiência fluida com animações suaves.

---

## 📁 Estrutura de Arquivos

```
src/
├── pages/                          # Componentes de página
│   ├── Home.tsx                   # Dashboard principal
│   ├── Exercises.tsx              # Gestão de exercícios
│   ├── Methods.tsx                # Gestão de métodos
│   ├── TrainingSchedule.tsx       # Agendamento de treinos
│   └── WorkoutSheets.tsx          # Fichas de treino
│
├── components/                     # Componentes reutilizáveis
│   ├── auth/                      # Componentes de autenticação
│   │   ├── LoginForm.tsx          # Formulário de login
│   │   └── ForgotPassword.tsx     # Recuperação de senha
│   │
│   ├── dialogs/                   # Modais e diálogos
│   │   ├── ExerciseDialog.tsx     # Modal de exercício
│   │   ├── MethodDialog.tsx       # Modal de método
│   │   ├── WorkoutSheetDialog.tsx # Modal de ficha
│   │   ├── TrainingScheduleDialog_Wizard.tsx
│   │   ├── ExerciseAutocomplete.tsx
│   │   └── WorkoutSheetAutocomplete.tsx
│   │
│   ├── layout/                    # Layout e navegação
│   │   ├── Layout.tsx             # Wrapper principal
│   │   ├── Navbar.tsx             # Barra de navegação
│   │   ├── Drawer.tsx             # Menu lateral
│   │   └── LoadingBar.tsx         # Barra de progresso
│   │
│   ├── profile/                   # Componentes de perfil
│   │   └── ProfileSettings.tsx    # Configurações do usuário
│   │
│   └── ui/                        # Componentes primitivos (Shadcn)
│       ├── button.tsx             # Botão
│       ├── card.tsx               # Card
│       ├── input.tsx              # Input
│       ├── dialog.tsx             # Dialog
│       ├── toast.tsx              # Toast notification
│       └── ... (50+ componentes)
│
├── hooks/                         # Custom React hooks
│   ├── use-loading.ts            # Hook de loading global
│   ├── use-toast.ts              # Hook de notificações
│   ├── use-dialog-handlers.ts    # Hook para diálogos
│   ├── use-pagination.ts         # Hook de paginação
│   └── use-mobile.tsx            # Hook de detecção mobile
│
├── lib/                          # Utilitários e serviços
│   ├── api-client.ts             # Cliente HTTP
│   ├── api-middleware.ts         # Middleware da API
│   ├── api-response.ts           # Helpers de resposta
│   ├── auth-config.ts            # Config NextAuth
│   ├── error-messages.ts         # Mensagens de erro
│   ├── motion-variants.ts        # Variantes de animação
│   ├── prisma.ts                 # Cliente Prisma
│   ├── server-auth.ts            # Auth server-side
│   ├── training-sheet-service.ts # Lógica de fichas
│   └── utils.ts                  # Funções auxiliares
│
├── types/                        # TypeScript types
│   └── index.ts                  # Tipos globais
│
├── config/                       # Configurações
│   └── constants.ts              # Constantes da aplicação
│
└── index.css                     # Estilos globais

pages/                            # Páginas Next.js (raiz)
├── _app.tsx                      # Wrapper da aplicação
├── index.tsx                     # Página inicial (redirect)
├── login.tsx                     # Página de login
├── home.tsx                      # Dashboard
├── exercises.tsx                 # Página de exercícios
├── methods.tsx                   # Página de métodos
├── training-schedule.tsx         # Página de agendamento
├── workout-sheets.tsx            # Página de fichas
├── forgot-password.tsx           # Recuperação de senha
└── 404.tsx                       # Página de erro 404
```

---

## 🔄 Como o SPA Funciona

### **1. Fluxo de Navegação:**

```
User types URL
     ↓
Next.js Server (SSR)
     ↓
getServerSideProps() - Auth check
     ↓
Render HTML inicial (Server)
     ↓
Send HTML to browser
     ↓
React Hydration (Client-side)
     ↓
SPA Mode (Client-side routing)
     ↓
Subsequent navigations via React Router
```

### **2. Server-Side Rendering (SSR):**

Cada página protegida usa `getServerSideProps` para verificar autenticação:

```typescript
// src/pages/Home.tsx
export const getServerSideProps: GetServerSideProps = requireAuthGetServerSideProps;

// src/lib/server-auth.ts
export const requireAuthGetServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authConfig);
  
  if (!session?.user?.email) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return { props: {} };
};
```

### **3. Client-Side Navigation:**

Após hidratação, a navegação é feita sem recarregar a página:

```typescript
import { useRouter } from 'next/router';

function MyComponent() {
  const router = useRouter();
  
  function navigateToExercises() {
    router.push('/exercises'); // SPA navigation
  }
  
  return <button onClick={navigateToExercises}>Ver Exercícios</button>;
}
```

---

## 🌐 Comunicação Frontend ↔ API

### **1. Cliente HTTP (`src/lib/api-client.ts`):**

```typescript
// Função genérica para fazer requests
async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET',
  body?: any
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data.data;
}

// Exemplos de uso:
export const fetchExercises = () => 
  apiRequest<Exercise[]>('/db/exercises');

export const createExercise = (data: CreateExerciseInput) =>
  apiRequest<Exercise>('/db/exercises', 'POST', data);

export const updateExercise = (id: number, data: UpdateExerciseInput) =>
  apiRequest<Exercise>(`/db/exercises/${id}`, 'PUT', data);

export const deleteExercise = (id: number) =>
  apiRequest<void>(`/db/exercises/${id}`, 'DELETE');
```

### **2. Consumo nos Componentes:**

```typescript
// src/pages/Exercises.tsx
import { useEffect, useState } from 'react';
import { fetchExercises, createExercise } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/hooks/use-loading';

function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  
  // Carregar exercícios ao montar componente
  useEffect(() => {
    loadExercises();
  }, []);
  
  async function loadExercises() {
    startLoading();
    try {
      const data = await fetchExercises();
      setExercises(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar exercícios',
      });
    } finally {
      stopLoading();
    }
  }
  
  async function handleCreate(formData: CreateExerciseInput) {
    try {
      const newExercise = await createExercise(formData);
      setExercises(prev => [...prev, newExercise]);
      toast({
        title: 'Sucesso',
        description: 'Exercício criado!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    }
  }
  
  return (
    <div>
      {exercises.map(exercise => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
```

### **3. Estado Global (Zustand):**

Para estados compartilhados entre múltiplos componentes:

```typescript
// src/stores/useStore.ts
import { create } from 'zustand';

interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  user: User | null;
  setUser: (user: User) => void;
}

export const useStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  user: null,
  setUser: (user) => set({ user }),
}));

// Uso em componente
function MyComponent() {
  const { isLoading, setLoading } = useStore();
  
  return <div>{isLoading ? 'Loading...' : 'Ready'}</div>;
}
```

---

## 🎨 Sistema de Componentes

### **Hierarquia de Componentes:**

```
App (_app.tsx)
  └─ Layout
      ├─ LoadingBar
      ├─ Navbar
      │   ├─ Button (menu toggle)
      │   ├─ Avatar (user profile)
      │   └─ DropdownMenu (user menu)
      ├─ Drawer (sidebar)
      │   ├─ NavigationMenu
      │   │   ├─ NavigationMenuItem (Home)
      │   │   ├─ NavigationMenuItem (Exercises)
      │   │   ├─ NavigationMenuItem (Methods)
      │   │   ├─ NavigationMenuItem (Workout Sheets)
      │   │   └─ NavigationMenuItem (Training Schedule)
      │   └─ Button (close drawer)
      └─ Main Content
          └─ Page Component (e.g., Exercises)
              ├─ Card (Exercise Card)
              │   ├─ CardHeader
              │   │   └─ CardTitle
              │   ├─ CardContent
              │   │   ├─ Text (description)
              │   │   └─ Badge (category)
              │   └─ CardFooter
              │       ├─ Button (edit)
              │       └─ Button (delete)
              └─ Dialog (Exercise Dialog)
                  ├─ DialogTrigger
                  ├─ DialogContent
                  │   ├─ DialogHeader
                  │   │   └─ DialogTitle
                  │   ├─ Form
                  │   │   ├─ Input (name)
                  │   │   ├─ Textarea (description)
                  │   │   └─ Input (video URL)
                  │   └─ DialogFooter
                  │       ├─ Button (cancel)
                  │       └─ Button (save)
                  └─ DialogClose
```

### **Exemplo de Composição:**

```typescript
// src/pages/Exercises.tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExerciseDialog } from '@/components/dialogs/ExerciseDialog';

function ExerciseCard({ exercise }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{exercise.description}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <ExerciseDialog exercise={exercise} mode="edit">
          <Button variant="outline">Editar</Button>
        </ExerciseDialog>
        <Button variant="destructive" onClick={() => handleDelete(exercise.id)}>
          Deletar
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 🎭 Animações com Framer Motion

### **Variantes de Animação (`src/lib/motion-variants.ts`):**

```typescript
// Entrada com fade e slide
export const fadeUpIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, type: 'spring' }
  }
};

// Hover lift
export const hoverLift = {
  y: -4,
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.25 }
};

// Lista com stagger
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08
    }
  }
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};
```

### **Uso em Componentes:**

```typescript
import { motion } from 'framer-motion';
import { fadeUpIn, listContainer, listItem } from '@/lib/motion-variants';

function AnimatedList({ items }) {
  return (
    <motion.div variants={listContainer} initial="hidden" animate="visible">
      {items.map((item) => (
        <motion.div key={item.id} variants={listItem}>
          {item.name}
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnimatedCard() {
  return (
    <motion.div
      variants={fadeUpIn}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card>Card Content</Card>
    </motion.div>
  );
}
```

---

## 📱 Responsividade

### **Breakpoints (Tailwind CSS):**

```typescript
// tailwind.config.ts
theme: {
  screens: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablet portrait
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px' // Extra large
  }
}
```

### **Uso de Classes Responsivas:**

```tsx
<div className="
  grid gap-4 
  grid-cols-1           /* Mobile: 1 coluna */
  sm:grid-cols-2        /* Tablet: 2 colunas */
  lg:grid-cols-3        /* Desktop: 3 colunas */
  xl:grid-cols-4        /* Large: 4 colunas */
">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

### **Hook de Detecção Mobile:**

```typescript
// src/hooks/use-mobile.tsx
import { useEffect, useState } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

// Uso
function MyComponent() {
  const isMobile = useMobile();
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

---

## 🎨 Estilização

### **Tailwind CSS + CSS-in-JS:**

```tsx
// Classes utilitárias Tailwind
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
  Click Me
</button>

// Composição condicional com clsx
import { cn } from '@/lib/utils';

<button 
  className={cn(
    'px-4 py-2 rounded-lg',
    isPrimary ? 'bg-primary text-white' : 'bg-secondary text-black',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Button
</button>
```

### **CSS Global (`src/index.css`):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 339 100% 64%;      /* Rosa principal */
    --primary-foreground: 0 0% 100%;
  }
}

@layer utilities {
  .glass-effect {
    @apply backdrop-blur-lg bg-white/80 border border-white/20 shadow-sm;
  }
}
```

---

## 📦 Estrutura de Componentes Reutilizáveis

### **Componente de Input com Validação:**

```typescript
// src/components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          className={cn(
            'flex h-10 w-full rounded-md border border-input px-3 py-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            error && 'border-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
    );
  }
);

// Uso
<Input 
  placeholder="Nome do exercício" 
  error={errors.name}
  onChange={handleChange}
/>
```

---

## 🔔 Sistema de Notificações

### **Toast Hook (`use-toast.ts`):**

```typescript
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();
  
  function showSuccess() {
    toast({
      title: 'Sucesso!',
      description: 'Operação realizada com sucesso',
    });
  }
  
  function showError() {
    toast({
      variant: 'destructive',
      title: 'Erro',
      description: 'Algo deu errado',
    });
  }
  
  return (
    <>
      <button onClick={showSuccess}>Success</button>
      <button onClick={showError}>Error</button>
    </>
  );
}
```

---

## 📊 Gerenciamento de Formulários

### **React Hook Form + Zod:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  videoUrl: z.string().url('URL inválida').optional(),
  hasMethod: z.boolean().default(true),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

function ExerciseForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
  });
  
  async function onSubmit(data: ExerciseFormData) {
    await createExercise(data);
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} error={errors.name?.message} />
      <Textarea {...register('description')} />
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

---

## 🚀 Performance

### **Code Splitting:**

```typescript
import dynamic from 'next/dynamic';

// Carregar componente apenas quando necessário
const HeavyDialog = dynamic(() => import('./HeavyDialog'), {
  ssr: false,
  loading: () => <Spinner />
});
```

### **Memoização:**

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoizar componente
const ExerciseCard = memo(({ exercise }) => {
  return <Card>{exercise.name}</Card>;
});

// Memoizar valor computado
function MyComponent({ items }) {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  return <List items={sortedItems} />;
}

// Memoizar função
function Parent() {
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);
  
  return <Child onClick={handleClick} />;
}
```

---

**Última atualização:** Novembro 2025  
**Versão:** 1.0
