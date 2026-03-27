# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full stack app that provides research subjects a code editor to solve a problem. Control group writes code by hand. Test group uses an AI agent to write code.

## Commands

- `npm install` — install all dependencies (frontend and backend share root package.json)
- `npm run server-dev` — start Express backend (port 3000) with auto-reload (`node --watch`)
- `npm run client-dev` — start Vite dev server (port 5173) for React frontend
- `npm run migrate` — run pending SQL migrations from `server/migrations/`

Both servers must run simultaneously in development. Access the app at `http://localhost:3000` (Express proxies asset requests to Vite in dev mode via `VITE_ORIGIN`).

No test runner or linter is configured.

## Architecture

### Dual-Server Dev Setup
Express (port 3000) serves HTML via Handlebars and handles API routes. In dev mode, it redirects asset requests (`/src/`, `/@`, `/node_modules/`) to Vite (port 5173). In production, Express serves Vite's built output from `client/dist/`.

### Backend (`server/`)
- **Entry**: `server.js` — Express app with cookie-parser, Handlebars templating, API routes
- **API routes**: All under `/api/auth/` — register, login, logout, me
- **Auth middleware** (`middleware/auth.js`): `loadUser` reads session cookie on every request; `requireAuth` gates protected endpoints
- **Models** (`models/users.js`): Raw SQL queries via `pg` pool (parameterized)
- **Migrations** (`migrations/`): Numbered SQL files run by `migrate.js`, tracked in `schema_migrations` table
- **DB connection** (`db/connection.js`): PostgreSQL pool configured from `.env`

### Frontend (`client/`)
- **Entry**: `src/main.jsx` — BrowserRouter + AuthProvider wrapping App
- **Routing** (`App.jsx`): `/` (Home, protected), `/login`, `/register`
- **Auth state** (`contexts/AuthContext.jsx`): React Context providing `user`, `loading`, `redirectUrl`; fetches `/api/auth/me` on mount
- **Protected pages**: Use `useRequireUser()` hook which redirects to `/login` if unauthenticated

### Database
PostgreSQL with two tables: `users` (username, email, password_hash) and `sessions` (session_id UUID, user_id FK). Session-based auth using HTTP-only cookies with 7-day expiry. Passwords hashed with bcrypt (10 salt rounds).

## Environment Setup

Copy `.env.example` to `.env` and configure: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `PORT` (Express, default 3000), `VITE_ORIGIN` (default `http://localhost:5173`).

## Key Conventions

- ES Modules throughout (`"type": "module"` in package.json)
- No TypeScript — plain JavaScript with JSX
- Single root `package.json` for both client and server dependencies
