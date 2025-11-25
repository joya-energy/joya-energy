# JOYA Project

## Overview
JOYA is a MEAN stack application dedicated to energy auditing and simulation (Audit Énergétique). It helps users assess their building's energy performance, estimate costs, and explore efficiency improvements.

## Architecture
The project follows a **Clean Architecture** principle and is structured as a monorepo:

- **`packages/backend`**: Express.js server with TypeScript, MongoDB, and OpenAI integration.
- **`packages/frontend`**: Angular application (UI).
- **`packages/shared`**: Shared types, interfaces, and enums used by both backend and frontend.

## Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Local instance (running on port 27017) or MongoDB Atlas connection string.
- **OpenAI API Key**: Required for the bill extraction feature.

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd joya
```

### 2. Install Dependencies (Monorepo)
From the project root simply run:
```bash
npm install
```
This uses the monorepo workspaces configuration to install dependencies for every package (`packages/backend`, `packages/shared` ,`packages/frontend`) at once.

**Whatever you have a need to install dependecies inside a specific package you can acces to its folder and do it 



### 3. Environment Configuration
Set up the environment variables for the backend.

```bash
cd packages/backend
cp env.development (for dev env) (shared in slack)
```

### 4. Running the Application



**Root-level workspace scripts (Development Mode):**
```bash
# run backend dev server from root
npm run dev:backend

# run backend tests from root
npm run test:backend
```

**Access API Documentation:**
Once the server is running, visit the Swagger UI:
👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Testing

We use **Jest** for unit and integration testing.

**Run Backend Tests:**
```bash
cd packages/backend
npm test
```

**Run Specific Test Suite:**
```bash
npm test -- audit-energetique
```

**Check Test Coverage:**
```bash
npm run test:coverage
```

## Project Structure (Backend)

```
src/
├── modules/              # Feature-based modules (Clean Architecture)
│   ├── audit-energetique/# Energy audit logic, controllers, services
│   ├── contact/          # Contact form handling
│   └── ...
├── common/               # Shared utilities, base classes
├── config/               # Environment and app configuration
├── models/               # Mongoose data models
└── server.ts             # App entry point
```

## Key Features
- **Energy Audit Simulation**: Calculate annual consumption, CO₂ emissions, and energy class (BECTh).
- **Bill Extraction (AI)**: Extract data from utility bills (STEG) using OpenAI GPT-4o.
- **Detailed Reporting**: Energy breakdown by usage (HVAC, Lighting, Equipment).

## License
Joya-team

## Branching & Collaboration Workflow

To keep development predictable (especially when pairing with junior teammates) we follow a simple three-branch workflow:

- **`main`** – Production-ready code. Protected branch (no direct pushes).
- **`staging`** – Release candidate environment. Only merge after QA sign-off.
- **`dev`** – Integration branch for day-to-day development.

### Feature Flow
1. **Start from `dev`:**
   ```bash
   git checkout dev
   git pull origin dev
   ```
2. **Create a feature branch:**
   ```bash
   # Examples:
   git checkout -b feat/123-bill-extraction
   git checkout -b fix/456-bug-description
   git checkout -b chore/infra-update
   ```
   **Naming convention:** `<type>/<ticket-or-short-desc>` where type ∈ {`feat`, `fix`, `chore`, `refactor`, `docs`}.
3. **Develop & test locally:**
   - `npm run dev:backend`
   - `npm run test:backend`
4. **Commit using Conventional Commits**, e.g. `feat: add bill extraction endpoint`.
5. **Push the branch** and open a Pull Request targeting `dev`.
6. **After approval**, merge into `dev`. Automated or manual testing promotes the branch to `staging`, then to `main` for production releases.

### Pull Request Checklist
- ✅ Lint & tests run successfully (`npm run test:backend`).
- ✅ README or relevant docs updated if behavior changes.
- ✅ Includes any required screenshots or Swagger updates for new endpoints.
- ✅ No secrets committed (check `.env`, API keys, etc.).

Following this workflow keeps the history clean and makes it easy for new joiners to understand the release pipeline.