# Implementation Plan: GATE Preparation AI Platform

This document outlines the 12-week development roadmap for the GATE Preparation AI Platform. The project is divided into five distinct phases, moving from structural foundation to advanced AI capabilities.

## Phase 1: Foundation & UI Shell (Weeks 1–2) ✅ COMPLETE
**Goal:** Establish the technical skeleton, design system, and authentication flow.

### Backend Tasks
- [x] Initialize Node.js + Express + TypeScript project.
- [x] Setup Prisma ORM with PostgreSQL and `pgvector` extension.
- [x] Seed master tables for GATE papers, subjects, and topics (starting with CS).
- [x] Build JWT-based authentication system (Register, Login, Me).
- [x] Input validation on all auth endpoints.
- [x] Env variable validation on server startup + `.env.example`.
- [x] Configure CI/CD pipeline via GitHub Actions.

### Frontend Tasks
- [x] Initialize React + Vite + TypeScript with TailwindCSS.
- [x] Setup React Router with paths for all 11 core modules.
- [x] Build common UI components (Button, Card, MathRenderer).
- [x] Integrate Zustand for global state and React Query for API data.
- [x] Protected routes — unauthenticated users redirected to `/login`.
- [x] Active nav highlight in sidebar.
- [x] Real username displayed in header; logout properly clears auth state.

---

## Phase 2: Core AI Intelligence (Weeks 3–5) ✅ COMPLETE
**Goal:** Bring the "Brain" online with grounded tutoring and study planning.

- [x] **AI Wrapper:** `claude.service.ts` with smart model routing (Haiku/Sonnet/Opus) and adaptive thinking.
- [x] **Streaming Tutor:** SSE endpoint + React SSE chat UI with session persistence.
- [x] **Study Planner:** Claude Opus-powered adaptive hour-based schedule generator with week-by-week breakdown.
- [x] **PYQ Vault:** Question browser with AI-generated explanations (cached to DB).
- [x] **Numerical Verifier:** Python FastAPI + SymPy sidecar for NAT answer validation.
- [x] **Prisma Schema:** Added `ChatSession`, `ChatMessage`, updated `StudyPlan` with progress tracking.
- [x] **Frontend API layer:** Axios client with auth injection + `streamChat` SSE helper.

### New Backend Files
- `backend/src/lib/prisma.ts` — shared Prisma singleton
- `backend/src/services/claude.service.ts` — Claude SDK wrapper (Sonnet 4.6 tutor + Opus 4.7 planner)
- `backend/src/controllers/tutor.controller.ts` — SSE chat, session CRUD, explanation endpoint
- `backend/src/controllers/planner.controller.ts` — generate/get/update study plan
- `backend/src/controllers/pyq.controller.ts` — list/filter/explain PYQ questions + NAT verifier
- `backend/src/routes/tutor.routes.ts`, `planner.routes.ts`, `pyq.routes.ts`
- `backend/python/sympy_verifier/main.py` + `requirements.txt`

### New Frontend Files
- `frontend/src/lib/api.ts` — Axios client + `streamChat` SSE helper
- `frontend/src/pages/Tutor.tsx` — full streaming chat UI with session sidebar
- `frontend/src/pages/Planner.tsx` — plan generator + week-by-week progress tracker
- `frontend/src/pages/PYQVault.tsx` — question browser with modal AI explanations

---

## Phase 3: Practice & Retention (Weeks 6–7) ✅ COMPLETE
**Goal:** Implement full-length testing, memory reinforcement, and smart note-taking.

- [x] **Mock Test Engine:** 65-question GATE pattern generator with question palette, flagging, auto-submit on timeout.
- [x] **Scoring Logic:** MCQ/MSQ/NAT scoring with exact negative marks (±⅓/±⅔) and NAT ±1% tolerance.
- [x] **Live Exam Simulation:** Event scheduling, registration, submit with real-time percentile calculation & leaderboard.
- [x] **Spaced Repetition Flashcards:** SM-2 algorithm with 6-quality ratings, deck management, due-card queue.
- [x] **AI Note-taking:** Markdown editor with Claude Haiku AI summarization (Key Concepts, Formulas, Traps, Tips).
- [x] **Shortcuts Library:** 20 curated GATE tricks seeded across 9 subjects with difficulty badges & GATE year refs.

### New Backend Files
- `backend/src/controllers/mocktest.controller.ts` — test generation & submission with GATE marking scheme
- `backend/src/controllers/flashcard.controller.ts` — SM-2 algorithm, deck/card CRUD, review sessions
- `backend/src/controllers/notes.controller.ts` — note CRUD + Claude Haiku summarization
- `backend/src/controllers/shortcuts.controller.ts` — shortcut library serving with search/filter
- `backend/src/controllers/liveexam.controller.ts` — event management, real-time percentile ranking
- `backend/src/routes/` — mocktest, flashcard, notes, shortcuts, liveexam route files
- `backend/prisma/seed-shortcuts.ts` — 20 curated GATE shortcuts across 9 subjects

### New Frontend Files
- `frontend/src/pages/MockTests.tsx` — full test UI with question palette, timer, MCQ/MSQ/NAT inputs
- `frontend/src/pages/Flashcards.tsx` — SM-2 review (flip cards), deck/card management
- `frontend/src/pages/Shortcuts.tsx` — searchable grid with subject filters and content modal
- `frontend/src/pages/Notes.tsx` — markdown editor with AI summary side panel
- `frontend/src/components/Layout.tsx` — upgraded collapsible sidebar with grouped sections


---

## Phase 4: Analytics & Adaptation (Weeks 8–9) ✅ COMPLETE
**Goal:** Provide data-driven insights and specialized revision paths.

- [x] **Weak Area Analyzer:** Background service/endpoint that tracks question response accuracy and ranks weak topics.
- [x] **Rank Predictor:** Custom score-to-rank regression heuristic endpoint mapping mock test scores to GATE ranks.
- [x] **Dynamic Revision Mode:** User setting toggle to focus exclusively on high-yield revision for the last 60 days.
- [x] **Dashboard:** Visual analytics hub built with Recharts displaying Performance Trend area charts and quick stats.
- [x] **Planner Feedback:** Wired weak area data automatically into the study plan generator for targeted improvement.

### New Backend Files
- `backend/src/controllers/analytics.controller.ts` — Dashboard stats, weak areas logic, rank predictor, revision mode toggle
- `backend/src/routes/analytics.routes.ts` — API endpoints for Phase 4

### New Frontend Files
- `frontend/src/pages/WeakAreas.tsx` — Visual analyzer page with actionable links
- `frontend/src/pages/Dashboard.tsx` — Upgraded with Recharts trend graph, dynamic predicted rank, and Revision Mode toggle

---

## Phase 5: Advanced Features & Polish (Weeks 10–12) ✅ COMPLETE
**Goal:** Finalize multimodal features, guidance tools, and production deployment.

- [x] **Photo Solver:** Integrate GPT-4o Vision for image-to-solution processing.
- [x] **Counselling Assistant:** Step-by-step guidance for GATE application, COAP, and CCMT choice filling.
- [x] **Motivation Coach:** Implement daily nudges and weekly progress digests.
- [x] **Interview Prep:** Build the post-GATE guidance and mock interview module.
- [x] **Payments:** Integrate Razorpay for premium feature access.
- [x] **Launch:** Conduct security hardening, load testing, and deployment.

---

## Technology Stack Summary
- **Frontend:** React, TailwindCSS, Vite, Zustand, Recharts, KaTeX.
- **Backend:** Node.js (Express), TypeScript, Prisma.
- **Database:** PostgreSQL + pgvector (Supabase).
- **AI:** Anthropic Claude (Sonnet 4.6 tutor / Opus 4.7 planner), OpenAI GPT-4o Vision (Phase 5).
- **Tools:** Python (FastAPI + SymPy), Redis, Sentry, Razorpay.
