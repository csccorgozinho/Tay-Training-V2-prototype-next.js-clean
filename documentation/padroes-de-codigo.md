# Padrões de Código

## 🎨 Estilo e Convenções do Projeto

Este documento define os padrões de código, convenções de nomenclatura e boas práticas adotadas no projeto Tay Training.

---

## 📐 Estrutura Geral

### **Organização de Diretórios:**

```
src/
├── components/       # Componentes React reutilizáveis
│   ├── auth/        # Componentes de autenticação
│   ├── dialogs/     # Modais e diálogos
│   ├── layout/      # Componentes de layout (Header, Footer, etc.)
│   ├── profile/     # Componentes de perfil de usuário
│   └── ui/          # Componentes base (shadcn/ui)
├── hooks/           # Custom React Hooks
├── lib/             # Utilitários e configurações
├── pages/           # Páginas da aplicação (componentes)
└── types/           # Definições de tipos TypeScript

pages/
├── api/             # API Routes do Next.js
│   ├── auth/        # Endpoints de autenticação
│   ├── db/          # Endpoints de banco de dados
│   └── ...          # Outros endpoints organizados por recurso
└── ...              # Páginas públicas

prisma/
├── schema.prisma    # Schema do banco de dados
├── seed.ts          # Script de seed
└── migrations/      # Histórico de migrações
```

---

## 🏷️ Convenções de Nomenclatura

### **1. Arquivos:**

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `ExerciseDialog.tsx` |
| Páginas | kebab-case | `training-schedule.tsx` |
| Hooks | kebab-case com prefixo `use-` | `use-pagination.ts` |
| Utilitários | kebab-case | `api-client.ts` |
| Tipos | kebab-case | `index.ts` (em `types/`) |
| API Routes | kebab-case | `forgot-password.ts` |

### **2. Variáveis e Funções:**

```typescript
// ✅ Correto - camelCase
const exerciseList = [];
const userName = 'John';
let isLoading = false;

function fetchUserData() { }
const handleSubmit = () => { };

// ❌ Evitar
const exercise_list = [];  // snake_case
const ExerciseList = [];   // PascalCase para variáveis
```

### **3. Constantes:**

```typescript
// ✅ Correto - UPPER_SNAKE_CASE para constantes globais
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const API_BASE_URL = '/api';

// ✅ Correto - camelCase para constantes locais
const defaultPageSize = 10;
const errorMessage = 'Erro ao carregar';
```

### **4. Tipos e Interfaces:**

```typescript
// ✅ Correto - PascalCase
interface User {
  id: number;
  name: string;
}

type Exercise = {
  id: number;
  title: string;
};

// Prefixo "I" não é usado (padrão TypeScript moderno)
// ❌ Evitar
interface IUser { }
```

### **5. Componentes React:**

```typescript
// ✅ Correto - PascalCase, nome descritivo
export function ExerciseDialog() { }
export default function TrainingSchedule() { }

// Props com sufixo "Props"
interface ExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// ❌ Evitar
export function exerciseDialog() { }  // camelCase
export function ED() { }               // Abreviação não clara
```

### **6. Hooks Customizados:**

```typescript
// ✅ Correto - prefixo "use"
export function usePagination() { }
export function useWorkoutSheetsFilter() { }

// ❌ Evitar
export function pagination() { }       // Sem "use"
export function useWSFilter() { }      // Abreviação não clara
```

---

## 📦 Estrutura de Módulos

### **Imports Organizados:**

```typescript
// 1. Imports externos
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

// 2. Imports internos absolutos (@/)
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import type { Exercise } from '@/types';

// 3. Imports relativos (se necessário)
import { formatDate } from '../utils';

// 4. Imports de estilos
import '@/index.css';
```

### **Exports:**

```typescript
// ✅ Correto - Named exports para componentes reutilizáveis
export function Card() { }
export function CardHeader() { }
export function CardContent() { }

// ✅ Correto - Default export para páginas
export default function HomePage() { }

// ✅ Correto - Named exports para utilitários
export const formatDate = () => { };
export const cn = () => { };
```

---

## ✍️ Como Escrever Funções

### **1. Funções Pequenas e Focadas:**

```typescript
// ✅ Correto - função faz uma coisa só
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function sendPasswordResetEmail(email: string) {
  if (!validateEmail(email)) {
    throw new Error('Email inválido');
  }
  // Enviar email
}

// ❌ Evitar - função faz muitas coisas
function handlePasswordReset(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return false;
  // Validação misturada com lógica de negócio
  // Enviar email
  // Atualizar banco
  // etc...
}
```

### **2. Tipagem Explícita:**

```typescript
// ✅ Correto - tipos explícitos
function createExercise(
  title: string,
  categoryId: number | null
): Promise<Exercise> {
  return apiClient.post<Exercise>('/api/db/exercises', { title, categoryId });
}

// ❌ Evitar - tipos implícitos
function createExercise(title, categoryId) {
  return apiClient.post('/api/db/exercises', { title, categoryId });
}
```

### **3. Early Returns:**

```typescript
// ✅ Correto - early return reduz aninhamento
function processUser(user: User | null) {
  if (!user) {
    return null;
  }
  
  if (!user.isActive) {
    return { error: 'Usuário inativo' };
  }
  
  return { success: true, data: user };
}

// ❌ Evitar - aninhamento excessivo
function processUser(user: User | null) {
  if (user) {
    if (user.isActive) {
      return { success: true, data: user };
    } else {
      return { error: 'Usuário inativo' };
    }
  } else {
    return null;
  }
}
```

### **4. Funções Puras (quando possível):**

```typescript
// ✅ Correto - função pura (sem side effects)
function calculateTotalSets(exercises: Exercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets, 0);
}

// ⚠️ Cuidado - side effect (mutação)
function addExercise(list: Exercise[], exercise: Exercise) {
  list.push(exercise);  // Mutação
  return list;
}

// ✅ Melhor - imutável
function addExercise(list: Exercise[], exercise: Exercise): Exercise[] {
  return [...list, exercise];
}
```

---

## 🎯 Boas Práticas

### **1. Componentes React:**

```typescript
// ✅ Bom - componente funcional com tipagem
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

// ❌ Evitar - sem tipagem, sem destructuring
export function Card(props) {
  return (
    <div className="rounded-lg border p-4">
      <h2>{props.title}</h2>
      {props.children}
    </div>
  );
}
```

### **2. Hooks:**

```typescript
// ✅ Correto - hooks no topo, lógica clara
export function usePagination(totalItems: number, pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
  };
}

// ❌ Evitar - hooks condicionais
function useBadHook(condition: boolean) {
  if (condition) {
    const [state, setState] = useState(0);  // ❌ Hook condicional!
  }
}
```

### **3. API Routes:**

```typescript
// ✅ Correto - estrutura clara, validação, tratamento de erros
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createExerciseSchema = z.object({
  title: z.string().min(1).max(100),
  categoryId: z.number().nullable(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const body = createExerciseSchema.parse(req.body);
    
    const exercise = await prisma.exercise.create({
      data: body,
    });
    
    return res.status(201).json(exercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error creating exercise:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### **4. Async/Await:**

```typescript
// ✅ Correto - async/await com tratamento de erro
async function fetchExercises() {
  try {
    const response = await apiClient.get<Exercise[]>('/api/db/exercises');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    throw error;
  }
}

// ❌ Evitar - Promises aninhadas
function fetchExercises() {
  return apiClient.get('/api/db/exercises')
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(error);
    });
}
```

### **5. Manipulação de Estado:**

```typescript
// ✅ Correto - atualização imutável
setExercises(prev => [...prev, newExercise]);
setUser(prev => ({ ...prev, name: 'New Name' }));

// ❌ Evitar - mutação direta
exercises.push(newExercise);
setExercises(exercises);  // Não detecta mudança!
```

### **6. Condicionais:**

```typescript
// ✅ Correto - opcional chaining e nullish coalescing
const userName = user?.name ?? 'Anônimo';
const total = data?.exercises?.length ?? 0;

// ❌ Evitar - verificações aninhadas
const userName = data && data.user && data.user.name ? data.user.name : 'Anônimo';
```

### **7. Array Methods:**

```typescript
// ✅ Correto - métodos funcionais
const activeUsers = users.filter(user => user.isActive);
const userNames = users.map(user => user.name);
const total = numbers.reduce((sum, num) => sum + num, 0);

// ❌ Evitar - loops imperativos
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i]);
  }
}
```

---

## 🧪 Comentários

### **Quando Comentar:**

```typescript
// ✅ Bom - explica "por quê", não "o quê"
// Usar bcrypt cost 10 para balancear segurança e performance
const hashedPassword = await bcrypt.hash(password, 10);

// API do Next.js requer export default
export default function handler(req, res) { }

// Workaround para bug no Framer Motion v12.23.24
const variants = { opacity: [0, 1] };
```

### **Quando NÃO Comentar:**

```typescript
// ❌ Ruim - óbvio
const total = a + b;  // Soma a e b

// ❌ Ruim - comentário desatualizado
const MAX_SIZE = 20;  // Máximo de 10 itens (DESATUALIZADO!)

// ✅ Melhor - código auto-explicativo
const MAX_ITEMS_PER_PAGE = 20;
```

### **JSDoc para Funções Públicas:**

```typescript
/**
 * Busca exercícios com filtros e paginação
 * @param filters - Filtros de categoria e busca
 * @param page - Número da página (inicia em 1)
 * @param pageSize - Itens por página
 * @returns Promise com lista de exercícios
 */
export async function fetchExercises(
  filters: ExerciseFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<Exercise[]> {
  // Implementação
}
```

---

## 🎨 Tailwind CSS

### **Ordem das Classes:**

```tsx
// ✅ Correto - ordem lógica
<div className="
  flex items-center justify-between  {/* Layout */}
  w-full h-16                       {/* Tamanho */}
  px-4 py-2                          {/* Spacing */}
  bg-card text-card-foreground      {/* Cores */}
  rounded-lg border                  {/* Bordas */}
  shadow-lg                          {/* Efeitos */}
  hover:shadow-xl                    {/* Estados */}
  transition-all duration-300        {/* Animações */}
">
```

### **Usar `cn()` para Classes Condicionais:**

```tsx
import { cn } from '@/lib/utils';

// ✅ Correto
<Button className={cn(
  'px-4 py-2 rounded',
  isActive && 'bg-primary text-white',
  isDisabled && 'opacity-50 cursor-not-allowed'
)} />

// ❌ Evitar - string templates confusos
<Button className={`px-4 py-2 ${isActive ? 'bg-primary' : ''} ${isDisabled ? 'opacity-50' : ''}`} />
```

---

## 📏 Formatação

### **ESLint e Prettier:**

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### **Indentação:**
- **2 espaços** (padrão do projeto)
- Sem tabs

### **Linha Máxima:**
- **80-100 caracteres** (recomendado)
- Quebrar linhas longas de forma legível

### **Aspas:**
- **Aspas simples** para strings: `'hello'`
- **Template strings** quando necessário: `` `Hello ${name}` ``

---

## 🚀 Performance

### **1. Evitar Re-renders Desnecessários:**

```typescript
// ✅ Correto - memo para componentes puros
export const ExerciseCard = React.memo(({ exercise }: { exercise: Exercise }) => {
  return <div>{exercise.title}</div>;
});

// ✅ Correto - useCallback para funções passadas como props
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### **2. Lazy Loading:**

```typescript
// ✅ Correto - lazy load para componentes pesados
const ExerciseDialog = dynamic(() => import('@/components/dialogs/ExerciseDialog'), {
  loading: () => <p>Carregando...</p>
});
```

---

## ✅ Checklist de Code Review

Antes de commitar código:

- [ ] Código segue convenções de nomenclatura
- [ ] Funções têm tipagem explícita
- [ ] Sem `any` types (exceto casos justificados)
- [ ] Imports organizados corretamente
- [ ] Componentes têm props tipadas
- [ ] Hooks no topo, sem condicionais
- [ ] Async/await com tratamento de erro
- [ ] Estado atualizado de forma imutável
- [ ] Comentários explicam "por quê", não "o quê"
- [ ] ESLint sem warnings
- [ ] Código testado localmente
- [ ] Sem `console.log` esquecidos

---

**Última atualização:** Novembro 2025
