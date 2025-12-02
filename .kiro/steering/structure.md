# Project Structure

## Directory Organization

```
docspice/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/generate/       # Article generation API endpoint
│   │   ├── article/[id]/       # Dynamic article display pages
│   │   ├── create-article/     # Protected article creation page
│   │   ├── globals.css         # Global styles and Tailwind directives
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── LoadingComponents.tsx
│   │   ├── SuccessMessage.tsx
│   │   └── SuccessToast.tsx
│   └── lib/                    # Utility libraries and business logic
│       ├── supabase/
│       │   └── server.ts       # Server-side Supabase client
│       ├── textAnalysis.ts     # NLP, keyword extraction, query generation
│       └── unsplash.ts         # Unsplash API integration
├── public/                     # Static assets (logos, icons, manifest)
├── middleware.ts               # Auth middleware for route protection
└── .kiro/                      # Kiro configuration and specs
    ├── steering/               # AI assistant guidance documents
    └── specs/                  # Feature specifications
```

## Key Architectural Patterns

### Route Protection
- Middleware intercepts requests to `/create-article` route
- Redirects unauthenticated users to `/login` with return URL
- Uses Supabase SSR for session management

### Server Components
- Default to React Server Components for data fetching
- Server-side API calls to Unsplash (keeps API key secure)
- Client components only when interactivity is needed

### Text Analysis Pipeline
1. Extract keywords using TF-IDF-like scoring
2. Detect content type (narrative/technical/descriptive)
3. Extract named entities with type classification
4. Identify themes from predefined categories
5. Generate multi-strategy search queries with relevance scoring

### Image Selection Strategy
- Multi-keyword queries for realistic results
- Smart image selection (prefers 2nd/3rd results over 1st)
- Aspect ratio and resolution scoring
- Deduplication across queries
- Fallback images when API unavailable

## Configuration Files

- `next.config.ts` - Next.js config with Unsplash image domain
- `tsconfig.json` - TypeScript config with path aliases
- `eslint.config.mjs` - ESLint configuration
- `postcss.config.mjs` - PostCSS with Tailwind
- `.env.local` - Environment variables (not committed)
