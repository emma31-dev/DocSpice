# Technology Stack

## Framework & Runtime

- **Next.js 15** with App Router and React Server Components
- **React 19.1.0** for UI components
- **TypeScript 5** for type safety
- **Node.js 18+** runtime requirement

## Build System

- **Turbopack** enabled for dev and build (via `--turbopack` flag)
- **pnpm** as the package manager (preferred over npm/yarn)

## Styling

- **Tailwind CSS 4** with PostCSS
- Utility-first CSS approach
- Custom global styles in `src/app/globals.css`

## Key Libraries

- **@supabase/ssr**: Authentication and database (SSR-compatible)
- **natural**: Natural language processing for text analysis
- **stopword**: Stop word filtering for keyword extraction
- **axios**: HTTP client for API requests
- **lucide-react**: Icon library

## External APIs

- **Unsplash API**: Image search and retrieval
- **Supabase**: Authentication, database, and session management

## Common Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack

# Build & Deploy
pnpm build            # Production build with Turbopack
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
```

## Environment Variables

Required variables in `.env.local`:
- `UNSPLASH_ACCESS_KEY` - Server-side Unsplash API key (no NEXT_PUBLIC_ prefix)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Path Aliases

- `@/*` maps to `./src/*` for clean imports
