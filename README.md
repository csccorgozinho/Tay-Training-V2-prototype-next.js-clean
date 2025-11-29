# 🏋️ Tay Training

Sistema completo de gerenciamento de treinos e exercícios, desenvolvido com Next.js, React e PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)

---

## 📋 Sobre o Projeto

**Tay Training** é uma aplicação web moderna para gerenciamento de fichas de treino, exercícios e métodos de treinamento. Ideal para personal trainers, academias e praticantes de musculação que desejam organizar e acompanhar seus treinos de forma profissional.

### ✨ Principais Funcionalidades

- 🏋️ **Gerenciamento de Exercícios** - Cadastro completo com categorias, descrições e imagens
- 📋 **Fichas de Treino** - Crie e organize fichas personalizadas com exercícios, séries e repetições
- 🎯 **Métodos de Treinamento** - Drop set, Bi-set, Tri-set, Pirâmide e muito mais
- 📅 **Cronograma Semanal** - Organize treinos por dia da semana
- 📊 **Dashboard Intuitivo** - Visualize estatísticas e acesse funcionalidades rapidamente
- 🔒 **Autenticação Segura** - Login com NextAuth e senhas criptografadas
- 📱 **Design Responsivo** - Interface adaptada para desktop e mobile
- 🎨 **Tema Moderno** - UI elegante com Tailwind CSS e Shadcn/ui

---

## 🚀 Começando

### **Pré-requisitos:**

- Node.js 18+ e npm
- PostgreSQL 14+
- Git

### **Instalação Rápida:**

```bash
# 1. Clone o repositório
git clone <url-do-repositório>
cd taytraining-frontend-main

# 2. Instale as dependências
npm install

# 3. Configure o banco de dados
# Copie o arquivo .env.example para .env
cp .env.example .env

# Edite o .env com suas credenciais do PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/taytraining"

# 4. Execute as migrations
npx prisma migrate dev

# 5. Popule o banco com dados iniciais
npx prisma db seed

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

**Login padrão:**
- Email: `admin@example.com`
- Senha: `admin123`

---

## 📚 Documentação Completa

Toda a documentação está disponível na pasta `documentation/`:

- 📖 [**Visão Geral**](documentation/visao-geral.md) - Introdução e stack tecnológica
- 🏗️ [**Arquitetura**](documentation/arquitetura.md) - Estrutura e fluxo de dados
- 🔧 [**Instalação e Execução**](documentation/instalacao-e-execucao.md) - Guia completo de setup
- 🌐 [**Guia da API**](documentation/guia-da-api.md) - Referência de todos os endpoints
- ⚛️ [**Guia do Frontend**](documentation/guia-do-frontend.md) - Componentes e estrutura
- 🔒 [**Segurança**](documentation/seguranca.md) - Vulnerabilidades e hardening
- 📐 [**Padrões de Código**](documentation/padroes-de-codigo.md) - Convenções e boas práticas
- 🚀 [**Melhorias do Projeto**](documentation/melhoria-do-projeto.md) - Roadmap e sugestões
- 🧪 [**Testes**](documentation/testes.md) - Guia de testes com exemplos

---

## 🛠️ Stack Tecnológica

### **Frontend:**
- **Next.js 14** - Framework React com SSR e API Routes
- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **Shadcn/ui** - Componentes acessíveis e customizáveis
- **Framer Motion** - Animações fluidas
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### **Backend:**
- **Next.js API Routes** - Backend serverless
- **Prisma** - ORM moderno para PostgreSQL
- **NextAuth** - Autenticação completa
- **bcryptjs** - Criptografia de senhas

### **Banco de Dados:**
- **PostgreSQL** - Banco relacional robusto

---

## 📂 Estrutura do Projeto

```
taytraining-frontend-main/
├── documentation/           # Documentação completa
├── pages/                   # Páginas e API routes
│   ├── api/                # Endpoints da API
│   │   ├── auth/          # Autenticação
│   │   ├── db/            # CRUD de recursos
│   │   └── ...
│   ├── index.tsx          # Página inicial (redireciona para login)
│   ├── login.tsx          # Página de login
│   ├── home.tsx           # Dashboard principal
│   ├── exercises.tsx      # Gerenciamento de exercícios
│   ├── methods.tsx        # Métodos de treinamento
│   └── workout-sheets.tsx # Fichas de treino
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   ├── seed.ts            # Dados iniciais
│   └── migrations/        # Histórico de migrações
├── src/
│   ├── components/        # Componentes React
│   │   ├── auth/         # Login e autenticação
│   │   ├── dialogs/      # Modais e diálogos
│   │   ├── layout/       # Header, Footer, Layout
│   │   └── ui/           # Componentes base (shadcn/ui)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilitários e configurações
│   ├── pages/            # Componentes de páginas
│   └── types/            # Tipos TypeScript
└── public/               # Arquivos estáticos
```

---

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (porta 3000)

# Build
npm run build            # Gera build de produção
npm start                # Inicia servidor de produção

# Banco de Dados
npx prisma studio        # Abre interface visual do banco
npx prisma migrate dev   # Cria nova migration
npx prisma db seed       # Popula banco com dados iniciais
npx prisma generate      # Gera Prisma Client

# Linting
npm run lint             # Verifica erros de código
```

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/taytraining"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu_secret_aqui_minimo_32_caracteres"

# Opcional
NODE_ENV="development"
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### **Diretrizes:**

- Siga os [padrões de código](documentation/padroes-de-codigo.md)
- Escreva testes para novas funcionalidades
- Documente mudanças significativas
- Mantenha commits atômicos e descritivos

---

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](../../issues) com:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Informações do ambiente (SO, versão do Node, etc.)

---

## 📈 Roadmap

### **Em Desenvolvimento:**
- [ ] Testes automatizados (Jest + React Testing Library)
- [ ] Dashboard com gráficos de progresso
- [ ] Sistema de notificações
- [ ] Exportação de fichas em PDF


Veja o [roadmap completo](documentation/melhoria-do-projeto.md).

---

## 🔒 Segurança


Consulte nosso [guia de segurança](documentation/seguranca.md) para mais informações.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Desenvolvedor Principal** - [Caio Silva](https://github.com/seu-usuario)

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework React incrível
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes de UI belíssimos
- [Prisma](https://www.prisma.io/) - ORM moderno e type-safe
- [Vercel](https://vercel.com/) - Hospedagem e deploy simplificados

---


## 🌟 Mostre seu apoio

Se este projeto foi útil, considere dar uma ⭐ no GitHub!

---
