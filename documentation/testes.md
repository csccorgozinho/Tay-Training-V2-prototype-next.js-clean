# Guia de Testes

## 🧪 Estratégia de Testes do Projeto

Este documento descreve como escrever e executar testes para o projeto Tay Training, incluindo testes de backend, frontend e exemplos práticos.

---

## 📋 Tipos de Testes

### **1. Testes Unitários**
- Testam funções e componentes isolados
- Rápidos e focados
- Cobrem lógica de negócio e utilitários

### **2. Testes de Integração**
- Testam interação entre componentes
- APIs + Banco de dados
- Fluxos completos

### **3. Testes E2E (End-to-End)**
- Simulam usuário real
- Testam aplicação completa
- Garantem que fluxos críticos funcionam

---

## 🛠️ Setup Inicial

### **Instalar Dependências:**

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  @types/jest \
  vitest \
  @vitejs/plugin-react
```

### **Configurar Jest:**

```js
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'pages/api/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

```js
// jest.setup.js
import '@testing-library/jest-dom';
```

### **Adicionar Scripts no package.json:**

```json
{
  "scripts": {
    "test": "jest --watch",
    "test:ci": "jest --ci --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## 🔧 Testes de Backend

### **Teste 1: API de Exercícios - Criar Exercício**

**Arquivo:** `pages/api/db/exercises/__tests__/index.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import handler from '../index';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    exercise: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('/api/db/exercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de sessão autenticada
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com' },
    });
  });

  it('deve criar um exercício com sucesso', async () => {
    const mockExercise = {
      id: 1,
      title: 'Supino Reto',
      categoryId: 1,
      createdAt: new Date(),
    };

    (prisma.exercise.create as jest.Mock).mockResolvedValue(mockExercise);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Supino Reto',
        categoryId: 1,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toEqual(mockExercise);
    expect(prisma.exercise.create).toHaveBeenCalledWith({
      data: {
        title: 'Supino Reto',
        categoryId: 1,
      },
    });
  });

  it('deve retornar 400 se título estiver vazio', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: '',
        categoryId: 1,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBeDefined();
  });

  it('deve retornar 401 se usuário não estiver autenticado', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Supino Reto',
        categoryId: 1,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('deve listar exercícios', async () => {
    const mockExercises = [
      { id: 1, title: 'Supino', categoryId: 1 },
      { id: 2, title: 'Agachamento', categoryId: 2 },
    ];

    (prisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockExercises);
  });
});
```

### **Teste 2: Service - Training Sheet Service**

**Arquivo:** `src/lib/__tests__/training-sheet-service.test.ts`

```typescript
import { TrainingSheetService } from '../training-sheet-service';
import { prisma } from '../prisma';

jest.mock('../prisma', () => ({
  prisma: {
    trainingSheet: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('TrainingSheetService', () => {
  let service: TrainingSheetService;

  beforeEach(() => {
    service = new TrainingSheetService();
    jest.clearAllMocks();
  });

  it('deve criar uma ficha de treino com exercícios', async () => {
    const input = {
      name: 'Treino A',
      objective: 'Hipertrofia',
      exercises: [
        { exerciseId: 1, sets: 3, repetitions: '12' },
        { exerciseId: 2, sets: 4, repetitions: '10' },
      ],
    };

    const mockResult = {
      id: 1,
      ...input,
      createdAt: new Date(),
    };

    (prisma.trainingSheet.create as jest.Mock).mockResolvedValue(mockResult);

    const result = await service.createSheet(input, 1);

    expect(result).toEqual(mockResult);
    expect(prisma.trainingSheet.create).toHaveBeenCalledWith({
      data: {
        name: 'Treino A',
        objective: 'Hipertrofia',
        userId: 1,
        exercises: {
          create: [
            { exerciseId: 1, sets: 3, repetitions: '12' },
            { exerciseId: 2, sets: 4, repetitions: '10' },
          ],
        },
      },
      include: { exercises: true },
    });
  });

  it('deve lançar erro se ficha não tiver exercícios', async () => {
    const input = {
      name: 'Treino A',
      objective: 'Hipertrofia',
      exercises: [],
    };

    await expect(service.createSheet(input, 1)).rejects.toThrow(
      'Ficha deve ter pelo menos um exercício'
    );
  });
});
```

### **Teste 3: Utilitário - Validação de Email**

**Arquivo:** `src/lib/__tests__/utils.test.ts`

```typescript
import { validateEmail, formatDate } from '../utils';

describe('Utils', () => {
  describe('validateEmail', () => {
    it('deve aceitar email válido', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('deve formatar data corretamente', () => {
      const date = new Date('2025-01-15T10:30:00');
      expect(formatDate(date)).toBe('15/01/2025');
    });
  });
});
```

---

## ⚛️ Testes de Frontend

### **Teste 1: Componente - Card**

**Arquivo:** `src/components/ui/__tests__/card.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '../card';

describe('Card Component', () => {
  it('deve renderizar com título e conteúdo', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Meu Título</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Conteúdo do card</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Meu Título')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument();
  });

  it('deve aplicar className customizada', () => {
    const { container } = render(
      <Card className="custom-class">Conteúdo</Card>
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });
});
```

### **Teste 2: Componente - ExerciseDialog**

**Arquivo:** `src/components/dialogs/__tests__/ExerciseDialog.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExerciseDialog from '../ExerciseDialog';
import { apiClient } from '@/lib/api-client';

// Mock API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('ExerciseDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock categorias
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, name: 'Peito' },
        { id: 2, name: 'Costas' },
      ],
    });
  });

  it('deve renderizar formulário de criação', async () => {
    render(
      <ExerciseDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
    });
  });

  it('deve criar exercício com sucesso', async () => {
    const user = userEvent.setup();
    
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { id: 1, title: 'Supino', categoryId: 1 },
    });

    render(
      <ExerciseDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Preencher formulário
    const titleInput = screen.getByLabelText(/título/i);
    await user.type(titleInput, 'Supino Reto');

    // Selecionar categoria
    const categorySelect = screen.getByLabelText(/categoria/i);
    await user.click(categorySelect);
    await user.click(screen.getByText('Peito'));

    // Submeter
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/db/exercises', {
        title: 'Supino Reto',
        categoryId: 1,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('deve mostrar erro de validação se título estiver vazio', async () => {
    const user = userEvent.setup();

    render(
      <ExerciseDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/título é obrigatório/i)).toBeInTheDocument();
    });
  });
});
```

### **Teste 3: Hook - usePagination**

**Arquivo:** `src/hooks/__tests__/use-pagination.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../use-pagination';

describe('usePagination', () => {
  it('deve calcular páginas corretamente', () => {
    const { result } = renderHook(() => usePagination(100, 10));

    expect(result.current.totalPages).toBe(10);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(10);
  });

  it('deve navegar para página específica', () => {
    const { result } = renderHook(() => usePagination(100, 10));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.startIndex).toBe(20);
    expect(result.current.endIndex).toBe(30);
  });

  it('não deve ultrapassar limite de páginas', () => {
    const { result } = renderHook(() => usePagination(100, 10));

    act(() => {
      result.current.goToPage(999);
    });

    expect(result.current.currentPage).toBe(10); // Máximo
  });

  it('não deve ir abaixo da página 1', () => {
    const { result } = renderHook(() => usePagination(100, 10));

    act(() => {
      result.current.goToPage(-5);
    });

    expect(result.current.currentPage).toBe(1); // Mínimo
  });
});
```

### **Teste 4: Página Completa - Home**

**Arquivo:** `src/pages/__tests__/Home.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import Home from '../Home';
import { useRouter } from 'next/router';

// Mock Next Router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock Framer Motion para evitar problemas com animações
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Home Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('deve renderizar cards de estatísticas', () => {
    render(<Home />);

    expect(screen.getByText(/exercícios cadastrados/i)).toBeInTheDocument();
    expect(screen.getByText(/métodos disponíveis/i)).toBeInTheDocument();
    expect(screen.getByText(/fichas de treino/i)).toBeInTheDocument();
  });

  it('deve ter botões de acesso rápido', () => {
    render(<Home />);

    expect(screen.getByText(/gerenciar exercícios/i)).toBeInTheDocument();
    expect(screen.getByText(/criar ficha de treino/i)).toBeInTheDocument();
  });

  it('deve navegar ao clicar em card', async () => {
    render(<Home />);

    const exerciseCard = screen.getByText(/gerenciar exercícios/i).closest('div');
    exerciseCard?.click();

    // Depende da implementação real do onClick
    // Este é um exemplo genérico
  });
});
```

---

## 🚀 Como Executar os Testes

### **Rodar Todos os Testes:**

```bash
npm test
```

### **Rodar com Coverage:**

```bash
npm run test:ci
```

**Output esperado:**
```
PASS  src/components/ui/__tests__/card.test.tsx
PASS  src/hooks/__tests__/use-pagination.test.ts
PASS  pages/api/db/exercises/__tests__/index.test.ts

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        3.456 s

Coverage:
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
All files               |   75.2  |   68.4   |   80.1  |   76.3  |
```

### **Rodar Testes Específicos:**

```bash
# Por arquivo
npm test -- card.test.tsx

# Por padrão
npm test -- --testPathPattern=hooks

# Por nome de teste
npm test -- --testNamePattern="deve criar exercício"
```

### **Modo Watch (Desenvolvimento):**

```bash
npm test -- --watch
```

---

## 🎭 Testes E2E com Playwright (Opcional)

### **Instalar Playwright:**

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### **Configurar:**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### **Exemplo de Teste E2E:**

```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('deve fazer login com sucesso', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/home');
  await expect(page.locator('text=Bem-vindo')).toBeVisible();
});

test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'wrong@example.com');
  await page.fill('input[name="password"]', 'wrongpass');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
});
```

**Executar:**

```bash
npx playwright test
```

---

## 📊 Cobertura de Testes (Coverage)

### **Objetivo de Cobertura:**

| Tipo | Mínimo | Ideal |
|------|--------|-------|
| Statements | 70% | 85%+ |
| Branches | 65% | 80%+ |
| Functions | 75% | 90%+ |
| Lines | 70% | 85%+ |

### **Ver Relatório HTML:**

```bash
npm run test:ci
open coverage/lcov-report/index.html
```

---

## ✅ Checklist de Testes

### **Antes de Commitar:**

- [ ] Todos os testes passam
- [ ] Novos recursos têm testes
- [ ] Coverage não diminuiu
- [ ] Sem testes flaky (instáveis)

### **O Que Testar (Prioridade):**

1. **CRÍTICO:**
   - Autenticação e autorização
   - Criação/edição/exclusão de dados
   - Validação de formulários
   - APIs principais

2. **ALTO:**
   - Componentes reutilizáveis (Card, Button, Dialog)
   - Hooks customizados
   - Lógica de negócio (services)
   - Filtros e buscas

3. **MÉDIO:**
   - Formatadores (datas, números)
   - Utilidades
   - Animações complexas

4. **BAIXO:**
   - Estilização
   - Textos estáticos
   - Páginas simples

---

## 🎯 Boas Práticas

### **1. Nomear Testes Claramente:**

```typescript
// ✅ Bom
it('deve retornar erro 401 se usuário não estiver autenticado')

// ❌ Ruim
it('test auth')
```

### **2. Usar Arrange-Act-Assert (AAA):**

```typescript
it('deve criar exercício', async () => {
  // Arrange - preparar
  const mockData = { title: 'Supino', categoryId: 1 };
  
  // Act - executar
  const result = await createExercise(mockData);
  
  // Assert - verificar
  expect(result.id).toBeDefined();
  expect(result.title).toBe('Supino');
});
```

### **3. Limpar Entre Testes:**

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup(); // React Testing Library
});
```

### **4. Testar Casos de Erro:**

```typescript
it('deve lançar erro se dados inválidos', async () => {
  await expect(createExercise({ title: '' }))
    .rejects
    .toThrow('Título obrigatório');
});
```

---

## 📚 Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Última atualização:** Novembro 2025  
**Status:** Testes em desenvolvimento - contribua adicionando mais exemplos!
