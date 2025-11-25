# JOYA Project

## Overview
JOYA is a MERN stack application dedicated to energy auditing and simulation (Audit Énergétique). It helps users assess their building's energy performance, estimate costs, and explore efficiency improvements.

## Architecture
The project follows a **Clean Architecture** principle and is structured as a monorepo:

- **`packages/backend`**: Express.js server with TypeScript, MongoDB, and OpenAI integration.
- **`packages/frontend`**: React application (UI).
- **`packages/shared`**: Shared types, interfaces, and enums used by both backend and frontend.

## Key Features
- **Energy Audit Simulation**: Calculate annual consumption, CO₂ emissions, and energy class (BECTh).
- **Bill Extraction (AI)**: Extract data from utility bills (STEG) using OpenAI GPT-4o.
- **Detailed Reporting**: Energy breakdown by usage (HVAC, Lighting, Equipment).

## Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- OpenAI API Key (for bill extraction)

## Getting Started

### 1. Setup Backend
```bash
cd packages/backend
npm install
cp env.example .env
# Update .env with your MongoDB URI and OpenAI Key
npm run dev
```

### 2. Running Tests
```bash
cd packages/backend
npm test
```

## Technologies
- **Backend**: Node.js, Express, TypeScript, Mongoose, Zod, Swagger
- **AI**: OpenAI GPT-4o (Structured Outputs)
- **Testing**: Jest
- **Linting**: ESLint, Prettier

## License
[Your License Here]

