# Melhorias do Projeto

## 🚀 Sugestões de Evolução

Este documento apresenta melhorias sugeridas para o projeto Tay Training, incluindo novas funcionalidades, otimizações de performance, refatorações necessárias e gargalos conhecidos.

---

## 🎯 Novas Funcionalidades

### **1. Sistema de Notificações**

**Prioridade:** Alta  
**Impacto:** Melhora engajamento do usuário

**Implementação:**

```typescript
// src/types/index.ts
export interface Notification {
  id: number;
  userId: number;
  type: 'workout_reminder' | 'achievement' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// pages/api/notifications/index.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authConfig);
  
  if (req.method === 'GET') {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    return res.json(notifications);
  }
}
```

**UI:**
- Badge no header com contagem de não lidas
- Dropdown com últimas 5 notificações
- Página dedicada para histórico completo

---

### **2. Dashboard com Gráficos de Progresso**

**Prioridade:** Alta  
**Impacto:** Visualização de progresso do usuário

**Ferramentas:** Recharts ou Chart.js

**Métricas:**
- Total de treinos concluídos por semana/mês
- Exercícios mais realizados
- Evolução de carga (kg) por exercício
- Frequência de treino (dias ativos)

```bash
npm install recharts
```

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function WorkoutProgressChart({ data }: { data: WorkoutData[] }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="completed" stroke="#ec4899" />
    </LineChart>
  );
}
```

---

### **3. Sistema de Metas e Conquistas**

**Prioridade:** Média  
**Impacto:** Gamificação aumenta retenção

**Estrutura:**

```prisma
model Achievement {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  icon        String
  condition   String   // Ex: "complete_10_workouts"
  points      Int
  users       UserAchievement[]
}

model UserAchievement {
  id            Int         @id @default(autoincrement())
  userId        Int
  achievementId Int
  unlockedAt    DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id])
  achievement   Achievement @relation(fields: [achievementId], references: [id])
}
```

**Conquistas Exemplo:**
- 🏋️ "Primeira Ficha" - Criar primeira ficha de treino
- 🔥 "Sequência de 7 Dias" - Treinar 7 dias seguidos
- 💪 "Centurião" - Completar 100 treinos
- 📈 "Evoluindo" - Aumentar carga em 5 exercícios

---

### **4. Exportação de Fichas em PDF**

**Prioridade:** Alta  
**Impacto:** Facilita impressão para uso na academia

**Ferramentas:** `jsPDF` ou `react-pdf`

```bash
npm install jspdf jspdf-autotable
```

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportWorkoutSheetPDF(sheet: TrainingSheet) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(sheet.name, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Objetivo: ${sheet.objective}`, 20, 30);
  
  const tableData = sheet.exercises.map(ex => [
    ex.exercise.title,
    `${ex.sets}x${ex.repetitions}`,
    ex.restTime ? `${ex.restTime}s` : '-',
  ]);
  
  doc.autoTable({
    head: [['Exercício', 'Séries x Reps', 'Descanso']],
    body: tableData,
    startY: 40,
  });
  
  doc.save(`${sheet.name}.pdf`);
}
```

**Botão na UI:**
```tsx
<Button onClick={() => exportWorkoutSheetPDF(sheet)}>
  <Download className="mr-2" /> Exportar PDF
</Button>
```

---

### **5. Modo Treino (Workout Mode)**

**Prioridade:** Média  
**Impacto:** Experiência durante execução do treino

**Funcionalidades:**
- Timer de descanso entre séries
- Checkbox para marcar séries completas
- Registro de carga utilizada
- Anotações rápidas (ex: "difícil", "aumentar carga")

```tsx
export function WorkoutMode({ sheet }: { sheet: TrainingSheet }) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(60);
  
  return (
    <div className="space-y-4">
      <h2>{sheet.exercises[currentExercise].exercise.title}</h2>
      <p>Série {completedSets + 1} de {sheet.exercises[currentExercise].sets}</p>
      
      {isResting ? (
        <RestTimer duration={restTime} onComplete={() => setIsResting(false)} />
      ) : (
        <Button onClick={() => {
          setCompletedSets(prev => prev + 1);
          setIsResting(true);
        }}>
          Série Completa
        </Button>
      )}
    </div>
  );
}
```

---

### **6. Histórico de Treinos**

**Prioridade:** Alta  
**Impacto:** Rastreamento de progresso

**Estrutura:**

```prisma
model WorkoutLog {
  id        Int      @id @default(autoincrement())
  userId    Int
  sheetId   Int
  date      DateTime @default(now())
  duration  Int?     // minutos
  notes     String?
  exercises WorkoutExerciseLog[]
  user      User     @relation(fields: [userId], references: [id])
  sheet     TrainingSheet @relation(fields: [sheetId], references: [id])
}

model WorkoutExerciseLog {
  id         Int        @id @default(autoincrement())
  logId      Int
  exerciseId Int
  sets       Int
  reps       Int[]      // [12, 10, 8] - reps por série
  weight     Float[]    // [50, 55, 55] - kg por série
  log        WorkoutLog @relation(fields: [logId], references: [id])
}
```

---

## ⚡ Otimizações de Performance

### **1. Implementar Lazy Loading nas Listas**

**Problema:** Carregar 100+ exercícios de uma vez é lento.

**Solução:** Virtualização com `react-window`

```bash
npm install react-window
```

```tsx
import { FixedSizeList } from 'react-window';

export function VirtualizedExerciseList({ exercises }: { exercises: Exercise[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ExerciseCard exercise={exercises[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={exercises.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

### **2. Implementar Cache com React Query**

**Problema:** Mesmas requisições feitas múltiplas vezes.

**Solução:** React Query para cache e revalidação

```bash
npm install @tanstack/react-query
```

```tsx
// src/hooks/use-exercises.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useExercises(filters?: ExerciseFilters) {
  return useQuery({
    queryKey: ['exercises', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<Exercise[]>('/api/db/exercises', {
        params: filters
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Usar no componente
const { data: exercises, isLoading } = useExercises(filters);
```

---

### **3. Otimizar Imagens**

**Problema:** Imagens não otimizadas pesam muito.

**Solução:** Usar `next/image` e compressão

```tsx
import Image from 'next/image';

<Image
  src="/uploads/exercise-demo.jpg"
  alt="Demonstração do exercício"
  width={400}
  height={300}
  loading="lazy"
  quality={80}
/>
```

---

### **4. Code Splitting por Rota**

**Problema:** Bundle JS muito grande no primeiro carregamento.

**Solução:** Dynamic imports

```tsx
// pages/exercises.tsx
import dynamic from 'next/dynamic';

const ExerciseDialog = dynamic(
  () => import('@/components/dialogs/ExerciseDialog'),
  { ssr: false }
);
```

---

### **5. Implementar Service Worker (PWA)**

**Benefícios:**
- App funciona offline
- Instalável no celular
- Cache de assets

```bash
npm install next-pwa
```

```js
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // ... resto da config
});
```

---

## 🔧 Refatorações Necessárias

### **1. Centralizar Validação com Zod**

**Problema:** Validação espalhada pelo código.

**Solução:** Schemas Zod compartilhados

```typescript
// src/lib/validation-schemas.ts
import { z } from 'zod';

export const exerciseSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(100),
  categoryId: z.number().nullable(),
  description: z.string().optional(),
});

export const trainingSheetSchema = z.object({
  name: z.string().min(1).max(100),
  objective: z.string().min(1),
  exercises: z.array(z.object({
    exerciseId: z.number(),
    sets: z.number().min(1).max(10),
    repetitions: z.string(),
  })),
});
```

**Usar em forms e API:**

```tsx
// Frontend
const { register, handleSubmit } = useForm({
  resolver: zodResolver(exerciseSchema),
});

// API
const body = exerciseSchema.parse(req.body);
```

---

### **2. Extrair Lógica de Negócio para Services**

**Problema:** API routes com muita lógica.

**Solução:** Services layer

```typescript
// src/services/exercise-service.ts
export class ExerciseService {
  async create(data: CreateExerciseDTO, userId: number) {
    // Validação
    // Autorização
    // Regras de negócio
    return await prisma.exercise.create({ data });
  }
  
  async findByUser(userId: number, filters: ExerciseFilters) {
    // Lógica de filtros
    // Paginação
    return await prisma.exercise.findMany({ ... });
  }
}

// pages/api/db/exercises/index.ts
const exerciseService = new ExerciseService();

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  
  if (req.method === 'POST') {
    const exercise = await exerciseService.create(req.body, session.user.id);
    return res.json(exercise);
  }
}
```

---

### **3. Padronizar Respostas de Erro**

**Problema:** Erros inconsistentes.

**Solução:** Error handling centralizado

```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function errorHandler(error: unknown, res: NextApiResponse) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors,
    });
  }
  
  console.error('Unhandled error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

// Usar em API routes
try {
  // ...
} catch (error) {
  return errorHandler(error, res);
}
```

---

### **4. Componentizar Formulários Repetidos**

**Problema:** Forms duplicados em vários diálogos.

**Solução:** Componentes genéricos

```tsx
// src/components/forms/FormField.tsx
export function FormField({
  label,
  error,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Usar
<FormField label="Título" error={errors.title} required>
  <Input {...register('title')} />
</FormField>
```

---

## 🐌 Gargalos Conhecidos

### **1. Query N+1 em Training Sheets**

**Problema:**
```typescript
// Isso faz 1 query + N queries (uma por exercise)
const sheets = await prisma.trainingSheet.findMany();
for (const sheet of sheets) {
  sheet.exercises = await prisma.exerciseConfiguration.findMany({
    where: { trainingSheetId: sheet.id }
  });
}
```

**Solução:**
```typescript
// Usar include para fazer JOIN
const sheets = await prisma.trainingSheet.findMany({
  include: {
    exercises: {
      include: {
        exercise: true,
      },
    },
  },
});
```

---

### **2. Renderização de Listas Grandes**

**Problema:** 500+ cards renderizados de uma vez trava a UI.

**Solução:** Implementar virtualização (item #1 de Performance)

---

### **3. Upload de Arquivos Grandes**

**Problema:** Upload de PDFs >10MB bloqueia a request.

**Solução:** Implementar chunked upload ou usar S3 presigned URLs

---

### **4. Falta de Paginação Server-Side**

**Problema:** Trazer todos os exercícios do banco e filtrar no cliente.

**Solução:**
```typescript
// API com paginação
export default async function handler(req, res) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  
  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.exercise.count(),
  ]);
  
  return res.json({
    data: exercises,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
```

---

## 📅 Roadmap Sugerido

### **Fase 1 - Melhorias Críticas (1-2 meses):**
- ✅ Implementar paginação server-side
- ✅ Adicionar cache com React Query
- ✅ Refatorar validação com Zod
- ✅ Exportação de fichas em PDF
- ✅ Sistema de notificações

### **Fase 2 - Experiência do Usuário (2-3 meses):**
- ✅ Dashboard com gráficos
- ✅ Modo Treino (workout mode)
- ✅ Histórico de treinos
- ✅ Virtualização de listas

### **Fase 3 - Gamificação e Engajamento (3-4 meses):**
- ✅ Sistema de conquistas
- ✅ Metas pessoais
- ✅ Social features (compartilhar fichas)

### **Fase 4 - Escalabilidade (4-6 meses):**
- ✅ PWA com offline support
- ✅ Refatoração para services layer
- ✅ Testes automatizados
- ✅ CI/CD pipeline

---

## 🎁 Funcionalidades Futuras (Brainstorm)

- 📱 App mobile nativo (React Native)
- 🤖 Sugestão de treinos por IA
- 📹 Vídeos de demonstração de exercícios
- 👥 Funcionalidade para personal trainers (gerenciar alunos)
- 🏆 Ranking entre amigos
- 💬 Chat/fórum da comunidade
- 🔗 Integração com wearables (Garmin, Fitbit)
- 📊 Relatórios avançados de progresso
- 🎵 Player de música integrado
- 🌍 Suporte multi-idiomas

---

**Última atualização:** Novembro 2025  
**Contribua:** Tem alguma ideia? Adicione neste documento!
