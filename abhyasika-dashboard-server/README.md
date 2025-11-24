# Abhyasika Dashboard Backend

Express.js API layer for the Abhyasika study room management dashboard.  
Relies on Supabase (PostgreSQL + Auth) and Express to provide secure endpoints for plans, students, seats, and payments.

## Prerequisites

- Node.js 18.17 or newer
- Supabase project with tables: `plans`, `students`, `seats`, `payments`
- Supabase Auth enabled (admins are invited through Supabase)
- Supabase service role key (used server-side only)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` by copying the example and populate values:

   ```bash
   cp .env.example .env
   ```

   Required variables:

   - `SUPABASE_URL` – your Supabase instance URL
   - `SUPABASE_SERVICE_ROLE_KEY` – service role key (keep secret)
   - `PORT` (optional, defaults to `4000`)
   - `LOG_LEVEL` (optional, defaults to `info`)

3. Start the development server:

   ```bash
   npm run dev
   ```

   Or run in production mode:

   ```bash
   npm start
   ```

API becomes available at `http://localhost:4000/api`.

## Authentication Flow

- Admins are managed through Supabase Auth. Invite users via the Supabase dashboard; they sign in with the emailed link and password.
- The frontend obtains the Supabase access token and sends it with every request: `Authorization: Bearer <token>`.
- The backend validates the token with Supabase before allowing access to protected routes—no separate `admins` table or custom JWT handling required.

## Endpoints

| Method | Path                             | Description                                     |
| ------ | -------------------------------- | ----------------------------------------------- |
| GET    | `/health`                        | Health check                                    |
| GET    | `/api/plans`                    | List plans                                      |
| GET    | `/api/students`                 | List students (filters: `search`, `is_active`)  |
| POST   | `/api/students`                 | Create student                                  |
| PUT    | `/api/students/:id`             | Update student                                  |
| PATCH  | `/api/students/:id/toggle-active` | Toggle active state                           |
| GET    | `/api/seats`                    | List seats with occupant info                   |
| POST   | `/api/seats/:id/assign`         | Assign seat (`{ studentId }`)                   |
| POST   | `/api/seats/:id/deallocate`     | Deallocate seat                                 |
| GET    | `/api/payments`                 | List payments (`limit`, `startDate`, `endDate`) |
| POST   | `/api/payments`                 | Create payment and update student plan          |
| GET    | `/api/settings`                 | Fetch admin-specific workspace settings         |
| PUT    | `/api/settings`                 | Update admin-specific workspace settings        |
| GET    | `/api/expenses`                 | List expenses for the authenticated admin       |
| POST   | `/api/expenses`                 | Create a new expense entry                      |

Responses follow `{ data: ... }` or `{ error: { message, status } }` structure.

## Notes

- Create an `admin_settings` table to store preferences synced from the dashboard settings screen, for example:

  ```sql
  create table if not exists admin_settings (
    admin_id uuid primary key references auth.users (id) on delete cascade,
    preferences jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  );
  ```

- Ensure Supabase Row Level Security is configured so the service role key can access the required tables (including `admin_settings`).
- The `students` table should include extended fields referenced by the UI (`aadhaar`, `pan_card`, `address`, `fee_plan_type`, `fee_cycle`, `limited_days`, `registration_paid`, `preferred_shift`). Update your schema accordingly, for example:

  ```sql
  alter table students
    add column if not exists aadhaar text,
    add column if not exists pan_card text,
    add column if not exists address text,
    add column if not exists fee_plan_type text default 'monthly',
    add column if not exists fee_cycle text default 'calendar',
    add column if not exists limited_days integer,
    add column if not exists registration_paid boolean default false,
    add column if not exists preferred_shift text default 'Morning';
  ```

- Track housekeeping/rent spends by creating an `expenses` table:

  ```sql
  create table if not exists expenses (
    id uuid primary key default uuid_generate_v4(),
    admin_id uuid references auth.users(id) on delete cascade,
    title text not null,
    category text not null default 'misc',
    amount numeric not null,
    paid_via text not null default 'cash',
    expense_date date not null default now(),
    notes text
  );
  ```

- Ensure the service role has access to `expenses` if Row Level Security is enabled.
- The payment creation endpoint automatically updates the student's current plan and renewal date.
- Adjust CORS configuration in `src/app.js` if you need to restrict origins.
- Payments now capture `payment_mode`, `includes_registration`, and optional `notes`. Ensure these columns exist on the `payments` table so the API can persist them.
