# Retain

A personal expense and budget manager. You log what you spend, set a budget for the month, and Retain
shows you where the money is going and whether you're on track. Admins get a separate area for managing
categories and seeing how the whole platform is being used.

**Live app:** _add your deployed URL here once it is live_
**API:** _add your deployed API URL here_ (`/api/health` should answer `{"status":"ok"}`)

| Demo account | Email | Password |
| --- | --- | --- |
| Admin | `admin@retain.app` | `Admin123!` |
| Regular user (after `npm run seed`) | `demo@retain.app` | `Demo1234` |

---

## Main features

**For everyone who signs up**

- Sign up, sign in, sign out. The session survives a refresh and ends by itself when the token expires.
- Add, view, edit and delete expenses (title, amount, category, date, payment method, optional notes).
- Search by title or notes, filter by category, payment method, date range and amount range, and sort by
  date or amount. Results are paginated.
- Set a budget for any month. Retain shows spent, remaining and a status: **within**, **approaching**
  (80% or more used) or **over** budget.
- A dashboard for the chosen month: total spent, remaining budget, highest expense, spending by category
  (donut chart) and recent expenses.
- Works on phones: the sidebar becomes a drawer and the expense table becomes tappable cards.

**For admins only**

- Create, rename, recolour and delete expense categories. Deleting a category never loses data: its
  expenses are moved to the protected **Uncategorized** category inside a single transaction.
- Platform insights: registered users, expenses recorded, total value, expenses this month, spending per
  category, top 5 and bottom 5 categories by use, recent expenses and recent sign-ups.

## Technologies

| Part | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Material UI, React Router, Redux Toolkit |
| Backend | Node.js 20+, Express 5, PostgreSQL (`pg`), JWT, bcrypt, zod, helmet |
| Hosting | Render blueprint included (`render.yaml`) |

## How the pieces fit

```
frontend/src
  context/AuthContext.tsx   all authentication state: user, role, signIn / signUp / signOut
  components/common/ProtectedRoute.tsx   route guards that read that context
  store/filtersSlice.ts     all search, filter, sort and page state (Redux)
  hooks/useExpenses.ts      turns the Redux filters into an API request
  api/                      typed fetch client, one function per endpoint
  pages/ , components/      screens and reusable pieces
backend/src
  routes/                   auth, expenses, budgets, categories, dashboard, admin
  middleware/               JWT auth, admin check, central error handler
  schemas.js                zod validation for every request
  setup.js                  creates tables, default categories and the admin on startup
```

Two decisions worth knowing about:

- **Authentication is React Context only, filtering is Redux only.** Nothing else touches either concern.
- **The server never trusts the client for permissions.** The user is re-read from the database on every
  request, every expense and budget query is scoped to the signed-in user's id, and the whole `/api/admin`
  router sits behind an admin check. The React route guards are for experience, the API is the real lock.

## Running it locally

You need Node 20 or newer and a PostgreSQL database.

```bash
# 1. Database
createdb retain

# 2. Backend
cd backend
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npm install
npm run seed                # optional: demo user with three months of data
npm run dev                 # API on http://localhost:4000

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev                 # app on http://localhost:5173
```

The tables, default categories and the admin account are created automatically the first time the API
starts. In development the Vite dev server forwards `/api` to port 4000, so there is nothing to configure
on the frontend.

### Environment variables

Backend (`backend/.env`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs login tokens. **Required in production** |
| `CLIENT_URL` | Frontend origin(s) allowed by CORS, comma separated |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | The admin created on first start |
| `DATABASE_SSL` | Set to `false` if your production database does not use SSL |

Frontend (set at build time):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Full URL of the API including `/api`, for production builds |
| `VITE_CURRENCY` | ISO currency code for display, for example `ZAR`. Defaults to `USD` |

## Deploying

`render.yaml` describes a PostgreSQL database, the API as a web service and the frontend as a static site.

1. Push the repository to GitHub.
2. In Render choose **New > Blueprint** and select the repository.
3. When prompted, set `CLIENT_URL` to the frontend's URL and `VITE_API_URL` to `<api url>/api`
   (Render shows both URLs after the first deploy, so you may need to fill them in and redeploy once).
4. Put the two live URLs at the top of this README.

## API reference

All routes live under `/api`. Everything except `/auth/register`, `/auth/login` and `/health` needs an
`Authorization: Bearer <token>` header. Errors come back as `{ "message": "..." }`, and validation failures (400) also include `"errors": { "field": "what is wrong" }` so forms can highlight the right inputs.

| Method and path | Who | What it does |
| --- | --- | --- |
| `GET /health` | public | Liveness check |
| `POST /auth/register` | public | Create an account (always role `user`), returns `{ token, user }` |
| `POST /auth/login` | public | Sign in, returns `{ token, user }` |
| `GET /auth/me` | user | The signed-in user, used to restore a session |
| `GET /categories` | user | All categories, for pickers and filters |
| `GET /expenses` | user | Own expenses, see query options below |
| `POST /expenses` | user | Create an expense |
| `GET /expenses/:id` | user | One expense (404 if it is not yours) |
| `PUT /expenses/:id` | user | Update an expense (404 if it is not yours) |
| `DELETE /expenses/:id` | user | Delete an expense (404 if it is not yours) |
| `GET /budgets` | user | Every budget you have set |
| `GET /budgets/:month` | user | Budget, spent, remaining and status for `YYYY-MM` |
| `PUT /budgets/:month` | user | Create or update that month's budget, body `{ amount }` |
| `DELETE /budgets/:month` | user | Remove that month's budget |
| `GET /dashboard?month=YYYY-MM` | user | Everything the dashboard needs in one response |
| `GET /admin/categories` | admin | Categories with expense counts |
| `POST /admin/categories` | admin | Create a category, body `{ name, color }` |
| `PUT /admin/categories/:id` | admin | Rename or recolour (the default cannot be renamed) |
| `DELETE /admin/categories/:id` | admin | Delete, moving its expenses to Uncategorized |
| `GET /admin/insights` | admin | Platform-wide numbers and lists |

`GET /expenses` query options: `search`, `categoryId`, `paymentMethod` (`cash`, `card`, `mobile_money`,
`bank_transfer`, `other`), `dateFrom`, `dateTo`, `minAmount`, `maxAmount`, `sortBy` (`date` or `amount`),
`sortOrder` (`asc` or `desc`), `page` and `limit` (max 100). The response contains `data`, `pagination`
and `filteredTotal`, the sum of everything matching the filters, not just the current page.

Status codes: `400` validation, `401` missing or bad token, `403` not an admin, `404` not found
(including other people's expenses), `409` duplicate email or category name.

## Database

Four tables: `users`, `categories`, `expenses`, `budgets`. Money is stored as `NUMERIC(12,2)`, dates as
`DATE`, a budget is unique per user and month, and exactly one category can be flagged as the default.
The schema is in `backend/src/setup.js`.

## app link

[![Retain](https://retain-ruddy.vercel.app)](