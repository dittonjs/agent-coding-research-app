# Starter Code - React + Express + PostgreSQL

This is a starter project with a working user authentication system. It uses React (via Vite) for the frontend, Express for the backend API, and PostgreSQL for the database.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a PostgreSQL database

Open `psql` as your superuser and run:

```sql
CREATE USER assignment4 WITH PASSWORD 'yourpasswordhere';
CREATE DATABASE assignment4 WITH OWNER assignment4;
```

You can use whatever names you want for the user and database.

### 3. Configure environment variables

Copy the example env file and fill in your database credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your values:

```
DB_HOST=localhost
DB_USER=assignment4
DB_PASSWORD=yourpasswordhere
DB_NAME=assignment4
DB_PORT=5432
PORT=3000
VITE_ORIGIN=http://localhost:5173
```

### 4. Run database migrations

```bash
npm run migrate
```

This creates the `users` and `sessions` tables. When you add your own migration files to `server/migrations/`, run this command again to apply them.

### 5. Start the development servers

You need **two terminals** running at the same time:

**Terminal 1 - Express backend:**
```bash
npm run server-dev
```

**Terminal 2 - Vite frontend:**
```bash
npm run client-dev
```

### 6. Open the app

Go to **http://localhost:3000** in your browser. This is the Express server, which serves the HTML page and loads the React app from the Vite dev server.

Do **not** open the Vite URL (port 5173) directly. Always use the Express URL so that API calls and cookies work correctly.

## What's Included

### Backend (`server/`)
- `server.js` - Express app with middleware and route mounting
- `db/connection.js` - PostgreSQL connection pool
- `migrate.js` - Migration runner (reads SQL files from `migrations/`)
- `migrations/` - SQL migration files (001_users.sql, 002_sessions.sql)
- `controllers/auth.js` - Registration, login, logout, and current user endpoints
- `models/users.js` - User and session database functions
- `middleware/auth.js` - `loadUser` (attaches user to every request) and `requireAuth` (returns 401 if not logged in)

### Frontend (`client/src/`)
- `main.jsx` - React entry point with BrowserRouter and AuthProvider
- `App.jsx` - Root component with routes
- `contexts/AuthContext.jsx` - React context for global auth state (user, redirectUrl)
- `hooks/useRequireUser.js` - Custom hook that returns the user or redirects to login
- `components/Navbar.jsx` - Navigation bar
- `pages/Login.jsx` - Login page
- `pages/Register.jsx` - Registration page
- `pages/Home.jsx` - Home page (requires login)

## Auth API Endpoints

These are already implemented and working:

- `POST /api/auth/register` - Create account (sets session cookie)
- `POST /api/auth/login` - Log in (sets session cookie)
- `POST /api/auth/logout` - Log out (clears session cookie)
- `GET /api/auth/me` - Get current logged-in user (or null)

## Adding Your Own Code

- **New migration files** go in `server/migrations/` (e.g. `003_polls.sql`). Run `npm run migrate` to apply them.
- **New API routes** go in `server/controllers/`. Create a router file and mount it in `server.js`.
- **New database functions** go in `server/models/`.
- **New React pages** go in `client/src/pages/`. Add routes for them in `App.jsx`.
- **New React components** go in `client/src/components/`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run server-dev` | Start the Express server with auto-restart on changes |
| `npm run client-dev` | Start the Vite dev server for React |
| `npm run migrate` | Run database migrations |
