# Hexagonal Todo App (Ports & Adapters)

Feature-bloated todo app built to learn **hexagonal architecture** in practice.

The goal is not a minimal CRUD demo. The goal is to have enough moving parts (auth, projects, tags, reminders, recurrence, search, multiple persistence adapters) to make architecture decisions visible, testable, and discussable.

## Why This Exists

This project is a teaching playground for:

- clear boundaries between domain logic and infrastructure
- ports as contracts and adapters as implementations
- dependency inversion (dependencies point inward)
- swapping technical details without rewriting core behavior
- easier testing through isolation and dependency injection

## Architecture At A Glance

Hexagonal architecture in this repo is split into:

- **Core (`packages/core`)**: business model + use cases, no framework/db details
- **API app (`apps/api`)**: adapters and runtime composition
- **Web app (`apps/web`)**: UI client talking to API

### Dependency Direction (Important)

Only outer layers know about inner layers.

- adapters know ports
- use cases know ports
- domain knows nothing about adapters/frameworks
- infrastructure wires implementations, but does not own business rules

## Explicit Folder Structure

```text
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── inbound/
│   │   │   │   │   ├── http/              # Fastify routes, schemas, middleware
│   │   │   │   │   └── scheduler/         # Reminder trigger adapter
│   │   │   │   └── outbound/
│   │   │   │       ├── postgres/          # DB-backed ports
│   │   │   │       ├── inmemory/          # Test/dev-friendly ports
│   │   │   │       └── *.ts               # Clock, UUID, token, hashing, notifications
│   │   │   └── infrastructure/
│   │   │       ├── config/                # Env parsing/validation
│   │   │       ├── di/                    # Dependency wiring container
│   │   │       ├── server/                # Fastify app assembly
│   │   │       ├── dev.ts                 # In-memory composition root
│   │   │       └── main.ts                # Production composition root (Postgres)
│   │   └── test/
│   └── web/                               # React client
├── packages/
│   └── core/
│       └── src/
│           ├── domain/                    # Pure business concepts and rules
│           └── application/
│               ├── usecases/              # Command/query handlers
│               ├── ports/
│               │   ├── inbound/           # Use-case interfaces consumed by inbound adapters
│               │   └── outbound/          # Dependencies required from outside
│               └── dto/                   # Data shapes crossing boundaries
└── tooling/
```

## Layer Responsibilities

### Domain (`packages/core/src/domain`)

- Encodes business invariants and rules
- Owns domain concepts (Task, Project, Tag, Reminder, User, Workspace, Recurrence)
- Has no dependency on HTTP, database, or framework code

### Application (`packages/core/src/application`)

- Orchestrates use cases (create task, archive project, login, process reminders, ...)
- Defines **outbound ports** (e.g. repositories, token/password services, clock, notification channel)
- Defines **inbound ports** and DTOs for incoming requests and outgoing responses
- Depends on domain + abstractions only

### Adapters (`apps/api/src/adapters`)

- **Inbound adapters** translate external input to application calls (Fastify routes, scheduler trigger)
- **Outbound adapters** implement application ports (Postgres repos, in-memory repos, JWT, bcrypt, clock)
- Adapters can be replaced independently if they keep the same port contract

### Infrastructure (`apps/api/src/infrastructure`)

- Composition root of the app
- Chooses concrete adapters and wires them into use cases (`di/container.ts`)
- Provides startup modes:
  - `main.ts`: Postgres + real integrations
  - `dev.ts`: in-memory/stubbed dependencies

## Boundaries In Practice

This repo enforces boundaries with `eslint-plugin-boundaries`:

- in `@todo/core`: `domain` cannot depend on `application`
- in `@todo/api`: `inbound` cannot import `outbound`/`infrastructure`, and `outbound` cannot import `inbound`/`infrastructure`

This helps keep architecture drift visible during development.

## Why Dependency Inversion Matters Here

Use cases depend on interfaces, not implementations:

- app logic asks for a `TaskRepo`, not `PgTaskRepo`
- auth use cases ask for `PasswordHasher`/`TokenService`, not bcrypt/jose directly
- time-based logic asks for a `Clock`, not `Date.now()` scattered everywhere

Result:

- swapping adapters is straightforward (`main.ts` vs `dev.ts`)
- tests can run with in-memory or stub implementations
- business logic remains stable when infrastructure changes

## Testing Benefits

Hexagonal boundaries make testing focused:

- test domain/application behavior with lightweight doubles
- keep infrastructure concerns in adapter/integration tests
- avoid booting full web server or database for most rule-level tests

This keeps test feedback fast and aligned with actual business behavior.

## Running The Project

### Prerequisites

- Node.js `>=20`
- `pnpm`

### Install

```bash
pnpm install
```

### Start API (in-memory/dev mode)

```bash
pnpm --filter @todo/api dev:mem
```

### Start API (Postgres mode)

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/todo \
JWT_SECRET=replace-me \
pnpm --filter @todo/api dev
```

### Start Web App

```bash
pnpm --filter web dev
```

The web app proxies `/api` requests to `http://localhost:3000`.

### Workspace Scripts

```bash
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## Pros And Cons Of This Architecture

### Pros

- business logic isolated from technical details
- better long-term changeability (swap infra without rewriting use cases)
- high-signal tests at domain/application level
- clearer ownership of responsibilities
- architecture can be partially enforced with lint rules

### Cons

- extra wiring/boilerplate, so more files/abstractions than a simple CRUD app

## Good Learning Resources

- Alistair Cockburn - Hexagonal Architecture (Ports & Adapters):
  https://alistair.cockburn.us/hexagonal-architecture
- Martin Fowler - Inversion of Control Containers and the Dependency Injection pattern:
  https://martinfowler.com/articles/injection.html
- Robert C. Martin - The Clean Architecture (article):
  https://blog.cleancoder.com/uncle-bob/2011/11/22/Clean-Architecture.html
- Vaughn Vernon - Implementing Domain-Driven Design (book)
- Mark Seemann - Dependency Injection Principles, Practices, and Patterns (book)

## How To Use This Repo For Learning

- pick one feature (e.g. reminders or recurrence)
- trace it from inbound adapter -> use case -> domain rules -> outbound port
- replace one outbound adapter (e.g. in-memory for Postgres) and note what does _not_ change
- write one focused test in core and one integration test in API to compare feedback loops

The architecture is doing its job when behavior stays consistent while details around it are easy to swap.
