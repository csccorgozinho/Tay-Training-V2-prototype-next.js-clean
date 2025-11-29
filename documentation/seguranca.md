# Segurança do Projeto

## 🔒 Análise de Segurança

Este documento identifica problemas de segurança encontrados, boas práticas recomendadas e pontos que necessitam melhorias.

---

## ⚠️ Problemas Identificados

### **1. CRÍTICO: Senha Hardcoded no Seed**

**Localização:** `prisma/seed.ts`

**Problema:**
```typescript
// Senha padrão "admin123" está hardcoded
password: await bcrypt.hash('admin123', 10)
```

**Risco:** Alta  
**Impacto:** Acesso não autorizado ao sistema em produção

**Solução:**
```typescript
// Usar variável de ambiente
const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 
  crypto.randomBytes(16).toString('hex');
password: await bcrypt.hash(defaultPassword, 10)
```

---

### **2. ALTO: NextAuth Secret Fraco**

**Localização:** `.env`

**Problema:** Se o `NEXTAUTH_SECRET` for fraco ou compartilhado, sessões podem ser forjadas.

**Solução:**
```bash
# Gerar secret criptograficamente seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Adicionar ao .env
NEXTAUTH_SECRET=<generated_secret>
```

**Requisitos:**
- Mínimo 32 caracteres
- Aleatório e único por ambiente
- Nunca commitar no Git

---

### **3. MÉDIO: Ausência de Rate Limiting**

**Problema:** APIs desprotegidas contra ataques de força bruta.

**Endpoints Vulneráveis:**
- `/api/auth/signin` - Login sem limite de tentativas
- `/api/db/exercises` - Pode ser spammado
- Todos os endpoints POST/PUT/DELETE

**Solução:**

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
});
```

**Aplicar em API routes:**

```typescript
// pages/api/auth/signin.ts
import { loginLimiter } from '@/middleware/rate-limit';

export default async function handler(req, res) {
  await loginLimiter(req, res);
  // ... resto do código
}
```

---

### **4. MÉDIO: SQL Injection via Prisma (Baixo Risco)**

**Status:** Prisma previne automaticamente SQL injection através de prepared statements, **MAS** é importante nunca usar `$queryRaw` com strings concatenadas.

**❌ Evitar:**
```typescript
// NUNCA faça isso:
prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

**✅ Correto:**
```typescript
// Sempre use Prisma queries ou parametrized queries
prisma.user.findUnique({ where: { email: userInput } });
```

---

### **5. MÉDIO: Validação Insuficiente de Upload**

**Localização:** `src/lib/file-upload.ts`

**Problema:** Uploads de arquivos sem validação rigorosa de tipo e tamanho.

**Riscos:**
- Upload de executáveis maliciosos
- Ataques de DoS com arquivos gigantes
- Path traversal

**Solução:**

```typescript
// src/lib/file-upload.ts
import formidable from 'formidable';
import path from 'path';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.png', '.jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateUpload(file: formidable.File): { valid: boolean; error?: string } {
  // Validar extensão
  const ext = path.extname(file.originalFilename || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Tipo de arquivo não permitido' };
  }
  
  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande (máx 10MB)' };
  }
  
  // Validar MIME type
  const validMimes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!validMimes.includes(file.mimetype || '')) {
    return { valid: false, error: 'Tipo MIME inválido' };
  }
  
  return { valid: true };
}
```

---

### **6. BAIXO: Logs Sensíveis no Console**

**Problema:** Logs podem expor informações sensíveis em produção.

**Solução:**

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[INFO]', message, data);
    }
  },
  error: (message: string, error?: any) => {
    // Sempre logar erros, mas sanitizar dados sensíveis
    const sanitized = sanitizeError(error);
    console.error('[ERROR]', message, sanitized);
  }
};

function sanitizeError(error: any) {
  if (!error) return error;
  const { password, token, secret, ...safe } = error;
  return safe;
}
```

---

### **7. BAIXO: CORS Não Configurado**

**Problema:** Em produção, aceita requests de qualquer origem.

**Solução:**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

---

## ✅ Boas Práticas Implementadas

### **1. Autenticação Segura**
- ✅ Senhas hasheadas com bcryptjs (cost factor 10)
- ✅ Sessões gerenciadas por NextAuth com JWT
- ✅ Tokens de sessão em cookies HttpOnly

### **2. Validação de Dados**
- ✅ Zod schemas em todos os endpoints
- ✅ Sanitização de inputs
- ✅ TypeScript para tipagem forte

### **3. Separação de Ambientes**
- ✅ Variáveis de ambiente para secrets
- ✅ `.env.example` para documentação
- ✅ `.gitignore` protegendo `.env`

---

## 🛡️ Como Hardenizar o Projeto

### **1. Checklist de Produção:**

```bash
# Atualizar dependências
npm audit fix

# Verificar vulnerabilidades
npm audit

# Usar versões fixas (não ^ ou ~)
# package.json: "next": "14.0.0" ao invés de "^14.0.0"
```

### **2. Configurar Helmet.js (Segurança HTTP):**

```bash
npm install helmet
```

```typescript
// middleware/security.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
});
```

### **3. Habilitar HTTPS:**

```bash
# Em produção, sempre usar HTTPS
# Vercel/Netlify fazem isso automaticamente

# Para desenvolvimento local:
npm install --save-dev @vitejs/plugin-basic-ssl
```

### **4. Sanitizar Saídas (XSS Prevention):**

```typescript
import DOMPurify from 'isomorphic-dompurify';

function renderUserContent(html: string) {
  return { __html: DOMPurify.sanitize(html) };
}

<div dangerouslySetInnerHTML={renderUserContent(userInput)} />
```

### **5. Implementar CSP (Content Security Policy):**

```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.yourdomain.com;
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

---

## 🔐 Cuidados com API, Tokens e Permissões

### **Proteção de Endpoints:**

```typescript
// src/lib/api-middleware.ts
import { getServerSession } from 'next-auth';
import { authConfig } from './auth-config';

export async function requireAuth(req, res) {
  const session = await getServerSession(req, res, authConfig);
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  return session;
}

// Usar em cada API route
export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return; // Já respondeu com 401
  
  // Código protegido
}
```

### **Validação de Permissões:**

```typescript
// Adicionar roles ao User model
model User {
  id       Int    @id @default(autoincrement())
  email    String
  password String
  role     Role   @default(USER)
}

enum Role {
  USER
  ADMIN
  TRAINER
}

// Middleware de autorização
export function requireRole(allowedRoles: Role[]) {
  return async (req, res, session) => {
    if (!allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  };
}
```

---

## 🚨 Pontos Fracos que Precisam Ser Melhorados

### **1. Sem Autenticação 2FA**
**Risco:** Médio  
**Recomendação:** Implementar TOTP (Google Authenticator) para admins

### **2. Sem Log de Auditoria**
**Risco:** Médio  
**Recomendação:** Registrar todas as ações críticas (criar/editar/deletar)

### **3. Sem Backup Automático**
**Risco:** Alto  
**Recomendação:** Configurar backups diários do PostgreSQL

### **4. Sem Monitoramento de Segurança**
**Risco:** Médio  
**Recomendação:** Integrar com Sentry ou similares

### **5. Tokens de Recuperação de Senha Não Expiram**
**Risco:** Médio  
**Recomendação:** Adicionar campo `expiresAt` na tabela User

---

## 📋 Checklist de Segurança

### **Antes de Deploy:**

- [ ] Trocar todas as senhas padrão
- [ ] Verificar que `.env` não está no Git
- [ ] Gerar `NEXTAUTH_SECRET` forte
- [ ] Habilitar HTTPS
- [ ] Configurar CORS adequadamente
- [ ] Implementar rate limiting
- [ ] Adicionar helmet.js
- [ ] Configurar CSP
- [ ] Testar todos os endpoints para SQL injection
- [ ] Validar uploads de arquivos
- [ ] Configurar logs sem dados sensíveis
- [ ] Atualizar todas as dependências
- [ ] Rodar `npm audit` e corrigir vulnerabilidades
- [ ] Testar recuperação de senha
- [ ] Verificar permissões de diretórios (uploads/)
- [ ] Configurar backup automático do banco

### **Manutenção Contínua:**

- [ ] Atualizar dependências mensalmente
- [ ] Revisar logs de segurança semanalmente
- [ ] Testar penetração trimestralmente
- [ ] Treinar equipe em boas práticas

---

## 🔗 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Última atualização:** Novembro 2025  
**Status:** Em revisão contínua
