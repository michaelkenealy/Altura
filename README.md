# Altura

Professional Investment Fund Portfolio Management Platform

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties
- **Components**: shadcn/ui (Radix UI primitives)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand
- **Data Fetching**: TanStack React Query

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000)

## Design System

Altura uses an institutional finance aesthetic:

| Token | Value |
|-------|-------|
| Navy (primary bg) | `#0A1628` |
| Gold (accent) | `#C5A572` |
| Surface | `#0F1F3D` |
| Border | `#1A2F55` |
| Text primary | `#F1F5F9` |
| Text secondary | `#94A3B8` |

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/       # Reusable UI components
  config/           # Navigation and permissions config
  hooks/            # Custom React hooks
  lib/              # Supabase clients and utilities
  stores/           # Zustand state stores
  types/            # TypeScript type definitions
```

## Environment Variables

See `.env.local.example` for required environment variables.
