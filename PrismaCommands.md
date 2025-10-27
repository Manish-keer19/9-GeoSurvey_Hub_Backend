# Complete Prisma CLI Commands Reference

A comprehensive guide to all Prisma CLI commands with detailed explanations, real-world use cases, and code examples.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Initialization Commands](#initialization-commands)
3. [Schema Management](#schema-management)
4. [Migration Commands](#migration-commands)
5. [Prisma Client](#prisma-client)
6. [Database Commands](#database-commands)
7. [Prisma Studio](#prisma-studio)
8. [Utility Commands](#utility-commands)
9. [Advanced Commands](#advanced-commands)
10. [Environment & Configuration](#environment--configuration)

---

## Installation & Setup

### Install Prisma CLI

```bash
# Install as dev dependency (recommended)
npm install prisma --save-dev

# Install globally
npm install -g prisma

# Using Yarn
yarn add prisma --dev

# Using pnpm
pnpm add -D prisma
```

### Check Prisma Version

```bash
prisma --version
# or
npx prisma --version
```

**Use Case:** Verify installed Prisma version and ensure compatibility with your project.

---

## Initialization Commands

### `prisma init`

Initialize a new Prisma project with default configuration.

```bash
# Basic initialization
prisma init

# Specify database provider
prisma init --datasource-provider postgresql
prisma init --datasource-provider mysql
prisma init --datasource-provider sqlite
prisma init --datasource-provider sqlserver
prisma init --datasource-provider mongodb
prisma init --datasource-provider cockroachdb
```

**What it creates:**
- `prisma/schema.prisma` - Main Prisma schema file
- `.env` - Environment variables file with `DATABASE_URL`

**Example Output Structure:**

```
project/
├── prisma/
│   └── schema.prisma
└── .env
```

**Generated schema.prisma:**

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Generated .env:**

```env
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
```

**Real-World Use Cases:**
- Starting a new project with Prisma
- Adding Prisma to an existing Node.js/TypeScript project
- Setting up database connection for different environments

---

## Schema Management

### `prisma format`

Format the Prisma schema file according to Prisma's style guidelines.

```bash
prisma format

# Specify custom schema path
prisma format --schema=./custom/path/schema.prisma
```

**Use Case:** Automatically format your schema file with consistent indentation, spacing, and ordering. Run before committing code.

**Before formatting:**

```prisma
model User{
id Int @id @default(autoincrement())
email String @unique
  name String?
posts Post[]
}
```

**After formatting:**

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}
```

---

### `prisma validate`

Validate the Prisma schema for syntax errors and logical issues.

```bash
prisma validate

# With custom schema path
prisma validate --schema=./prisma/schema.prisma
```

**Use Case:** 
- Run in CI/CD pipelines to catch schema errors
- Validate before running migrations
- Check for breaking changes

**Example validation errors:**

```bash
# Missing @id attribute
Error: Field `id` is not marked as @id

# Invalid relation
Error: The relation field `author` on Model `Post` is missing an opposite relation field
```

---

### `prisma db push`

Push schema changes directly to the database without creating migration files. **Ideal for rapid prototyping.**

```bash
# Push schema to database
prisma db push

# Skip generating Prisma Client
prisma db push --skip-generate

# Accept data loss warnings automatically
prisma db push --accept-data-loss

# Force reset (drop and recreate)
prisma db push --force-reset
```

**Schema Example:**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
```

```bash
# Push this schema
prisma db push
```

**Real-World Use Cases:**
- **Local development:** Quick iterations without migration history
- **Prototyping:** Testing schema designs rapidly
- **Seeding environments:** Setting up test databases
- **Schema syncing:** When migration files aren't needed

**⚠️ Warning:** Does not create migration history. Use `prisma migrate dev` for production workflows.

---

### `prisma db pull` (formerly introspect)

Introspect an existing database and generate a Prisma schema from it.

```bash
# Pull schema from database
prisma db pull

# Force overwrite existing schema
prisma db pull --force

# Print schema without writing to file
prisma db pull --print
```

**Use Case:** 
- Adding Prisma to existing projects with databases
- Reverse-engineering legacy databases
- Syncing schema after manual database changes

**Example - Existing Database:**

```sql
-- Existing PostgreSQL database
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  author_id INTEGER REFERENCES users(id)
);
```

**After `prisma db pull`:**

```prisma
model users {
  id         Int       @id @default(autoincrement())
  email      String    @unique @db.VarChar(255)
  name       String?   @db.VarChar(255)
  created_at DateTime? @default(now()) @db.Timestamp(6)
  posts      posts[]
}

model posts {
  id         Int      @id @default(autoincrement())
  title      String   @db.VarChar(255)
  content    String?
  published  Boolean? @default(false)
  author_id  Int?
  users      users?   @relation(fields: [author_id], references: [id])
}
```

---

## Migration Commands

### `prisma migrate dev`

Create and apply migrations in development. This is the **primary command for local development.**

```bash
# Create and apply migration
prisma migrate dev

# Name the migration
prisma migrate dev --name add_user_role

# Create migration without applying
prisma migrate dev --create-only

# Skip seeding
prisma migrate dev --skip-seed

# Skip generating Prisma Client
prisma migrate dev --skip-generate
```

**Workflow:**

```prisma
// 1. Update schema
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  role  String  @default("USER") // New field
}
```

```bash
# 2. Run migrate dev
prisma migrate dev --name add_user_role
```

**Creates migration file:**

```
prisma/migrations/
└── 20250127120000_add_user_role/
    └── migration.sql
```

**migration.sql:**

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
```

**What `migrate dev` does:**
1. Creates migration file in `prisma/migrations/`
2. Applies migration to database
3. Generates Prisma Client
4. Runs seed script (if configured)

**Real-World Use Cases:**
- Daily development workflow
- Adding new models/fields
- Modifying existing schema
- Team collaboration with version-controlled migrations

---

### `prisma migrate deploy`

Apply pending migrations in production/staging environments.

```bash
# Deploy all pending migrations
prisma migrate deploy

# Preview without executing
prisma migrate deploy --preview
```

**Use Case:** 
- **CI/CD pipelines:** Automated deployments
- **Production releases:** Apply migrations safely
- **Staging environments:** Test migrations before production

**Example CI/CD workflow (.github/workflows/deploy.yml):**

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy application
        run: npm run deploy
```

**⚠️ Important:**
- Never run `migrate dev` in production
- Always use `migrate deploy` for non-development environments
- Test migrations in staging first

---

### `prisma migrate reset`

Reset the database and re-apply all migrations. **Destructive operation.**

```bash
# Reset database completely
prisma migrate reset

# Skip confirmation prompt
prisma migrate reset --force

# Skip seeding
prisma migrate reset --skip-seed

# Skip generating Prisma Client
prisma migrate reset --skip-generate
```

**What it does:**
1. Drops the database (or all tables)
2. Creates a fresh database
3. Applies all migrations from scratch
4. Runs seed script
5. Generates Prisma Client

**Use Case:**
- Resetting local development database
- Starting fresh with clean data
- Fixing corrupted migration history
- Testing full migration flow

**⚠️ Warning:** Deletes ALL data. Never use in production.

---

### `prisma migrate status`

Check the status of migrations (which are applied, which are pending).

```bash
# Check migration status
prisma migrate status
```

**Example Output:**

```
Database schema is up to date!

The following migrations are applied:

20250101120000_init
20250115093000_add_user_role
20250120140000_add_post_categories
```

**Or if migrations pending:**

```
Your database is not up to date!

The following migrations have not yet been applied:

20250127120000_add_comments

To apply migrations, run: prisma migrate deploy
```

**Use Case:**
- Verify migration state before deployment
- Debug migration issues
- Check if database is in sync with code

---

### `prisma migrate diff`

Compare two database schemas and generate a migration diff.

```bash
# Compare schema to database
prisma migrate diff \
  --from-schema-datamodel=./prisma/schema.prisma \
  --to-schema-datasource=./prisma/schema.prisma \
  --script

# Compare two databases
prisma migrate diff \
  --from-url="postgresql://user:pass@localhost:5432/db1" \
  --to-url="postgresql://user:pass@localhost:5432/db2" \
  --script

# Compare migration to database
prisma migrate diff \
  --from-migrations=./prisma/migrations \
  --to-schema-datasource=./prisma/schema.prisma \
  --script

# Output as JSON
prisma migrate diff \
  --from-schema-datamodel=./prisma/schema.prisma \
  --to-schema-datasource=./prisma/schema.prisma
```

**Use Case:**
- Detect schema drift between environments
- Preview changes before migration
- Compare production vs staging schemas
- Debug migration issues

**Example Output:**

```sql
-- CreateTable
CREATE TABLE "Comment" (
  "id" SERIAL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" 
  FOREIGN KEY ("postId") REFERENCES "Post"("id");
```

---

### `prisma migrate resolve`

Mark a migration as applied or rolled back without actually running it.

```bash
# Mark migration as applied
prisma migrate resolve --applied 20250127120000_migration_name

# Mark migration as rolled back
prisma migrate resolve --rolled-back 20250127120000_migration_name
```

**Use Case:**
- Fix migration history issues
- Handle failed migrations manually
- Sync migration state after manual database changes
- Recovery from corrupted migration state

**Example Scenario:**

```bash
# Migration failed midway, fixed manually in database
# Mark as applied to sync state
prisma migrate resolve --applied 20250127120000_add_indexes
```

---

## Prisma Client

### `prisma generate`

Generate Prisma Client based on the schema. **Required after schema changes.**

```bash
# Generate Prisma Client
prisma generate

# Specify custom output path
prisma generate --schema=./custom/schema.prisma

# Watch mode (regenerate on schema changes)
prisma generate --watch
```

**What it generates:**

```
node_modules/
└── .prisma/
    └── client/
        ├── index.js
        ├── index.d.ts
        └── ... (generated files)
```

**Schema with custom output:**

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}
```

**Usage in Code:**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create user
  const user = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      posts: {
        create: [
          { title: 'First Post' },
          { title: 'Second Post' }
        ]
      }
    },
    include: {
      posts: true
    }
  });

  console.log(user);

  // Find users
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: 'alice'
      }
    },
    include: {
      posts: true
    }
  });

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: 1 },
    data: { email: 'newemail@example.com' }
  });

  // Delete user
  await prisma.user.delete({
    where: { id: 1 }
  });

  // Transactions
  await prisma.$transaction([
    prisma.user.create({ data: { email: 'user1@example.com' } }),
    prisma.user.create({ data: { email: 'user2@example.com' } })
  ]);

  // Raw queries
  const result = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${'alice@example.com'}`;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**When to run `generate`:**
- After every schema change
- After pulling code with schema updates
- Before building for production
- In CI/CD pipelines

**Note:** Many Prisma commands (like `migrate dev`, `db push`) automatically run `generate`.

---

## Database Commands

### `prisma db seed`

Seed the database with initial data.

```bash
# Run seed script
prisma db seed

# Reset and seed
prisma migrate reset
```

**Setup in package.json:**

```json
{
  "name": "my-project",
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

**Example seed.ts:**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@prisma.io',
      name: 'Alice',
      posts: {
        create: [
          {
            title: 'Getting Started with Prisma',
            content: 'Prisma is a next-generation ORM...',
            published: true
          },
          {
            title: 'Advanced Prisma Patterns',
            content: 'Learn advanced techniques...',
            published: false
          }
        ]
      }
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@prisma.io',
      name: 'Bob',
      posts: {
        create: [
          {
            title: 'Database Design Best Practices',
            content: 'Learn how to design efficient databases...',
            published: true
          }
        ]
      }
    }
  });

  console.log({ alice, bob });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Use Case:**
- Populate development databases
- Create test data
- Set up demo environments
- Initialize reference data

---

### `prisma db execute`

Execute raw SQL against the database.

```bash
# Execute SQL from file
prisma db execute --file=./scripts/seed.sql

# Execute inline SQL (PostgreSQL)
prisma db execute --stdin < ./scripts/migration.sql

# With custom schema
prisma db execute --file=./reset.sql --schema=./prisma/schema.prisma
```

**Example SQL file (seed.sql):**

```sql
-- Insert sample data
INSERT INTO "User" (email, name) VALUES
  ('john@example.com', 'John Doe'),
  ('jane@example.com', 'Jane Smith'),
  ('bob@example.com', 'Bob Johnson');

INSERT INTO "Post" (title, content, published, "authorId") VALUES
  ('First Post', 'Content here', true, 1),
  ('Second Post', 'More content', false, 1),
  ('Another Post', 'Even more content', true, 2);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_post_author ON "Post"("authorId");
```

```bash
# Execute the file
prisma db execute --file=./seed.sql
```

**Use Case:**
- Run custom SQL scripts
- Perform database maintenance
- Execute complex queries not supported by Prisma
- Database migrations with custom logic
- Bulk data operations

---

## Prisma Studio

### `prisma studio`

Launch Prisma Studio - a visual database browser and editor.

```bash
# Start Prisma Studio (default port 5555)
prisma studio

# Use custom port
prisma studio --port 3000

# Use custom browser
prisma studio --browser chrome

# Specify schema location
prisma studio --schema=./custom/schema.prisma
```

**Features:**
- **Visual data browser:** View all tables and records
- **CRUD operations:** Create, read, update, delete records via GUI
- **Relationship navigation:** Click through related records
- **Filtering & sorting:** Find specific data quickly
- **Data editing:** Modify records without writing queries

**Use Case:**
- Quick data inspection during development
- Manual data entry and editing
- Testing relationships and constraints
- Debugging data issues
- Non-technical team members can view/edit data

**Studio Interface:**
```
┌─────────────────────────────────────────┐
│ Prisma Studio                     ⚙️    │
├─────────────────────────────────────────┤
│  Models:                                │
│  ├─ User (143 records)                  │
│  ├─ Post (567 records)                  │
│  └─ Comment (1,234 records)             │
├─────────────────────────────────────────┤
│  User Table View:                       │
│  ┌──────┬─────────────────┬──────────┐ │
│  │ id   │ email           │ name     │ │
│  ├──────┼─────────────────┼──────────┤ │
│  │ 1    │ alice@ex.com    │ Alice    │ │
│  │ 2    │ bob@ex.com      │ Bob      │ │
│  └──────┴─────────────────┴──────────┘ │
└─────────────────────────────────────────┘
```

---

## Utility Commands

### `prisma --help`

Display help information for Prisma CLI.

```bash
# General help
prisma --help

# Help for specific command
prisma migrate --help
prisma db --help
prisma generate --help
```

---

### `prisma --version`

Show version information.

```bash
prisma --version
```

**Output:**

```
prisma                  : 5.22.0
@prisma/client          : 5.22.0
Computed binaryTarget   : darwin-arm64
Operating System        : darwin
Architecture            : arm64
Node.js                 : v20.11.0
```

---

### `prisma debug`

Output debug information for troubleshooting.

```bash
prisma debug
```

**Use Case:**
- Troubleshooting issues
- Creating bug reports
- Checking environment configuration

---

## Advanced Commands

### Custom Binary Targets

Configure Prisma for different deployment environments.

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x", "linux-musl"]
}
```

**Common targets:**
- `native` - Your local machine
- `debian-openssl-1.1.x` - Debian/Ubuntu servers
- `debian-openssl-3.0.x` - Newer Debian/Ubuntu
- `linux-musl` - Alpine Linux (Docker)
- `rhel-openssl-1.0.x` - Red Hat/CentOS
- `darwin` - macOS
- `darwin-arm64` - macOS Apple Silicon
- `windows` - Windows

**Use Case:** Deploy to Docker, AWS Lambda, or other platforms with different OS.

---

### Multiple Generators

Generate multiple clients or additional tools.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}

generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/erd.svg"
}

generator docs {
  provider = "node node_modules/prisma-docs-generator"
  output   = "../docs"
}
```

```bash
# Generate all configured generators
prisma generate
```

---

### Database Provider Examples

#### PostgreSQL

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// With connection pooling
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**.env:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

---

#### MySQL

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(191)
  createdAt DateTime @default(now()) @db.Timestamp(6)
}
```

**.env:**

```env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

---

#### SQLite

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Use Case:** Local development, testing, prototyping.

---

#### MongoDB

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique
  posts Post[]
}

model Post {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  title    String
  authorId String @db.ObjectId
  author   User   @relation(fields: [authorId], references: [id])
}
```

**.env:**

```env
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority"
```

---

#### SQL Server

```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique @db.VarChar(255)
  name  String? @db.NVarChar(Max)
}
```

**.env:**

```env
DATABASE_URL="sqlserver://localhost:1433;database=mydb;user=SA;password=YourPassword;trustServerCertificate=true"
```

---

#### CockroachDB

```prisma
datasource db {
  provider = "cockroachdb"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique
  createdAt DateTime @default(now())
}
```

**.env:**

```env
DATABASE_URL="postgresql://user:password@host:26257/mydb?sslmode=require"
```

---

## Environment & Configuration

### Environment Variables

**Common variables:**

```env
# Primary database connection
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"

# Direct connection (bypassing poolers)
DIRECT_URL="postgresql://user:pass@localhost:5432/mydb"

# Shadow database for development
SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/shadow"

# Prisma configuration
PRISMA_HIDE_UPDATE_MESSAGE=true
DEBUG="prisma:*"
```

---

### Schema File Location

**Default:** `./prisma/schema.prisma`

**Custom location:**

```bash
# Specify in command
prisma migrate dev --schema=./custom/path/schema.prisma

# Set environment variable
export PRISMA_SCHEMA_PATH=./custom/path/schema.prisma
prisma migrate dev
```

---

### Connection Pooling

**With PgBouncer or connection poolers:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // Pooled connection
  directUrl = env("DIRECT_URL")          // Direct connection for migrations
}
```

**.env:**

```env
DATABASE_URL="postgresql://user:pass@pooler.example.com:6543/mydb"
DIRECT_URL="postgresql://user:pass@postgres.example.com:5432/mydb"
```

---

## Complete Workflow Examples

### Starting a New Project

```bash
# 1. Initialize Prisma
npm init -y
npm install prisma --save-dev
npx prisma init --datasource-provider postgresql

# 2. Update .env with your database URL
# DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"

# 3. Define your schema
# Edit prisma/schema.prisma

# 4. Create and apply migration
npx prisma migrate dev --name init

# 5. Generate Prisma Client
npx prisma generate

# 6. Install Prisma Client
npm install @prisma/client

# 7. Use Prisma in your code
```

---

### Adding Prisma to Existing Database

```bash
# 1. Initialize Prisma
npx prisma init

# 2. Configure DATABASE_URL in .env

# 3. Introspect existing database
npx prisma db pull

# 4. Review and adjust generated schema

# 5. Generate Prisma Client
npx prisma generate

# 6. Create baseline migration
npx prisma migrate dev --name baseline
```

---

### Daily Development Workflow

```bash
# 1. Update schema in prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_new_feature

# 3. Prisma Client is auto-generated

# 4. Use new fields in code

# 5. Commit schema and migration files
git add prisma/
git commit -m "Add new feature to schema"
```

---

### Production Deployment

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply migrations
npx prisma migrate deploy

# 4. Start application
npm start
```

---

## Quick Command Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `prisma init` | Initialize Prisma | Starting new project |
| `prisma generate` | Generate Client | After schema changes |
| `prisma db push` | Sync schema to DB | Quick prototyping |
| `prisma db pull` | Pull schema from DB | Existing databases |
| `prisma migrate dev` | Create migration | Development workflow |
| `prisma migrate deploy` | Apply migrations | Production deployment |
| `prisma migrate reset` | Reset database | Fresh start (dev only) |
| `prisma migrate status` | Check migration state | Before deployment |
| `prisma studio` | Open GUI | Data browsing/editing |
| `prisma format` | Format schema | Before committing |
| `prisma validate` | Validate schema | CI/CD checks |

---

## Best Practices

1. **Never use `migrate dev` in production** - Use `migrate deploy` instead
2. **Always commit migration files** - They're part of your codebase
3. **Use `db push` for prototyping** - Switch to migrations for production
4. **Run `prisma format`** before committing schemas
5. **Use `prisma validate`** in CI/CD pipelines
6. **Keep migrations small and focused** - One feature per migration
7. **Test migrations in staging** before production
8. **Use environment variables** for database URLs
9. **Enable connection pooling** for production
10. **Backup databases** before running migrations

---

## Additional Resources

- **Official Docs:** https://www.prisma.io/docs
- **CLI Reference:** https://www.prisma.io/docs/reference/api-reference/command-reference
- **Schema Reference:** https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **Client API:** https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
- **GitHub:** https://github.com/prisma/prisma

---

**Last Updated:** January 2025 | **Prisma Version:** 5.x