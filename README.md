# CRM Frontend

Next.js 14 frontend for the AI-powered CRM. Talks to [crm-backend](https://github.com/soupys1/crm-backend) via a typed API client.

## Stack

- **Framework** — Next.js 14 (App Router)
- **Auth** — Supabase Auth (email/password)
- **Styling** — Tailwind CSS + shadcn/ui components
- **Language** — TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- The [backend](https://github.com/soupys1/crm-backend) running on port 3000

### Install

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Run

```bash
npm run dev
```

App runs on `http://localhost:3001`.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in with email and password |
| `/signup` | Create a new account |
| `/leads` | Lead list with search, score filter, and add dialog |
| `/leads/:id` | Lead detail — AI enrichment, email drafting, Gmail threads |
| `/deals` | Deal pipeline with stage tracking and value |
| `/settings` | Connect Gmail via OAuth |

All dashboard routes (`/leads`, `/deals`, `/settings`) are protected by middleware and redirect unauthenticated users to `/login`.

## Project Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
└── (dashboard)/
    ├── leads/
    │   ├── page.tsx          # Lead list
    │   └── [id]/page.tsx     # Lead detail
    ├── deals/page.tsx
    └── settings/page.tsx

components/ui/               # shadcn/ui components (badge, button, card, dialog, input, label, textarea)

lib/
├── api.ts                   # Typed API client — auto-attaches Supabase Bearer token
├── supabase.ts              # Supabase browser client
└── types.ts                 # Shared TypeScript types (Lead, Deal, EnrichmentResult, etc.)

middleware.ts                # Next.js middleware — protects all routes except /login and /signup
```

## API Client

`lib/api.ts` wraps all backend calls. It automatically reads the current Supabase session and attaches the JWT as a `Bearer` token on every request.

```ts
import { api } from '@/lib/api'

// Examples
const { data: leads } = await api.leads.list()
const { data: lead }  = await api.leads.create({ name, company, role, email })
const { data }        = await api.ai.enrich(lead_id)
const { data: draft } = await api.ai.draft({ lead_id, intent: 'cold', pitch: '...' })
```
