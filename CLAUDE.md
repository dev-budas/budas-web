# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Budas del Mediterráneo** — Real estate agency website with:
1. **Public landing page** — lead capture from Meta Ads (property valuation CTA)
2. **Internal CRM** — lead pipeline management at `/crm`
3. **WhatsApp AI bot** — automated lead qualification via Claude API + Meta WhatsApp Business Cloud API

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 (CSS-based config, no tailwind.config.js) |
| UI components | Custom shadcn-style components in `src/components/ui/` |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| AI bot | Anthropic Claude API (`claude-sonnet-4-6`) with tool use |
| WhatsApp | Meta WhatsApp Business Cloud API v19 |
| Email | Resend |
| Deploy | Vercel |

## Architecture

### Route structure

```
src/app/
  (public)/          → Landing page (no auth, public)
    page.tsx         → Main landing page
  (admin)/crm/       → CRM (requires auth — not yet implemented)
    page.tsx         → Dashboard with stats
    leads/           → Lead list
    pipeline/        → Kanban view
    settings/        → Config
  api/
    leads/route.ts   → POST: create lead + trigger WhatsApp bot intro
    webhooks/
      whatsapp/route.ts  → GET: Meta verification | POST: incoming messages
```

### Lead lifecycle

```
Landing form submit
  → POST /api/leads
  → createLead() in Supabase [status: "nuevo"]
  → sendWhatsAppBotIntro() [status: "bot_enviado"]
  → Lead replies
  → POST /api/webhooks/whatsapp
  → processBotMessage() via Claude API [status: "respondio"]
  → Bot converses naturally (max 8-10 turns)
  → Claude calls qualify_lead tool
  → [status: "calificado" | "no_calificado"]
  → Agent takes over in CRM
```

### Key files

- `src/types/index.ts` — All TypeScript types and `LEAD_STATUS_CONFIG` (single source of truth for statuses)
- `src/lib/supabase.ts` — All Supabase queries. Uses service role key server-side, anon key client-side
- `src/lib/bot.ts` — Claude API integration. System prompt, tool definition for `qualify_lead`, message processing
- `src/lib/whatsapp.ts` — WhatsApp API wrapper (send messages)
- `src/app/api/webhooks/whatsapp/route.ts` — Webhook handler. GET for Meta verification, POST for incoming messages

### Design system

Tailwind v4 — theme tokens are defined in `src/app/globals.css` using `@theme inline {}`. **No tailwind.config.js exists** — all customization is in CSS.

Brand colors:
- `primary`: Mediterranean deep blue `#1B3A5C`
- `accent`: Warm sandy gold `#C9A96E`
- `background`: Warm white `#FAFAF8`

Typography: Playfair Display (serif, headings via `font-serif`) + Geist Sans (body). Use `.heading-display`, `.heading-1`, `.heading-2` CSS classes for branded headings.

### Supabase

- Schema: `supabase/schema.sql` — run this in Supabase SQL editor to set up
- RLS is enabled on `leads` — no public policies, all access via service role key in API routes
- `whatsapp_conversation` column is a JSONB array of `{id, role, content, timestamp}` objects

### WhatsApp bot (Claude AI)

The bot persona is **"Mediterra"**. The system prompt is in `src/lib/bot.ts`. Key design decisions:
- Claude has one tool: `qualify_lead` — it calls it when it has enough info to make a decision
- Conversation history is stored in Supabase and rebuilt on each webhook call
- The bot avoids questionnaire-style interrogation; it converses naturally
- Max ~10 turns before concluding

### Environment variables

See `.env.example`. Required for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_VERIFY_TOKEN`

### Not yet implemented

- CRM authentication (Supabase Auth)
- Lead detail page with full conversation view
- Pipeline kanban board (`/crm/pipeline`)
- Stats page (`/crm/estadisticas`)
- Email notifications via Resend on new qualified lead
- Meta Pixel integration in landing page
