# Installation and Running Guide

This guide provides step-by-step instructions for setting up and running the Tay Training application in development and production environments.

---

## System Requirements

### Minimum Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18.x or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| PostgreSQL | 12.x or higher | Database |
| Git | 2.x | Version control |
| RAM | 2GB | Development |
| Disk Space | 2GB | Installation + node_modules |

### Recommended Setup

```
OS: Windows 11 / macOS 12+ / Ubuntu 20.04 LTS
Node.js: 20.x LTS
npm: 10.x
PostgreSQL: 15.x
RAM: 4GB+
CPU: Dual-core or higher
```

### Check Your Versions

```bash
# Check Node.js version
node --version
# Expected: v18.0.0 or higher

# Check npm version
npm --version
# Expected: 9.0.0 or higher

# Check PostgreSQL version
psql --version
# Expected: PostgreSQL 12.0 or higher
```

---

## Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/Tay-training-prototype.git

# Navigate to project directory
cd Tay-training-prototype

# Navigate to frontend directory
cd taytraining-frontend-main
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install

# Or using bun (fast alternative)
bun install
```

**Installation Time:** 3-10 minutes depending on internet speed and system performance.

**What Gets Installed:**
- Next.js 14 framework with Pages Router
- React 18 and React DOM
- Prisma ORM v6.19.0 with @prisma/client
- Radix UI components (20+ packages for accessibility)
- Framer Motion 12.x for animations
- NextAuth.js v4 for authentication
- Zod 3.x for schema validation
- React Hook Form 7.x for form management
- Tailwind CSS 3.4+ with PostCSS
- TypeScript 5.5+ with ESLint
- Lucide React for 460+ icons
- date-fns for date utilities
- Additional utilities (bcryptjs, sonner, cmdk, etc.)

**Troubleshooting Installation:**

```bash
# If npm install fails, try clearing cache first
npm cache clean --force
npm install

# If you get permission errors on macOS/Linux
sudo npm install

# If specific package fails, install it separately
npm install @prisma/client@6.19.0

# Check for conflicts
npm ls
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root (`taytraining-frontend-main/`):

```bash
# Copy the example env file
cp .env.example .env

# Or create .env manually
touch .env
```

Edit `.env` and add the following variables:

```dotenv
# PostgreSQL Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/taytraining"

# NextAuth Configuration (required for authentication)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: API Base URL (if using external API)
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Optional: Environment indicator
NODE_ENV="development"
```

#### Generating NEXTAUTH_SECRET

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use this online generator (NOT recommended for production)
# https://generate-secret.vercel.app/
```

#### Database URL Format

```
postgresql://[username]:[password]@[host]:[port]/[database_name]
```

**Example Values:**

```
PostgreSQL locally installed:
postgresql://postgres:password@localhost:5432/taytraining

Docker PostgreSQL:
postgresql://admin:secretpassword@postgres-container:5432/taydb

Cloud Database (e.g., Neon):
postgresql://user@project.neon.tech/database?sslmode=require
```

#### Environment Variables Reference

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| DATABASE_URL | Yes | `postgresql://...` | Database connection string |
| NEXTAUTH_SECRET | Yes | 64 hex chars | JWT encryption key |
| NEXTAUTH_URL | No | `http://localhost:3000` | App URL (auto-detected in dev) |
| NODE_ENV | No | `development` | Environment mode |
| NEXT_PUBLIC_API_URL | No | `http://localhost:3000` | Public API URL |

**Important:** Never commit `.env` to version control. It's included in `.gitignore`.

---

## Database Setup

### Step 1: Set Up PostgreSQL

#### On Windows

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run installer and follow setup wizard
3. Remember the password for `postgres` superuser
4. Default port is 5432

```bash
# Verify PostgreSQL is running
psql --version
```

#### On macOS

```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or using PostgreSQL.app
# Download from https://postgresapp.com/
```

#### On Linux (Ubuntu)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Using Docker

```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name postgres-tay \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=taytraining \
  -p 5432:5432 \
  -d postgres:15

# View logs
docker logs postgres-tay

# Stop container
docker stop postgres-tay
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE taytraining;

# Create user with password
CREATE USER tay WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE taytraining TO tay;

# Exit psql
\q
```

Or using command line:

```bash
# Create database directly
createdb -U postgres taytraining

# Create user
createuser -U postgres tay
```

### Step 3: Run Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or: Reset database and run migrations (CAUTION: deletes all data)
npx prisma migrate reset
```

**Migration Output Example:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL at "localhost:5432"

✅ Successfully created schema public
✅ Ran all pending migrations (3 migrations)

Migrations:
  20251118133629_init
  20251118_add_default_category
  20251118_make_categoryid_nullable
```

### Step 4: Seed the Database (Optional)

Populates the database with sample data for testing:

```bash
# Run seed script
npm run seed

# Or directly with Prisma
npx prisma db seed
```

**Seed Data Includes:**
- 2 test users (admin@example.com, test@example.com)
- Exercise categories (Upper Body, Lower Body, Full Body)
- Sample exercises (Bench Press, Squat, Deadlift, etc.)
- Training methods (5x5, Pyramid, Drop Sets, etc.)
- Example exercise groups and configurations

**Seed Credentials:**
```
User 1:
  Email: admin@example.com
  Password: password123

User 2:
  Email: test@example.com
  Password: password123
```

---

## Running the Application

### Development Server

Start the development server with hot reload:

```bash
# Start dev server
npm run dev

# Server runs on http://localhost:3000
# Auto-refreshes on code changes
```

**Output:**
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env
```

Then open your browser and navigate to: **http://localhost:3000**

**Features in Dev Mode:**
- ✅ Hot module replacement (HMR) - instant code updates
- ✅ Error overlay - shows compilation errors
- ✅ Fast Refresh - preserves component state
- ✅ Source maps - easier debugging

### Prisma Studio (Database GUI)

View and manage database records in a web interface:

```bash
# Open Prisma Studio
npx prisma studio

# Browser opens at http://localhost:5555
# Allows viewing/editing database records
```

---

## Building for Production

### Step 1: Build the Application

```bash
# Create optimized production build
npm run build

# Output: .next/ directory created
# Includes: code splitting, minification, optimization
```

**Build Output:**
```
  ▲ Next.js 14.0.0

  > Building application...
  ✓ Compiled successfully
  ✓ Linting and checking validity of types
  ✓ Collecting page data
  ✓ Generating static pages (5/5)
  ✓ Finalizing page optimization

Route (pages)                              Size
...

Build completed
```

### Step 2: Start Production Server

```bash
# Start production server
npm start

# Runs on http://localhost:3000 (optimized)
# Uses built .next/ directory
```

**Performance in Production:**
- ~60% smaller bundle size
- No source maps
- Optimized images
- Minified CSS/JS
- Static generation where possible

### Step 3: Environment Setup for Production

Update `.env.production`:

```dotenv
# Production Database (use dedicated DB)
DATABASE_URL="postgresql://prod_user:strong_password@prod-db.example.com:5432/taytraining"

# NextAuth (use strong secret)
NEXTAUTH_SECRET="long-random-secure-key-minimum-32-chars"
NEXTAUTH_URL="https://yourdomain.com"

# Environment
NODE_ENV="production"

# API Configuration
NEXT_PUBLIC_API_URL="https://yourdomain.com"
```

---

## Linting and Type Checking

### ESLint (Code Quality)

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npx eslint --fix .
```

### TypeScript (Type Checking)

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Build TypeScript without emitting
npx tsc --build
```

### Combined Check

```bash
# Recommended: Run before committing
npm run lint
npx tsc --noEmit
npm run build
```

---

## Common Errors and Fixes

### Error 1: "DATABASE_URL is not set"

**Symptoms:**
```
Error: DATABASE_URL is not set
```

**Cause:** Missing environment variable

**Fix:**
```bash
# Create or edit .env file
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/taytraining"' >> .env

# Verify
cat .env | grep DATABASE_URL
```

---

### Error 2: "Can't reach database server"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** PostgreSQL not running or incorrect connection string

**Fix:**

```bash
# Check if PostgreSQL is running
# Windows: Services app or
net start | find /i "postgres"

# macOS
brew services list | grep postgres

# Linux
sudo systemctl status postgresql

# Start PostgreSQL if stopped
# Windows
net start PostgreSQL15

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Verify connection
psql -U postgres -d taytraining

# Check connection string format
# Should be: postgresql://[user]:[password]@[host]:[port]/[database]
```

---

### Error 3: "Relation 'users' does not exist"

**Symptoms:**
```
Error: relation "users" does not exist
```

**Cause:** Migrations haven't been run

**Fix:**
```bash
# Run pending migrations
npx prisma migrate deploy

# Or reset and run (CAUTION: deletes data)
npx prisma migrate reset

# Verify migrations ran
npx prisma migrate status
```

---

### Error 4: "NEXTAUTH_SECRET is invalid"

**Symptoms:**
```
Error: NEXTAUTH_SECRET is invalid/not set
```

**Cause:** Missing or invalid authentication secret

**Fix:**
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
NEXTAUTH_SECRET="your-generated-secret-here"

# Restart server
# Press Ctrl+C and npm run dev
```

---

### Error 5: "Port 3000 is already in use"

**Symptoms:**
```
Error: listen EADDRINUSE :::3000
```

**Cause:** Another process using port 3000

**Fix:**

```bash
# Windows: Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux: Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

### Error 6: "Module not found '@prisma/client'"

**Symptoms:**
```
Error: Cannot find module '@prisma/client'
```

**Cause:** Prisma client not generated or dependencies not installed

**Fix:**
```bash
# Regenerate Prisma client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### Error 7: "TypeScript compilation error"

**Symptoms:**
```
error TS2307: Cannot find module '@/lib/api-client'
```

**Cause:** Path alias not configured or file missing

**Fix:**
```bash
# Check tsconfig.json paths
cat tsconfig.json | grep -A 5 "paths"

# Restart TypeScript server (in VS Code)
# Ctrl+Shift+P > Restart TS Server

# Or rebuild
rm -rf .next
npm run build
```

---

### Error 8: "Next.js build fails with OOM (Out of Memory)"

**Symptoms:**
```
JavaScript heap out of memory
```

**Cause:** Insufficient memory for build

**Fix:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm run build

# Or set permanently in .env
NODE_OPTIONS="--max_old_space_size=4096"

# Then run build
npm run build
```

---

### Error 9: "Prisma migration conflict"

**Symptoms:**
```
Error: Migration already exists
```

**Cause:** Migration applied manually before running migrate command

**Fix:**
```bash
# Check migration status
npx prisma migrate status

# Resolve conflict
npx prisma migrate resolve --applied "migration_name"

# Reset if safe (DELETES DATA)
npx prisma migrate reset
```

---

### Error 10: "CORS error when calling API"

**Symptoms:**
```
Access-Control-Allow-Origin error in console
```

**Cause:** Frontend and backend on different origins

**Fix:**
```bash
# API routes are on same origin, should work
# If using external API, update NEXT_PUBLIC_API_URL
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Restart server
```

---

## Development Workflow

### Recommended Daily Workflow

```bash
# 1. Start of day: Pull latest changes
git pull origin main

# 2. Install new dependencies if package.json changed
npm install

# 3. Run migrations if any new ones added
npx prisma migrate deploy

# 4. Start dev server
npm run dev

# 5. Before committing: Lint and typecheck
npm run lint
npx tsc --noEmit
```

### Before Committing Code

```bash
# 1. Run linter with fixes
npm run lint

# 2. Type check
npx tsc --noEmit

# 3. Test build
npm run build

# 4. Commit only if all pass
git add .
git commit -m "your message"
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Verify `.env.production` is configured correctly
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use separate production database
- [ ] Run `npm run build` successfully
- [ ] Test production build locally: `npm run build && npm start`
- [ ] Verify all migrations have been run: `npx prisma migrate deploy`
- [ ] Check database backups are configured
- [ ] Enable HTTPS on production domain
- [ ] Configure `NEXTAUTH_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Review security headers
- [ ] Configure database connection pooling (for scalability)
- [ ] Set up monitoring and error tracking
- [ ] Document any custom environment variables

---

## Performance Optimization Tips

### Development
```bash
# Use Bun for faster package installation (if available)
bun install

# Use npm ci in CI/CD for faster, more reliable installs
npm ci
```

### Building
```bash
# Analyze bundle size
npm run build -- --analyze
# Review .next/static/ directory

# Enable SWC minification (automatic in Next.js 14)
```

### Database
```bash
# Connect from same network for better latency
# Use connection pooling for production
# Add indexes to frequently queried fields
```

### Runtime
```bash
# Use production database (not localhost)
# Enable HTTP/2 in production server
# Configure CDN for static assets
# Enable compression
```

---

## Useful Commands Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma migrate deploy` | Run migrations |
| `npx prisma migrate reset` | Reset database (DELETES DATA) |
| `npx prisma studio` | Open database GUI |
| `npx prisma generate` | Generate Prisma client |
| `npm run seed` | Seed database with sample data |
| `npx tsc --noEmit` | Type check without building |

---

## Next Steps After Installation

1. **Create a user account** at http://localhost:3000
2. **Login** with your credentials
3. **Explore features:**
   - Navigate to Exercises page to view/create exercises
   - Go to Methods to manage training methods
   - Create workout sheets in Training Schedule
4. **Check database** using Prisma Studio: `npx prisma studio`
5. **Read other documentation** files for feature details

---

## Getting Help

### Documentation Files

- `PROJECT_OVERVIEW.md` - High-level system description
- `ARCHITECTURE_SUMMARY.md` - Technical architecture
- `TECH_STACK.md` - Technologies used
- `FEATURE_DOCUMENTATION.md` - Feature details
- `API_DOCUMENTATION.md` - API endpoint reference
- `COMPONENTS_DOCUMENTATION.md` - React components
- `HOOKS_DOCUMENTATION.md` - Custom hooks
- `DATABASE_SCHEMA.md` - Database schema

### Common Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **NextAuth.js:** https://next-auth.js.org

### Troubleshooting

1. Check error message carefully
2. Search documentation (Ctrl+F in files)
3. Review "Common Errors and Fixes" section above
4. Check browser console for client-side errors
5. Check server terminal for backend errors
6. Use `npx prisma studio` to inspect database state
