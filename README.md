# Tay Training Prototype

A modern full-stack web application for managing exercise training, workout schedules, and fitness tracking.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-18.x%2B-green)

## 🚀 Features

- **📋 Exercise Management** - Create, organize, and categorize exercises with customizable parameters
- **🎯 Training Methods** - Define and manage training methodologies with standardized protocols
- **📅 Training Schedules** - Multi-week schedule planning with drag-and-drop interface
- **📊 Workout Sheets** - Detailed workout templates with advanced filtering and grouping
- **👤 User Profiles** - Manage user accounts, preferences, and training history
- **🔐 Authentication** - Secure credential-based login and session management with NextAuth.js v4
- **🎨 Modern UI** - Component-driven interface with Radix UI primitives and Tailwind CSS
- **💾 Data Persistence** - PostgreSQL with Prisma ORM for reliable data management
- **📱 Responsive Design** - Fully responsive mobile-first interface with adaptive navigation
- **⚡ Real-time Feedback** - Toast notifications, loading states, and activity tracking
- **🎬 Smooth Animations** - Framer Motion for engaging user interactions

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, PostCSS, Radix UI |
| **State Management** | Zustand, React Hooks |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL 12+, Prisma ORM 6.19.0 |
| **Authentication** | NextAuth.js v4 |
| **Animations** | Framer Motion 12.x |
| **Validation** | Zod 3.x with React Hook Form |
| **UI Primitives** | Radix UI 20+ components |
| **Icons** | Lucide React (460+ icons) |
| **Date Utilities** | date-fns 3.x |
| **Build Tool** | Next.js (Webpack) with TypeScript 5.5 |
| **Package Manager** | npm (or bun) |

## 📋 Prerequisites

### Required
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **PostgreSQL** 12.x or higher ([Download](https://www.postgresql.org/download/))
- **Git** 2.x or higher ([Download](https://git-scm.com/))

### Recommended
- **Node.js** 20.x LTS
- **PostgreSQL** 15.x or higher
- **RAM** 4GB+ for development
- **Disk Space** 2GB+

### Check Your Versions

```bash
# Check Node.js version
node --version
# Should output: v18.0.0 or higher

# Check npm version
npm --version
# Should output: 9.0.0 or higher

# Check PostgreSQL version
psql --version
# Should output: PostgreSQL 12.0 or higher
```

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tay-training-prototype.git
cd tay-training-prototype/taytraining-frontend-main
```

### 2. Install Dependencies

```bash
npm install
```

**Installation Time:** 3-10 minutes depending on internet speed

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or manually create `.env` with:

```dotenv
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/taytraining"

# Authentication (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

**Generate NEXTAUTH_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

```bash
# Create database
createdb taytraining

# Create user (optional but recommended)
createuser -P tay
```

#### Option B: Docker

```bash
# Run PostgreSQL container
docker run --name postgres-tay \
  -e POSTGRES_DB=taytraining \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  -d postgres:15
```

### 5. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed with sample data
npm run seed
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Sample Credentials** (if you ran seed):
- Email: `admin@example.com`
- Password: `password123`

---

## 📚 Available Scripts

```bash
# Development
npm run dev           # Start dev server with hot reload (port 3000)

# Building
npm run build         # Create production build
npm start             # Start production server

# Database
npx prisma migrate deploy    # Run pending migrations
npx prisma migrate reset     # Reset database (CAUTION: deletes data)
npx prisma studio           # Open database GUI (port 5555)
npm run seed                # Seed database with sample data

# Code Quality
npm run lint          # Run ESLint
npx tsc --noEmit      # TypeScript type checking

# Package Management
npm install           # Install dependencies
npm update            # Update all dependencies
npm prune             # Remove unused dependencies
```

---

## 📂 Project Structure

```
taytraining-frontend-main/
├── pages/                    # Next.js pages and API routes
│   ├── _app.tsx             # App wrapper
│   ├── index.tsx            # Home page
│   ├── login.tsx            # Login page
│   ├── exercises.tsx        # Exercise management
│   ├── methods.tsx          # Training methods
│   ├── training-schedule.tsx # Schedule management
│   ├── workout-sheets.tsx   # Workout details
│   ├── api/                 # API endpoints
│   │   ├── auth/           # Authentication endpoints
│   │   ├── categories/     # Category endpoints
│   │   ├── db/            # Database operations
│   │   ├── exercise-groups/
│   │   ├── training-sheets/
│   │   └── user/
│   └── ...
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components (Radix UI)
│   │   ├── dialogs/        # Modal dialogs
│   │   ├── layout/         # Layout components
│   │   ├── auth/           # Auth forms
│   │   └── profile/        # User profile components
│   ├── hooks/              # Custom React hooks
│   │   ├── use-loading.ts
│   │   ├── use-pagination.ts
│   │   ├── use-workout-sheets-filter.ts
│   │   └── ...
│   ├── lib/                # Utility functions
│   │   ├── api-client.ts   # API wrapper
│   │   ├── prisma.ts       # Prisma instance
│   │   ├── auth-config.ts  # NextAuth config
│   │   ├── activity-tracker.ts
│   │   └── ...
│   ├── types/              # TypeScript types
│   ├── config/             # Configuration
│   └── styles/             # Global styles
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed script
│   └── migrations/         # Database migrations
├── public/                 # Static files
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── tsconfig.json           # TypeScript config
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
├── package.json            # Dependencies
└── README.md              # This file
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost/db` | Database connection |
| `NEXTAUTH_SECRET` | Yes | 64 hex chars | JWT secret key |
| `NEXTAUTH_URL` | No | `http://localhost:3000` | App URL (auto-detected) |
| `NODE_ENV` | No | `development` | Environment mode |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3000` | API base URL |

### Database URL Format

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

**Examples:**

```
# Local development
postgresql://postgres:password@localhost:5432/taytraining

# Docker container
postgresql://admin:password123@postgres-container:5432/taytraining

# Cloud database (e.g., Railway, Neon)
postgresql://user@host.region.db.provider.com/dbname?sslmode=require
```

### TypeScript Configuration

The project uses TypeScript with the following settings:

```json
{
  "strict": false,
  "jsx": "preserve",
  "target": "es2017",
  "lib": ["es2017", "dom", "dom.iterable"],
  "paths": {
    "@/*": ["./src/*", "./pages/*", "./prisma/*"]
  }
}
```

**Note:** Strict mode is disabled for compatibility. Consider enabling it in your branch.

---

## 🗄️ Database Schema

### Main Entities

- **User** - User accounts and authentication
- **Exercise** - Individual exercises with metadata
- **ExerciseMethod** - Training methods (sets, reps, weight)
- **ExerciseGroup** - Groups of exercises by category
- **TrainingSheet** - Workout plans
- **Category** - Exercise categories
- **ActivityLog** - User activity tracking

See `prisma/schema.prisma` for detailed schema.

---

## 🚀 Deployment

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms

#### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t tay-training .
docker run -p 3000:3000 -e DATABASE_URL="..." tay-training
```

#### Railway, Render, Heroku

1. Push code to GitHub
2. Connect repository to platform
3. Set environment variables
4. Deploy

**Required environment variables for production:**
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<strong-random-key>
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### "DATABASE_URL is not set"

```bash
# Add to .env file
echo 'DATABASE_URL="postgresql://..."' >> .env

# Verify
cat .env | grep DATABASE_URL
```

### "Can't reach database server"

```bash
# Check PostgreSQL is running
psql -U postgres

# If not running:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Use Services app or net start PostgreSQL15

# Verify connection string is correct
# Format: postgresql://[user]:[password]@localhost:5432/[database]
```

### "relation 'users' does not exist"

```bash
# Run migrations
npx prisma migrate deploy

# Or reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

### "NEXTAUTH_SECRET is invalid"

```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
NEXTAUTH_SECRET="generated-secret-here"

# Restart server
```

### "Port 3000 is already in use"

```bash
# Find and kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### "Cannot find module '@prisma/client'"

```bash
# Regenerate Prisma client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

For more troubleshooting, see `INSTALLATION_AND_RUNNING_GUIDE.md`.

---

## 📖 Additional Documentation

This project includes comprehensive documentation:

- **`INSTALLATION_AND_RUNNING_GUIDE.md`** - Detailed setup instructions for all platforms
- **`PROJECT_OVERVIEW.md`** - Project scope and features
- **`ARCHITECTURE_SUMMARY.md`** - Technical architecture and design patterns
- **`LIMITATIONS_AND_KNOWN_ISSUES.md`** - Known limitations and technical debt
- **`FINAL_SUMMARY.md`** - Codebase assessment and recommendations
- **`CODE_INVESTIGATION_REPORT.md`** - Full code analysis
- **`DETAILED_ISSUES_REFERENCE.md`** - Issue reference guide

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Submit a pull request

### Code Quality

Before submitting a PR, ensure:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## 📊 Project Status

| Aspect | Status |
|--------|--------|
| **Build** | ✅ Passing |
| **Runtime** | ✅ No errors |
| **Features** | ✅ All implemented |
| **Database** | ✅ Configured |
| **Authentication** | ✅ Implemented |
| **Type Safety** | 🟡 Good (not strict) |
| **Tests** | ⚠️ None yet |

---

## 🔒 Security

### Important Security Notes

1. **Never commit `.env`** - File is in `.gitignore`
2. **Use strong secrets** - Generate `NEXTAUTH_SECRET` with crypto module
3. **Use HTTPS in production** - Set `NEXTAUTH_URL` to HTTPS domain
4. **Secure database** - Use strong passwords and network isolation
5. **Keep dependencies updated** - Run `npm audit fix` regularly

### Security Best Practices

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check specific dependency
npm show <package-name> version
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Support

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: See files in project root

---

## 🗂️ Related Files

Key documentation files to review:

```
root/
├── INSTALLATION_AND_RUNNING_GUIDE.md   # Setup for all platforms
├── PROJECT_OVERVIEW.md                 # Project scope
├── ARCHITECTURE_SUMMARY.md             # Technical details
├── LIMITATIONS_AND_KNOWN_ISSUES.md     # Known issues
├── FINAL_SUMMARY.md                    # Codebase assessment
└── CODE_INVESTIGATION_REPORT.md        # Full analysis
```

---

## 📞 Getting Help

1. **Check documentation** - Most issues are covered in guides
2. **Search issues** - Your problem might already be solved
3. **Check troubleshooting** - See section above
4. **Create detailed issue** - Include environment info and steps to reproduce

---

**Last Updated**: November 24, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Build Status**: ✅ Passing  
**Application Status**: ✅ Fully Functional

---

## Quick Reference

### Development Workflow

```bash
# 1. Clone and setup
git clone <repo>
cd taytraining-frontend-main
npm install

# 2. Create .env file
cp .env.example .env
# Edit DATABASE_URL and NEXTAUTH_SECRET

# 3. Setup database
npx prisma migrate deploy
npm run seed

# 4. Start development
npm run dev

# 5. Open browser
# http://localhost:3000
```

### Production Deployment

```bash
# 1. Build
npm run build

# 2. Test production build locally
npm start

# 3. Set production environment variables
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. Deploy to your platform
# (Vercel, Railway, Render, etc.)
```

### Useful Commands

```bash
npm run dev                    # Dev server
npm run build                  # Production build
npm start                      # Start production
npm run lint                   # Lint code
npx prisma studio            # Database GUI
npm run seed                   # Seed data
```

---

**Ready to get started?** Follow the [Quick Start](#-quick-start) section above!
