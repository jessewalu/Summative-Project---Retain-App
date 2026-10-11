# Retain: pitch walkthrough

About 8 to 10 minutes. The order follows the marking rubric, so every section earns points as you go.

## Before you start (2 minutes of prep)

1. Start Postgres, then in `backend/` run `npm run seed` and `npm run dev`.
2. In `frontend/` run `npm run dev` and open http://localhost:5173 (or use your live URL).
3. Open two windows: one signed in as `demo@retain.app` / `Demo1234`, one as `admin@retain.app` / `Admin123!`.
4. Have the code editor open on `AuthContext.tsx` and `filtersSlice.ts`. Markers will ask about them.

## 1. The problem (30 seconds)

"Most people only find out they overspent when the month is over. Retain lets you log spending quickly,
set a monthly budget, and see at a glance whether you are within, approaching or over it."

## 2. The user's view (3 minutes)

- **Dashboard.** Point at the four cards (spent, remaining, highest expense, top category), the budget bar
  with its status chip, and the donut. Flip the month with the arrows to show it is not hard-coded.
- **Add an expense.** Click Add expense, submit it empty to show the validation, then fill it in properly.
  Watch the dashboard numbers and the budget bar move.
- **Expenses page.** Search for "coffee". Open Filters, pick a category and a date range, sort by highest
  amount, change the page size. Say out loud: "all of this is Redux state, and the page just reads it."
- **Edit and delete.** Edit one, delete one (point out the confirmation).
- **Budget page.** Lower the budget below what has been spent and show the status flip to **over**.
- **Phone view.** Shrink the window (or use the browser's device mode). The sidebar becomes a drawer and the
  table becomes cards.

## 3. The admin's view (2 minutes)

- Switch to the admin window. **Platform insights:** users, expenses, total value, this month, spending per
  category, top 5 and bottom 5, recent expenses and sign-ups.
- **Categories:** add "Pets", then log an expense in it as the demo user, then delete "Pets" as admin.
  Show that the expense still exists and is now under **Uncategorized**. This answers the brief's question
  about what happens to a deleted category's expenses.
- Back in the demo window, try typing `/admin` in the address bar. You land on the 403 page.

## 4. Under the hood (2 minutes)

Keep this short and confident. Three points, one file each.

1. **Authentication is React Context.** `AuthContext.tsx` holds the user, role and the sign-in, sign-up and
   sign-out actions. `ProtectedRoute.tsx` has three guards built on it: signed-in only, role only, and
   public-only for the login pages.
2. **Filtering is Redux.** `filtersSlice.ts` holds search, category, payment method, dates, amounts, sort and
   page. `useExpenses.ts` reads that state and asks the API for exactly that.
3. **The API is the real lock.** The React guards are for experience. On the server every expense and
   budget query includes the signed-in user's id, and the whole `/api/admin` router sits behind an admin
   check. If asked how you know it works: "I tested that one user cannot read, edit or delete another
   user's expense, and that a normal user gets a 403 on every admin route."

## 5. Close (30 seconds)

"Retain is a React and TypeScript front end on an Express and PostgreSQL API, deployed and documented, with
the full history on GitHub. Next steps I would add are recurring expenses, CSV export and budget alerts."

## Questions you might get

| Question | Short answer |
| --- | --- |
| Why Redux for filters but Context for auth? | The brief asked for that split, and it fits: auth changes rarely and is read everywhere, filters change constantly and many components read parts of them. |
| How are passwords stored? | Hashed with bcrypt. The API never returns the hash. |
| Can someone make themselves admin? | No. The role is never read from a sign-up request, public sign-ups are always `user`. |
| What if a token is stolen or expires? | Tokens expire. A 401 from any call signs the user out automatically. |
| What stops SQL injection? | Every value is passed as a query parameter, and sort fields come from a fixed list. |
| How does pagination work? | The server takes `page` and `limit`, returns the total count and the sum of everything matching the filters. |
| What would you improve? | Refresh tokens, automated tests, recurring expenses and CSV export. |

## If something goes wrong live

- **Blank charts:** you forgot `npm run seed`. Run it and refresh.
- **"Network error" on every page:** the API is not running. Check `http://localhost:4000/api/health`.
- **Sign-in fails after a database reset:** the admin is recreated on API start, so restart the API.
