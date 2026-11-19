# indlela — Claude Code project instructions

Frontend for **Indlela**, an SEO tool for agencies and SMEs in South Africa (Search Console quick wins, site audits, rank tracking, white-label reports). Ported from `../workforce-app` (same stack, structure and conventions; that repo is the reference for shared patterns: axios client, layouts, list pages, drawers, `src/index.css` tokens). Port established patterns from there rather than reinventing. The backend is `../indlela-api` (Laravel 13, Sail); its `docs/API.md` lists every route and the permission it needs.

Progress (built, PRs, next, waiting on other modules) lives in `docs/PROGRESS.md` (git-ignored dev notes, kept identical in `indlela` and `indlela-api`), updated with every module.

## Commands

Node ≥ 22.22 (React Router 8); `.nvmrc` pins 24. Needs a `.env` (copy `.env.example`); the API runs in Sail on `APP_PORT` (8000) → `VITE_API_URL=http://localhost:8000/api`.

```bash
npm run dev          # Vite on http://localhost:5173 (the API's FRONTEND_URL / CORS origin)
npm run build        # tsc -b && vite build; prebuild bumps the patch version (no git tag)
npx vitest run       # tests once (npm test = watch)
npm run lint
```

## Stack

React 19, TypeScript 6, Vite 8, React Router 8 (`react-router`, not `react-router-dom`), TanStack Query 5, React Hook Form + Zod 4, Tailwind 4 + shadcn/ui (new-york, `@/components/ui`), Axios, react-hot-toast, nprogress, Quill (email templates only), Vitest 5. Alias `@/*` → `src/*`.

## Architecture

- **One session store, no Redux.** `src/features/auth/session.ts` owns token/user/roles/permissions/workspace/workspaces in localStorage (`indlela_*` keys) and is the only source of truth for "signed in": route guards (`RequireAuth`, `RedirectIfSignedIn`), the axios client and the idle timer all read it; `useIsSignedIn()` re-renders on change, including other tabs. Server data lives in React Query.
- **Leaving the app goes through `RequireAuth`.** Sign-out calls `session.clear('signed_out')` and does NOT navigate; the guard redirects to `/login` with the "signed out" notice. Idle/401 use `session.clear()` (`expired`) and keep a returnUrl.
- **API client.** `createApiClient(baseURL)` (`src/api`) attaches the Bearer token and transforms bodies/params camelCase → snake_case and responses back (FormData is sent as is: write its keys snake_case). **Error bodies are not transformed**: read `error_type`, `attempts_left`, `retry_after` in snake_case (`features/auth/lib/authErrors.ts`). A 401 with a token clears the session and redirects once.
- **Sign-in contract.** `POST /login` → a session (`requiresMfa: false`) or a `PinChallenge`, then `POST /login/verify-pin`; `LoginPage`/`PinStep` branch on `error_type` (`account_locked`, `challenge_closed`, …). A session is workforce's `{user, token, roles, permissions}` plus `workspace` (current) and `workspaces` (each with the user's role). `GET /me` is the same without the token (+ `pinEnabled`). `POST /register` creates a workspace and signs in as its Owner.
- **Workspaces.** Roles, permissions and the user's clients are per workspace. The sidebar's `WorkspaceSwitcher` calls `POST /workspaces/{id}/switch` (same token, `/me` body back) via `useSwitchWorkspace`: it updates the session, **clears the whole query cache** (everything cached belonged to the old workspace), seeds `['me']` and goes to `/dashboard`.
- **Permissions.** `PermissionProvider` (`src/contexts/PermissionContextType.tsx`) wraps only `/dashboard`, seeded from the stored session and refreshed from `GET /me` once per page load. Per page: `{action}_{resource}`, actions `view|create|update|delete|approve`, one resource per sidebar item (`src/config/modules.ts` mirrors the API's `App\Support\Permissions`; keep them in step). `permissionFor(module, item)` opens a menu entry; `actionsOn(resource)` lists what the user may do. Gate each action separately (`create_clients_sites`, `delete_clients_sites`, …); guard pages with `<ProtectedRoute permission=…>` (every menu entry gets one in `routes/dashboard.tsx`), hide UI with `<PermissionGate>` / `hasPermission`. Pages not built yet render `ModulePlaceholder`. Owner-only (not grantable): users, roles, login history, workspace. The API enforces everything again; the FE only hides.
- **Client access.** Users whose role isn't Owner / "Sees every client" (`allClients`) are limited to the clients ticked on their user record; the API scopes lists, and `user.clients` (from `/me`) feeds the client pickers.
- **Idle logout.** `IdleTimer` (30 min, Web Worker `public/idleTimer.js`, 30 s warning).

## Conventions

- Feature folders `src/features/<feature>/{api,hooks,schemas,lib,components,pages}`. Components don't call axios; hooks wrap React Query.
- Forms: RHF + Zod (`zodResolver`); bind API 422s with `handleApiValidationError(error, form.setError)` (other errors toast the API's message). Password rules are shared (`features/auth/lib/passwordRules.ts`) between schemas and the live checklist, and match the API. Use `FormField` + `fieldAria()` for labelled, screen-reader-wired inputs.
- Dates dd/mm/yyyy (`src/utils/formatDate.ts`); SA cell numbers via `src/utils/saPhone.ts`; toasts via `showToaster(type, message)`.
- House style: radius `rounded`, largest heading `text-xl`, compact spacing. The base `ui/table.tsx` sets table density; tables stack as cards on mobile; row actions are `size-6` ghost icon buttons.
- Paginated lists default to **15 per page** (API and FE) via `Paginator` and `DEFAULT_PER_PAGE` (`src/types/pagination.ts`).
- Add/edit forms open in a **drawer** (`Sheet`), never a modal; Escape asks "Discard your changes?" once something changed. Dialogs are for confirmations only.
- List pages build on `components/table/DataTable` + `hooks/useListParams` + `useUrlSort` (state in the URL) with row selection and `ActiveBulkBar` (activate / deactivate / delete), `ActiveFilter` and `ActiveStatus`; see `features/clients` and `features/sites`. Audit trails like Login history get no selection.
- A page's **History** button uses `components/history/ChangeHistorySheet` fed by that page's `/…/history` endpoint, with a column → label map.
