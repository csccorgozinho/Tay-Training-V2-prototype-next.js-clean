# Guia Completo da API

## 📡 Visão Geral

A API do **Tay Training** é construída usando **Next.js API Routes**, oferecendo endpoints RESTful para todas as operações CRUD do sistema. Todos os endpoints seguem um padrão de resposta consistente e implementam validação usando Zod.

**Base URL (desenvolvimento):** `http://localhost:3000/api`

---

## 📋 Formato de Resposta Padrão

### **Resposta de Sucesso:**

```json
{
  "success": true,
  "data": { /* ... dados solicitados ... */ },
  "meta": {
    "total": 10,
    "count": 10
  }
}
```

### **Resposta de Erro:**

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva",
  "code": "ERROR_CODE"
}
```

### **Códigos de Status HTTP:**

| Código | Significado | Quando Usar |
|--------|-------------|-------------|
| **200** | OK | Requisição bem-sucedida (GET, PUT) |
| **201** | Created | Recurso criado com sucesso (POST) |
| **204** | No Content | Deleção bem-sucedida (DELETE) |
| **400** | Bad Request | Dados inválidos enviados |
| **401** | Unauthorized | Não autenticado |
| **403** | Forbidden | Sem permissão |
| **404** | Not Found | Recurso não encontrado |
| **405** | Method Not Allowed | Método HTTP não suportado |
| **500** | Internal Server Error | Erro no servidor |

---

## 🔐 Autenticação

A maioria dos endpoints requer autenticação via **NextAuth**.

### **Login:**

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Resposta (200):**
```json
{
  "url": "http://localhost:3000/home",
  "ok": true
}
```

### **Logout:**

```http
POST /api/auth/signout
```

### **Verificar Sessão:**

```http
GET /api/auth/session
```

**Resposta (200):**
```json
{
  "user": {
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "expires": "2025-12-01T00:00:00.000Z"
}
```

---

## 🏋️ Exercícios (Exercises)

### **GET /api/db/exercises**

Lista todos os exercícios cadastrados.

**Parâmetros de Query:**
- `hasMethod` (opcional): `true` | `false` - Filtrar por exercícios com/sem método

**Exemplo:**

```http
GET /api/db/exercises?hasMethod=true
```

**Resposta (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Supino Reto",
      "description": "Exercício para peitoral com barra",
      "videoUrl": "https://youtube.com/watch?v=xyz",
      "hasMethod": true,
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-20T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Agachamento Livre",
      "description": "Exercício para membros inferiores",
      "videoUrl": null,
      "hasMethod": false,
      "createdAt": "2025-11-20T11:00:00Z",
      "updatedAt": "2025-11-20T11:00:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "count": 2
  }
}
```

---

### **POST /api/db/exercises**

Cria um novo exercício.

**Body:**

```json
{
  "name": "Leg Press 45°",
  "description": "Exercício de leg press na máquina 45 graus",
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "hasMethod": true
}
```

**Validação:**
- ✅ `name`: string obrigatória, mínimo 1 caractere
- ✅ `description`: string opcional
- ✅ `videoUrl`: string opcional, formato URL válido
- ✅ `hasMethod`: boolean opcional, padrão `true`

**Resposta (201):**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Leg Press 45°",
    "description": "Exercício de leg press na máquina 45 graus",
    "videoUrl": "https://youtube.com/watch?v=abc123",
    "hasMethod": true,
    "createdAt": "2025-11-29T10:00:00Z",
    "updatedAt": "2025-11-29T10:00:00Z"
  }
}
```

**Erros Possíveis:**

```json
// 400 - Nome obrigatório
{
  "success": false,
  "error": "Name is required"
}

// 400 - URL inválida
{
  "success": false,
  "error": "Invalid video URL format"
}
```

---

### **GET /api/db/exercises/:id**

Busca um exercício específico por ID.

**Exemplo:**

```http
GET /api/db/exercises/1
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Supino Reto",
    "description": "Exercício para peitoral com barra",
    "videoUrl": "https://youtube.com/watch?v=xyz",
    "hasMethod": true,
    "createdAt": "2025-11-20T10:00:00Z",
    "updatedAt": "2025-11-20T10:00:00Z"
  }
}
```

**Erros:**

```json
// 404 - Não encontrado
{
  "success": false,
  "error": "Exercise not found"
}
```

---

### **PUT /api/db/exercises/:id**

Atualiza um exercício existente.

**Body:**

```json
{
  "name": "Supino Reto com Barra",
  "description": "Exercício principal para peitoral maior",
  "videoUrl": "https://youtube.com/watch?v=new-url",
  "hasMethod": true
}
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Supino Reto com Barra",
    "description": "Exercício principal para peitoral maior",
    "videoUrl": "https://youtube.com/watch?v=new-url",
    "hasMethod": true,
    "createdAt": "2025-11-20T10:00:00Z",
    "updatedAt": "2025-11-29T12:00:00Z"
  }
}
```

---

### **DELETE /api/db/exercises/:id**

Remove um exercício.

**Exemplo:**

```http
DELETE /api/db/exercises/1
```

**Resposta (200):**

```json
{
  "success": true,
  "message": "Exercise deleted successfully"
}
```

**Erros:**

```json
// 404 - Não encontrado
{
  "success": false,
  "error": "Exercise not found"
}

// 409 - Conflito (exercício sendo usado)
{
  "success": false,
  "error": "Cannot delete exercise: it is being used in workout sheets"
}
```

---

## 🎯 Métodos de Treino (Methods)

### **GET /api/db/methods**

Lista todos os métodos de treinamento.

**Resposta (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Drop Set",
      "description": "Redução progressiva de carga até a falha",
      "createdAt": "2025-11-20T09:00:00Z",
      "updatedAt": "2025-11-20T09:00:00Z"
    },
    {
      "id": 2,
      "name": "Bi-Set",
      "description": "Dois exercícios consecutivos sem descanso",
      "createdAt": "2025-11-20T09:00:00Z",
      "updatedAt": "2025-11-20T09:00:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

---

### **POST /api/db/methods**

Cria um novo método de treinamento.

**Body:**

```json
{
  "name": "Rest-Pause",
  "description": "Descanso curto de 15-20 segundos entre séries"
}
```

**Validação:**
- ✅ `name`: string obrigatória, mínimo 1 caractere
- ✅ `description`: string obrigatória, mínimo 1 caractere

**Resposta (201):**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Rest-Pause",
    "description": "Descanso curto de 15-20 segundos entre séries",
    "createdAt": "2025-11-29T10:00:00Z",
    "updatedAt": "2025-11-29T10:00:00Z"
  }
}
```

---

### **GET /api/db/methods/:id**

Busca um método específico.

**Exemplo:**

```http
GET /api/db/methods/1
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Drop Set",
    "description": "Redução progressiva de carga até a falha",
    "createdAt": "2025-11-20T09:00:00Z",
    "updatedAt": "2025-11-20T09:00:00Z"
  }
}
```

---

### **PUT /api/db/methods/:id**

Atualiza um método existente.

**Body:**

```json
{
  "name": "Drop Set Avançado",
  "description": "Redução progressiva de carga até a falha muscular completa"
}
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Drop Set Avançado",
    "description": "Redução progressiva de carga até a falha muscular completa",
    "createdAt": "2025-11-20T09:00:00Z",
    "updatedAt": "2025-11-29T13:00:00Z"
  }
}
```

---

### **DELETE /api/db/methods/:id**

Remove um método de treinamento.

**Exemplo:**

```http
DELETE /api/db/methods/1
```

**Resposta (200):**

```json
{
  "success": true,
  "message": "Method deleted successfully"
}
```

---

## 📋 Grupos de Exercícios (Exercise Groups)

### **GET /api/exercise-groups**

Lista todos os grupos de exercícios com configurações.

**Parâmetros de Query:**
- `categoryId` (opcional): Filtrar por categoria

**Exemplo:**

```http
GET /api/exercise-groups?categoryId=1
```

**Resposta (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Treino A - Peito e Tríceps",
      "categoryId": 1,
      "publicName": "Peito e Tríceps",
      "createdAt": "2025-11-25T10:00:00Z",
      "updatedAt": "2025-11-25T10:00:00Z",
      "category": {
        "id": 1,
        "name": "Musculação"
      },
      "exerciseMethods": [
        {
          "id": 1,
          "rest": "90 segundos",
          "observations": "Carga progressiva",
          "order": 1,
          "exerciseConfigurations": [
            {
              "id": 1,
              "series": "4",
              "reps": "8-12",
              "exercise": {
                "id": 1,
                "name": "Supino Reto"
              },
              "method": {
                "id": 1,
                "name": "Drop Set"
              }
            }
          ]
        }
      ]
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

### **POST /api/exercise-groups**

Cria um novo grupo de exercícios.

**Body:**

```json
{
  "name": "Treino B - Costas e Bíceps",
  "categoryId": 1,
  "publicName": "Costas e Bíceps",
  "exerciseMethods": [
    {
      "rest": "60 segundos",
      "observations": "Foco em amplitude",
      "order": 1,
      "exerciseConfigurations": [
        {
          "exerciseId": 5,
          "methodId": 2,
          "series": "3",
          "reps": "10"
        }
      ]
    }
  ]
}
```

**Validação:**
- ✅ `name`: string obrigatória
- ✅ `categoryId`: número obrigatório, categoria deve existir
- ✅ `publicName`: string opcional
- ✅ `exerciseMethods`: array opcional de configurações

**Resposta (201):**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Treino B - Costas e Bíceps",
    "categoryId": 1,
    "publicName": "Costas e Bíceps",
    "createdAt": "2025-11-29T14:00:00Z",
    "updatedAt": "2025-11-29T14:00:00Z"
  }
}
```

---

### **GET /api/exercise-groups/:id**

Busca um grupo específico com todas as configurações.

**Exemplo:**

```http
GET /api/exercise-groups/1
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Treino A - Peito e Tríceps",
    "categoryId": 1,
    "publicName": "Peito e Tríceps",
    "exerciseMethods": [
      {
        "id": 1,
        "rest": "90 segundos",
        "observations": "Carga progressiva",
        "order": 1,
        "exerciseConfigurations": [
          {
            "id": 1,
            "series": "4",
            "reps": "8-12",
            "exercise": {
              "id": 1,
              "name": "Supino Reto",
              "videoUrl": "https://youtube.com/watch?v=xyz"
            },
            "method": {
              "id": 1,
              "name": "Drop Set"
            }
          }
        ]
      }
    ]
  }
}
```

---

### **PUT /api/exercise-groups/:id**

Atualiza um grupo de exercícios.

**Body:**

```json
{
  "name": "Treino A - Peito, Tríceps e Ombros",
  "publicName": "Peito Completo"
}
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Treino A - Peito, Tríceps e Ombros",
    "categoryId": 1,
    "publicName": "Peito Completo",
    "createdAt": "2025-11-25T10:00:00Z",
    "updatedAt": "2025-11-29T15:00:00Z"
  }
}
```

---

### **DELETE /api/exercise-groups/:id**

Remove um grupo de exercícios.

**Exemplo:**

```http
DELETE /api/exercise-groups/1
```

**Resposta (200):**

```json
{
  "success": true,
  "message": "Exercise group deleted successfully"
}
```

---

## 📄 Fichas de Treino (Training Sheets)

### **GET /api/training-sheets**

Lista todas as fichas de treino.

**Parâmetros de Query:**
- `categoryId` (opcional): Filtrar por categoria

**Exemplo:**

```http
GET /api/training-sheets?categoryId=1
```

**Resposta (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Programa Hipertrofia Iniciante",
      "publicName": "Hipertrofia 3x",
      "slug": "hipertrofia-iniciante",
      "offlinePdf": "/uploads/pdfs/sheet-1-offline.pdf",
      "newTabPdf": "/uploads/pdfs/sheet-1-newtab.pdf",
      "pdfPath": "/uploads/pdfs/sheet-1.pdf",
      "createdAt": "2025-11-28T10:00:00Z",
      "updatedAt": "2025-11-28T10:00:00Z",
      "trainingDays": [
        {
          "id": 1,
          "day": 1,
          "shortName": "A",
          "exerciseGroup": {
            "id": 1,
            "name": "Treino A - Peito e Tríceps"
          }
        },
        {
          "id": 2,
          "day": 3,
          "shortName": "B",
          "exerciseGroup": {
            "id": 2,
            "name": "Treino B - Costas e Bíceps"
          }
        }
      ]
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

### **POST /api/training-sheets**

Cria uma nova ficha de treino.

**Body:**

```json
{
  "name": "Programa Force Full Body",
  "publicName": "Full Body 3x",
  "slug": "full-body-force",
  "trainingDays": [
    {
      "day": 1,
      "exerciseGroupId": 1,
      "shortName": "A"
    },
    {
      "day": 3,
      "exerciseGroupId": 2,
      "shortName": "B"
    },
    {
      "day": 5,
      "exerciseGroupId": 3,
      "shortName": "C"
    }
  ]
}
```

**Validação:**
- ✅ `name`: string obrigatória
- ✅ `publicName`: string opcional
- ✅ `slug`: string opcional (gerado automaticamente se omitido)
- ✅ `trainingDays`: array obrigatório com pelo menos 1 dia
- ✅ `day`: número de 1 a 7 (dia da semana)
- ✅ `exerciseGroupId`: deve existir no banco
- ✅ `shortName`: string opcional (A, B, C, etc.)

**Resposta (201):**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Programa Force Full Body",
    "publicName": "Full Body 3x",
    "slug": "full-body-force",
    "offlinePdf": null,
    "newTabPdf": null,
    "pdfPath": null,
    "createdAt": "2025-11-29T16:00:00Z",
    "updatedAt": "2025-11-29T16:00:00Z",
    "trainingDays": [
      {
        "id": 3,
        "day": 1,
        "shortName": "A",
        "exerciseGroupId": 1
      },
      {
        "id": 4,
        "day": 3,
        "shortName": "B",
        "exerciseGroupId": 2
      },
      {
        "id": 5,
        "day": 5,
        "shortName": "C",
        "exerciseGroupId": 3
      }
    ]
  }
}
```

---

### **GET /api/training-sheets/:id**

Busca uma ficha específica com todos os detalhes.

**Exemplo:**

```http
GET /api/training-sheets/1
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Programa Hipertrofia Iniciante",
    "publicName": "Hipertrofia 3x",
    "slug": "hipertrofia-iniciante",
    "trainingDays": [
      {
        "id": 1,
        "day": 1,
        "shortName": "A",
        "exerciseGroup": {
          "id": 1,
          "name": "Treino A - Peito e Tríceps",
          "exerciseMethods": [
            {
              "id": 1,
              "rest": "90 segundos",
              "observations": "Carga progressiva",
              "exerciseConfigurations": [
                {
                  "id": 1,
                  "series": "4",
                  "reps": "8-12",
                  "exercise": {
                    "name": "Supino Reto",
                    "videoUrl": "https://youtube.com/watch?v=xyz"
                  },
                  "method": {
                    "name": "Drop Set"
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

---

### **PUT /api/training-sheets/:id**

Atualiza uma ficha existente.

**Body:**

```json
{
  "name": "Programa Hipertrofia Intermediário",
  "publicName": "Hipertrofia 4x"
}
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Programa Hipertrofia Intermediário",
    "publicName": "Hipertrofia 4x",
    "slug": "hipertrofia-iniciante",
    "createdAt": "2025-11-28T10:00:00Z",
    "updatedAt": "2025-11-29T17:00:00Z"
  }
}
```

---

### **DELETE /api/training-sheets/:id**

Remove uma ficha de treino.

**Exemplo:**

```http
DELETE /api/training-sheets/1
```

**Resposta (200):**

```json
{
  "success": true,
  "message": "Training sheet deleted successfully"
}
```

---

## 📅 Agendamento de Treinos

### **GET /api/training-schedule/workouts**

Lista workouts agendados.

**Resposta (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-11-29",
      "completed": false,
      "trainingSheet": {
        "id": 1,
        "name": "Programa Hipertrofia"
      }
    }
  ]
}
```

---

## 👤 Perfil do Usuário

### **GET /api/user/profile**

Busca informações do usuário autenticado.

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "createdAt": "2025-11-01T00:00:00Z"
  }
}
```

---

### **PUT /api/user/profile**

Atualiza informações do perfil.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com"
}
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "updatedAt": "2025-11-29T18:00:00Z"
  }
}
```

---

## 📊 Categorias

### **GET /api/categories**

Lista todas as categorias de grupos.

**Resposta (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Musculação",
      "createdAt": "2025-11-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Funcional",
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ]
}
```

---

## 🛡️ Tratamento de Erros

### **Erros de Validação (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### **Não Autenticado (401):**

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource"
}
```

### **Não Encontrado (404):**

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource with ID 999 not found"
}
```

### **Método Não Permitido (405):**

```json
{
  "success": false,
  "error": "Method Not Allowed",
  "message": "Method PATCH not allowed on this endpoint"
}
```

### **Erro Interno (500):**

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## 📚 Exemplos de Uso Completos

### **Exemplo 1: Criar e Agendar Ficha Completa**

```javascript
// 1. Criar categoria
const categoryRes = await fetch('/api/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Musculação' })
});
const category = await categoryRes.json();

// 2. Criar exercícios
const exercise1 = await fetch('/api/db/exercises', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Supino Reto',
    description: 'Peitoral',
    hasMethod: true
  })
}).then(r => r.json());

// 3. Criar método
const method = await fetch('/api/db/methods', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Drop Set',
    description: 'Redução de carga'
  })
}).then(r => r.json());

// 4. Criar grupo de exercícios
const group = await fetch('/api/exercise-groups', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Treino A',
    categoryId: category.data.id,
    exerciseMethods: [{
      rest: '90s',
      order: 1,
      exerciseConfigurations: [{
        exerciseId: exercise1.data.id,
        methodId: method.data.id,
        series: '4',
        reps: '8-12'
      }]
    }]
  })
}).then(r => r.json());

// 5. Criar ficha
const sheet = await fetch('/api/training-sheets', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Programa Completo',
    trainingDays: [{
      day: 1,
      exerciseGroupId: group.data.id,
      shortName: 'A'
    }]
  })
}).then(r => r.json());

console.log('Ficha criada:', sheet);
```

---

## 🔄 Rate Limiting

Atualmente, **não há rate limiting implementado**. Em produção, considere adicionar:

```javascript
// Exemplo usando express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});
```

---

## 📦 Headers Recomendados

```http
# Requisições
Content-Type: application/json
Accept: application/json
Cookie: next-auth.session-token=xxx

# Respostas
Content-Type: application/json; charset=utf-8
X-Response-Time: 45ms
Cache-Control: no-cache
```

---

## 🧪 Testando a API

### **Usando cURL:**

```bash
# Login
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Listar exercícios
curl http://localhost:3000/api/db/exercises

# Criar exercício
curl -X POST http://localhost:3000/api/db/exercises \
  -H "Content-Type: application/json" \
  -d '{"name":"Agachamento","description":"Membros inferiores"}'
```

### **Usando Postman/Insomnia:**

1. Importe a collection (criar arquivo JSON com endpoints)
2. Configure variável de ambiente `baseUrl = http://localhost:3000`
3. Faça login para obter cookie de sessão
4. Teste todos os endpoints

---

## 📋 Resumo de Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| **Autenticação** |
| POST | `/api/auth/signin` | Login |
| POST | `/api/auth/signout` | Logout |
| GET | `/api/auth/session` | Verificar sessão |
| **Exercícios** |
| GET | `/api/db/exercises` | Listar exercícios |
| POST | `/api/db/exercises` | Criar exercício |
| GET | `/api/db/exercises/:id` | Buscar exercício |
| PUT | `/api/db/exercises/:id` | Atualizar exercício |
| DELETE | `/api/db/exercises/:id` | Deletar exercício |
| **Métodos** |
| GET | `/api/db/methods` | Listar métodos |
| POST | `/api/db/methods` | Criar método |
| GET | `/api/db/methods/:id` | Buscar método |
| PUT | `/api/db/methods/:id` | Atualizar método |
| DELETE | `/api/db/methods/:id` | Deletar método |
| **Grupos** |
| GET | `/api/exercise-groups` | Listar grupos |
| POST | `/api/exercise-groups` | Criar grupo |
| GET | `/api/exercise-groups/:id` | Buscar grupo |
| PUT | `/api/exercise-groups/:id` | Atualizar grupo |
| DELETE | `/api/exercise-groups/:id` | Deletar grupo |
| **Fichas** |
| GET | `/api/training-sheets` | Listar fichas |
| POST | `/api/training-sheets` | Criar ficha |
| GET | `/api/training-sheets/:id` | Buscar ficha |
| PUT | `/api/training-sheets/:id` | Atualizar ficha |
| DELETE | `/api/training-sheets/:id` | Deletar ficha |
| **Perfil** |
| GET | `/api/user/profile` | Buscar perfil |
| PUT | `/api/user/profile` | Atualizar perfil |
| **Categorias** |
| GET | `/api/categories` | Listar categorias |

---

**Última atualização:** Novembro 2025  
**Versão da API:** 1.0
