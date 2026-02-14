# Reagvis Labs Pvt. Ltd.

## Overview

Reagvis Labs Pvt. Ltd. is a frontend-only verification demo web application built with React and Vite. The app simulates a document/content verification workflow with features including file upload, analysis processing, results display with KPI tiles, and report export functionality. All analysis logic is client-side with deterministic mock outputs for demo purposes - no backend API calls or ML models are involved.

The application provides multiple verification tools (Document, Fact Check, Propaganda, Metadata, Geolocation) with a dark-themed UI and simulated processing states.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom build script for production
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for async state, React hooks for local state
- **Styling**: Tailwind CSS with custom CSS variables for theming, shadcn/ui component library
- **Animations**: Framer Motion for smooth transitions

### Component Structure
- `client/src/components/` - Custom application components (NavBar, KpiTiles, MainCard, ResultRow)
- `client/src/components/ui/` - shadcn/ui primitives (buttons, cards, dialogs, etc.)
- `client/src/pages/` - Page components (Home, not-found)
- `client/src/hooks/` - Custom hooks including analysis simulation logic
- `client/src/styles/` - CSS tokens and UI utility classes

### Theming System
- CSS custom properties defined in `tokens.css` for colors, gradients, shadows
- Dark theme enforced by default via `[data-theme="dark"]`
- Light/dark mode overrides built into token system

### Backend Architecture
- Express 5 server serves the built frontend in production
- Minimal server-side code - routes file is essentially empty
- In-memory storage class exists but unused (frontend-only demo)
- Vite dev server with HMR for development

### Data Layer
- Drizzle ORM configured with PostgreSQL dialect
- Schema defined in `shared/schema.ts` for type safety
- Database not actively used - all demo data is client-side mock data
- Schema includes `analysisResults` table structure for future backend integration

### Build System
- Development: `tsx` runs TypeScript directly
- Production: Custom build script bundles server with esbuild, client with Vite
- Output: `dist/` folder with `index.cjs` (server) and `public/` (client assets)

## External Dependencies

### UI Component Libraries
- **shadcn/ui**: Full component library via Radix UI primitives
- **Radix UI**: Accessible, unstyled UI primitives (dialogs, menus, tooltips, etc.)
- **Lucide React**: Icon library

### Database & ORM
- **Drizzle ORM**: Type-safe SQL query builder
- **PostgreSQL**: Database dialect configured (requires DATABASE_URL env var)
- **drizzle-zod**: Schema validation integration

### Build & Development
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across client/server/shared code

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Intelligent class merging

### Other Key Dependencies
- **Framer Motion**: Animation library
- **Wouter**: Lightweight React router
- **Zod**: Runtime type validation
- **date-fns**: Date utilities