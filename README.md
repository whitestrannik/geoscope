# GeoScope

A multiplayer geography guessing game where players identify real-world locations by placing pins on maps based on real photos.

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite (build tool)
- TailwindCSS v4.0 (styling)
- shadcn/ui (component library)

### Backend
- Node.js with Express
- TypeScript
- tRPC (type-safe API)
- Socket.IO (real-time communication)
- Prisma (database ORM)

### Database & Services
- PostgreSQL (via Railway)
- Supabase Auth (authentication)
- Mapillary API (street view images)

### Development Tools
- pnpm (package manager & monorepo)
- ESLint & Prettier (code quality)
- Vitest (testing)

## Project Status

**✅ Phase 0 Complete - Project Setup & Tooling**
- Frontend: `http://localhost:3000` (React + Vite + TailwindCSS v4 + shadcn/ui)
- Backend: `http://localhost:8000` (Express + tRPC + Socket.IO)
- Tests: 3/3 passing
- Development workflow functional on Windows PowerShell

## Prerequisites

- Node.js 20+
- pnpm 9+

## Getting Started

1. **Install pnpm globally** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd geoscope
   pnpm install
   ```

3. **Environment Setup**:
   - Copy `.env.example` to `.env.local` and place **outside the project directory**
   - Configure with your API keys and database credentials
   - See `.env.example` for all required environment variables

4. **Development**:
   ```powershell
   # Start all development servers (frontend + backend)
   pnpm dev
   
   # Run frontend only
   cd apps/frontend
   pnpm dev
   
   # Run backend only  
   cd apps/backend
   pnpm dev
   
   # Run tests
   pnpm test
   ```

## Project Structure

```
geoscope/
├── apps/
│   ├── frontend/          # React + Vite + TailwindCSS v4 frontend
│   └── backend/           # Express + tRPC + Socket.IO backend
├── packages/
│   ├── shared/            # Shared types and utilities (TypeScript)
│   ├── ui/                # Shared UI components (placeholder)
│   └── api/               # API client and types (placeholder)
├── project-doc/           # Project documentation and specs
├── package.json           # Root package.json with workspace scripts
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── .npmrc                 # pnpm Windows compatibility settings
├── env.example            # Environment variables template
└── README.md
```

## Available Scripts

- `pnpm dev` - Start all development servers (frontend:3000 + backend:8000)
- `pnpm build` - Build all packages and apps
- `pnpm build:packages` - Build only shared packages  
- `pnpm lint` - Run ESLint across all workspaces
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean all node_modules and build outputs
- `pnpm test` - Run tests across all workspaces

## Development Workflow

1. **Setup**: Install dependencies with `pnpm install`
2. **Development**: Run `pnpm dev` to start all services
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Backend Health: http://localhost:8000/health
3. **Testing**: Run `pnpm test` for all tests (currently 3 frontend tests)
4. **Building**: Use `pnpm build` for production builds

## Windows Development Notes

- All scripts are PowerShell compatible
- Uses `.npmrc` with Windows-specific settings
- No symlinks (symlink=false)
- Hoisted dependencies for compatibility

## License

MIT 