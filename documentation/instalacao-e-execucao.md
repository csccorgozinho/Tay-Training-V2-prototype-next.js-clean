# Instalação e Execução do Projeto

## 📋 Requisitos de Sistema

### **Software Necessário:**

| Ferramenta | Versão Mínima | Recomendada | Propósito |
|------------|---------------|-------------|-----------|
| **Node.js** | 18.x | 20.x LTS | Runtime JavaScript |
| **npm** | 9.x | 10.x | Gerenciador de pacotes |
| **PostgreSQL** | 14.x | 16.x | Banco de dados |
| **Git** | 2.30+ | Latest | Controle de versão |

### **Sistema Operacional:**
- ✅ Windows 10/11
- ✅ macOS 12+ (Monterey ou superior)
- ✅ Linux (Ubuntu 20.04+, Fedora, Debian)

### **Hardware Recomendado:**
- **CPU:** 2+ cores (4 cores recomendado)
- **RAM:** 4GB mínimo (8GB recomendado)
- **Disco:** 2GB livres para projeto + dependências
- **Internet:** Necessária para instalação de pacotes

---

## 🚀 Instalação Passo a Passo

### **1. Clonar o Repositório**

```bash
# Clone o projeto
git clone <repository-url>
cd taytraining-frontend-main

# Verifique se está na branch correta
git branch
```

---

### **2. Instalar Dependências**

```bash
# Instalar todas as dependências do projeto
npm install

# Ou usando Yarn (se preferir)
yarn install

# Ou usando pnpm
pnpm install
```

**Tempo estimado:** 2-5 minutos (depende da velocidade da internet)

**Verificação de sucesso:**
```bash
# Deve exibir lista de pacotes instalados
npm list --depth=0
```

---

### **3. Configurar Banco de Dados PostgreSQL**

#### **Opção A: Instalação Local (Windows)**

1. **Download do PostgreSQL:**
   - Acesse: https://www.postgresql.org/download/windows/
   - Baixe o instalador para Windows
   - Execute o instalador

2. **Configuração durante instalação:**
   - Porta padrão: `5432`
   - Senha do superusuário (postgres): Escolha uma senha forte
   - Instale o pgAdmin 4 (opcional, mas recomendado)

3. **Criar o banco de dados:**

```sql
-- Abra pgAdmin ou psql no terminal
CREATE DATABASE tay_training;
```

#### **Opção B: Instalação Local (macOS)**

```bash
# Usando Homebrew
brew install postgresql@16
brew services start postgresql@16

# Criar banco de dados
createdb tay_training
```

#### **Opção C: Instalação Local (Linux)**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Criar banco de dados
sudo -u postgres createdb tay_training
```

#### **Opção D: Usar Banco de Dados em Nuvem (Recomendado para Desenvolvimento)**

**Supabase (Grátis):**
1. Acesse: https://supabase.com
2. Crie uma conta
3. Crie um novo projeto
4. Copie a connection string fornecida

**Railway (Grátis com limites):**
1. Acesse: https://railway.app
2. Crie um projeto PostgreSQL
3. Copie a connection string

**Neon (Serverless PostgreSQL):**
1. Acesse: https://neon.tech
2. Crie um banco PostgreSQL
3. Copie a connection string

---

### **4. Configurar Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

**Edite o arquivo `.env` com suas credenciais:**

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/tay_training"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aleatoria-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Optional: File Upload
UPLOAD_DIR="./public/uploads"
```

**⚠️ IMPORTANTE:**

- **DATABASE_URL:** Substitua `usuario`, `senha`, `localhost`, `5432`, e `tay_training` pelos seus valores reais
- **NEXTAUTH_SECRET:** Gere uma string aleatória segura (pode usar: https://generate-secret.vercel.app)

**Exemplo de DATABASE_URL para cada cenário:**

```env
# Local (Windows)
DATABASE_URL="postgresql://postgres:suaSenha@localhost:5432/tay_training"

# Supabase
DATABASE_URL="postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres"

# Railway
DATABASE_URL="postgresql://postgres:senha@containers-us-west-123.railway.app:5432/railway"

# Neon
DATABASE_URL="postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb"
```

---

### **5. Executar Migrações do Banco de Dados**

```bash
# Criar tabelas no banco de dados
npx prisma migrate dev

# Você verá mensagens como:
# ✓ Generated Prisma Client
# ✓ The migration has been applied
```

**Se houver erros:**

```bash
# Resetar o banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Aplicar migrações novamente
npx prisma migrate dev
```

---

### **6. Popular Banco com Dados Iniciais (Seed)**

```bash
# Rodar script de seed
npm run seed

# Ou diretamente
npx prisma db seed
```

**O seed cria:**
- ✅ Usuário administrador padrão
- ✅ Categoria padrão
- ✅ Alguns exercícios de exemplo
- ✅ Métodos de treino básicos

**Credenciais padrão criadas:**
```
Email: admin@example.com
Senha: admin123
```

---

### **7. Verificar Configuração do Prisma**

```bash
# Abrir Prisma Studio (GUI para visualizar dados)
npx prisma studio
```

Isso abrirá uma interface web em `http://localhost:5555` onde você pode:
- ✅ Ver todas as tabelas
- ✅ Adicionar/editar registros manualmente
- ✅ Executar queries visuais

---

## ▶️ Executando o Projeto

### **Modo Desenvolvimento (Dev)**

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

**Resultado esperado:**

```
> taytraining-frontend-main@0.0.0 dev
> next dev

   ▲ Next.js 14.0.0
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.100:3000

 ✓ Ready in 2.5s
```

**Acesse no navegador:**
- http://localhost:3000

**Características do modo Dev:**
- ✅ Hot reload automático
- ✅ Source maps para debug
- ✅ Mensagens de erro detalhadas
- ✅ Fast refresh (React)

---

### **Modo Produção (Build + Start)**

```bash
# 1. Compilar o projeto
npm run build

# 2. Iniciar servidor de produção
npm run start
```

**Tempo de build:** 30s - 2min (dependendo do hardware)

**Resultado esperado:**

```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (15/15)
✓ Finalizing page optimization

Route (pages)                              Size     First Load JS
┌ ○ /                                     5.2 kB          87 kB
├ ○ /404                                  3.1 kB          85 kB
├ ○ /exercises                            12 kB           95 kB
├ ○ /home                                 8.5 kB          91 kB
└ ○ /login                                6.3 kB          88 kB
```

---

## 🔍 Verificação de Instalação

### **Checklist de Validação:**

```bash
# 1. Verificar Node.js
node --version
# Esperado: v18.x.x ou superior

# 2. Verificar npm
npm --version
# Esperado: 9.x.x ou superior

# 3. Verificar PostgreSQL
psql --version
# Esperado: psql (PostgreSQL) 14.x ou superior

# 4. Testar conexão com banco
npx prisma db pull
# Esperado: "Introspection completed successfully"

# 5. Verificar build
npm run build
# Esperado: "Compiled successfully"
```

---

## 🐛 Erros Comuns e Soluções

### **Erro 1: "Cannot find module 'next'"**

**Causa:** Dependências não instaladas

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

### **Erro 2: "Error: P1001 - Can't reach database server"**

**Causa:** PostgreSQL não está rodando ou credenciais incorretas

**Soluções:**

```bash
# Windows - Verificar serviço PostgreSQL
services.msc
# Procure "postgresql" e inicie o serviço

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
sudo systemctl status postgresql

# Testar conexão manualmente
psql -U postgres -h localhost -p 5432
```

---

### **Erro 3: "prisma migrate dev failed"**

**Causa:** Conflito de migrações ou banco corrompido

**Solução:**
```bash
# Resetar completamente (apaga dados)
npx prisma migrate reset

# Ou criar nova migração
npx prisma migrate dev --name init
```

---

### **Erro 4: "Port 3000 is already in use"**

**Causa:** Outra aplicação usando a porta 3000

**Soluções:**

```bash
# Opção 1: Matar processo na porta
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Opção 2: Usar outra porta
PORT=3001 npm run dev
```

---

### **Erro 5: "NEXTAUTH_SECRET is missing"**

**Causa:** Variável de ambiente não configurada

**Solução:**
```bash
# Gerar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Adicionar ao .env
NEXTAUTH_SECRET=<output_do_comando_acima>
```

---

### **Erro 6: "Module not found: Can't resolve '@/components/...'"**

**Causa:** Path aliases não reconhecidos

**Solução:**
```bash
# Verificar tsconfig.json
cat tsconfig.json | grep paths

# Deve conter:
# "paths": {
#   "@/*": ["./src/*"]
# }

# Reiniciar TypeScript server no VSCode
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### **Erro 7: "Failed to load next.config.js"**

**Causa:** Sintaxe incorreta no next.config.js

**Solução:**
```bash
# Verificar sintaxe
node -c next.config.js

# Se houver erro, compare com next.config.js.backup ou repositório original
```

---

### **Erro 8: "Prisma Client not generated"**

**Causa:** Prisma Client precisa ser regenerado

**Solução:**
```bash
npx prisma generate
```

---

## 🛠️ Comandos Úteis de Desenvolvimento

### **Banco de Dados:**

```bash
# Visualizar banco de dados
npx prisma studio

# Resetar banco (CUIDADO: apaga tudo)
npx prisma migrate reset

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

# Formatar schema.prisma
npx prisma format
```

### **Desenvolvimento:**

```bash
# Modo dev com debug
DEBUG=* npm run dev

# Limpar cache do Next.js
rm -rf .next

# Checar tipos TypeScript
npx tsc --noEmit

# Rodar linter
npm run lint

# Fixar problemas de lint automaticamente
npm run lint -- --fix
```

### **Build e Deploy:**

```bash
# Build otimizado
npm run build

# Analisar tamanho do bundle
ANALYZE=true npm run build

# Rodar servidor de produção
npm run start

# Build + Start em um comando
npm run build && npm run start
```

---

## 🌐 Acesso Local em Rede

Para acessar o projeto de outros dispositivos na mesma rede:

```bash
# 1. Descobrir seu IP local
# Windows
ipconfig

# macOS/Linux
ifconfig

# 2. Iniciar servidor expondo na rede
npm run dev -- -H 0.0.0.0

# 3. Acessar de outro dispositivo
# http://<SEU_IP>:3000
# Exemplo: http://192.168.1.100:3000
```

---

## 📱 Testando em Dispositivos Móveis

```bash
# Instalar Ngrok (opcional - para acesso externo)
npm install -g ngrok

# Criar tunnel
ngrok http 3000

# Acessar URL fornecida em qualquer dispositivo
# https://abc123.ngrok.io
```

---

## 🔐 Primeiro Acesso

1. Abra o navegador em `http://localhost:3000`
2. Você será redirecionado para `/login`
3. Use as credenciais padrão:
   - **Email:** `admin@example.com`
   - **Senha:** `admin123`
4. Após login, será redirecionado para `/home`

**⚠️ IMPORTANTE:** Altere a senha padrão imediatamente em produção!

---

## 📊 Monitoramento de Logs

### **Logs do Servidor:**

```bash
# Logs detalhados no terminal
npm run dev

# Logs salvos em arquivo
npm run dev > logs/dev.log 2>&1
```

### **Logs do Banco:**

```bash
# Habilitar query logging no Prisma
# Adicione ao schema.prisma:
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

---

## 🧪 Ambiente de Teste

Para criar ambiente de teste separado:

```bash
# Criar banco de teste
createdb tay_training_test

# Criar .env.test
echo 'DATABASE_URL="postgresql://postgres:senha@localhost:5432/tay_training_test"' > .env.test

# Rodar migrações no banco de teste
dotenv -e .env.test npx prisma migrate dev
```

---

## 🚀 Próximos Passos

Após instalação bem-sucedida:

1. ✅ Explorar a aplicação navegando pelas páginas
2. ✅ Criar novos exercícios em `/exercises`
3. ✅ Criar métodos de treino em `/methods`
4. ✅ Montar uma ficha completa em `/workout-sheets`
5. ✅ Agendar treinos em `/training-schedule`
6. ✅ Ler documentação da API em `documentation/guia-da-api.md`

---

## 📞 Suporte

Se encontrar problemas não listados aqui:

1. Verifique logs do servidor e console do navegador
2. Consulte documentação oficial:
   - Next.js: https://nextjs.org/docs
   - Prisma: https://www.prisma.io/docs
   - PostgreSQL: https://www.postgresql.org/docs/
3. Revise o arquivo `.env` e credenciais do banco
4. Abra uma issue no repositório do projeto

---

**Última atualização:** Novembro 2025  
**Testado em:** Windows 11, macOS Sonoma, Ubuntu 22.04
