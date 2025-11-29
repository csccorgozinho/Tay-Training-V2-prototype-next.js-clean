# Visão Geral do Projeto

## 📋 Descrição

**Tay Training** é uma aplicação web moderna para gestão completa de treinos físicos, permitindo que personal trainers e academias organizem exercícios, criem fichas de treino personalizadas, gerenciem métodos de treinamento e acompanhem o progresso dos alunos.

O sistema oferece uma interface intuitiva e responsiva para criação e gerenciamento de programas de treinamento, com suporte a múltiplos exercícios, configurações avançadas de séries/repetições, categorização de grupos musculares e geração automática de PDFs para impressão.

---

## 🎯 Objetivo

O projeto foi desenvolvido com os seguintes objetivos principais:

1. **Centralizar a gestão de treinos**: Substituir planilhas e anotações manuais por um sistema integrado e eficiente
2. **Facilitar a criação de fichas**: Permitir a montagem rápida de programas de treinamento através de interface drag-and-drop e wizards
3. **Organizar biblioteca de exercícios**: Manter um catálogo estruturado com vídeos, descrições e métodos associados
4. **Gerar documentação profissional**: Criar PDFs automaticamente formatados para entrega aos alunos
5. **Acompanhar evolução**: Preparar infraestrutura para futura integração com app mobile de rastreamento

---

## 🔧 Problema que Resolve

### Desafios Atuais de Personal Trainers e Academias:

**1. Desorganização**
- Exercícios dispersos em múltiplos documentos
- Dificuldade em reutilizar fichas anteriores
- Falta de padronização nos treinos

**2. Ineficiência Operacional**
- Tempo excessivo criando fichas manualmente
- Redigitação de exercícios repetidos
- Dificuldade em versionar e atualizar treinos

**3. Falta de Profissionalismo**
- Fichas manuscritas ou mal formatadas
- Ausência de material visual (vídeos/imagens)
- Inconsistência na entrega de materiais

**4. Escalabilidade Limitada**
- Impossível gerenciar muitos alunos simultaneamente
- Sem histórico centralizado de treinos anteriores
- Ausência de métricas e acompanhamento

### Como o Tay Training Resolve:

✅ **Biblioteca centralizada** de exercícios com vídeos e descrições  
✅ **Templates reutilizáveis** de fichas e métodos de treino  
✅ **Geração automática de PDFs** profissionais e padronizados  
✅ **Interface visual moderna** com drag-and-drop e wizards intuitivos  
✅ **Organização por categorias** e grupos musculares  
✅ **Histórico completo** de todas as fichas criadas  
✅ **Preparado para evolução** com app mobile de acompanhamento

---

## 💻 Tecnologias Utilizadas

### **Frontend**
- **Next.js 14** - Framework React com SSR e API Routes
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript 5** - Tipagem estática e segurança de código
- **Tailwind CSS 3** - Framework CSS utilitário
- **Framer Motion 12** - Animações e transições fluidas
- **Radix UI** - Componentes acessíveis e headless
- **Shadcn/ui** - Sistema de componentes baseado em Radix
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas e tipos

### **Backend**
- **Next.js API Routes** - Serverless functions integradas
- **Prisma 6** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados relacional
- **NextAuth 4** - Autenticação e gerenciamento de sessões
- **bcryptjs** - Criptografia de senhas

### **Gerenciamento de Estado**
- **Zustand** - State management leve e performático
- **TanStack Query** - Cache e sincronização de dados assíncronos

### **Utilitários**
- **date-fns** - Manipulação de datas
- **clsx** - Composição condicional de classes CSS
- **lucide-react** - Biblioteca de ícones moderna
- **formidable** - Upload e processamento de arquivos

### **Desenvolvimento**
- **ESLint** - Linting e padronização de código
- **PostCSS** - Processamento de CSS
- **ts-node** - Execução de scripts TypeScript

---

## 👥 Público-Alvo

### **Primário:**

**1. Personal Trainers Autônomos**
- Profissionais que atendem múltiplos alunos
- Necessidade de organizar e versionar treinos
- Busca por profissionalização na entrega de materiais

**2. Academias e Estúdios**
- Padronização de treinos entre diferentes professores
- Gestão centralizada de programas de treinamento
- Biblioteca compartilhada de exercícios

**3. Preparadores Físicos**
- Periodização de treinos para atletas
- Controle de volume e intensidade
- Documentação profissional para acompanhamento

### **Secundário:**

**4. Atletas e Praticantes Avançados**
- Organização pessoal de rotinas de treino
- Histórico de evoluções e periodizações
- Referência visual com vídeos dos exercícios

**5. Nutricionistas e Fisioterapeutas**
- Prescrição de exercícios complementares
- Acompanhamento integrado com planos alimentares
- Gestão de programas de reabilitação

---

## 🎨 Características Principais

### **Interface do Usuário**
- Design moderno e minimalista com tema rosa personalizado
- Responsivo para desktop, tablet e mobile
- Animações suaves e microinterações
- Modo claro otimizado para legibilidade
- Navegação intuitiva com sidebar e navbar

### **Gestão de Exercícios**
- Catálogo completo com nome, descrição e vídeo
- Filtros por categoria e grupo muscular
- Marcação de exercícios com/sem método
- Edição inline e em diálogos modais
- Busca instantânea

### **Criação de Fichas**
- Wizard passo a passo com 4 etapas
- Seleção visual de grupos de exercícios
- Configuração avançada de séries, repetições e métodos
- Preview em tempo real
- Geração automática de PDF

### **Métodos de Treinamento**
- Biblioteca de técnicas (Drop Set, Bi-Set, Rest-Pause, etc.)
- Associação de métodos a exercícios específicos
- Descrições detalhadas de cada técnica
- CRUD completo

### **Agendamento**
- Calendário visual de treinos
- Atribuição de fichas a dias específicos
- Nomes curtos para identificação rápida
- Visualização semanal e mensal

---

## 🔮 Evolução Futura

O projeto está preparado para expansões, incluindo:

- **App Mobile Nativo** - Aplicativo para alunos acompanharem treinos
- **Rastreamento de Atividades** - Registro de cargas, repetições e progressões
- **Dashboard de Métricas** - Análise de volume, frequência e evolução
- **Integração com Nutrição** - Planos alimentares sincronizados
- **Sistema de Mensagens** - Comunicação trainer-aluno integrada
- **Marketplace de Treinos** - Compartilhamento e venda de programas
- **IA para Sugestões** - Recomendações automáticas baseadas em objetivos

---

## 📦 Status do Projeto

**Versão Atual:** 0.0.0 (Protótipo)  
**Fase:** MVP em desenvolvimento  
**Ambiente:** Desenvolvimento local  
**Deploy:** Não realizado (preparado para Vercel)

### Funcionalidades Implementadas:
✅ Autenticação e gestão de usuários  
✅ CRUD completo de exercícios  
✅ CRUD completo de métodos  
✅ Criação e edição de grupos de exercícios  
✅ Wizard de criação de fichas  
✅ Agendamento de treinos  
✅ Geração de PDFs  
✅ Interface responsiva completa  

### Em Desenvolvimento:
🔄 App mobile de acompanhamento  
🔄 Dashboard de métricas  
🔄 Sistema de notificações  

---

## 📄 Licença

Este projeto é privado e proprietário. Todos os direitos reservados.

---

## 📞 Contato

Para mais informações sobre o projeto, entre em contato através do repositório oficial.

---

**Última atualização:** Novembro 2025  
**Mantido por:** Equipe Tay Training
