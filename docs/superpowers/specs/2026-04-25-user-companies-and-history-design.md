# User Self-Service: Company Creation and Personal PDF History

**Date:** 2026-04-25
**Status:** Approved (pending local testing)

## Goal

Extend the PDF generator so regular users (role `USER`) can:

1. Create new companies (currently admin-only).
2. View their own PDF generation history (currently only admins see history).

Admins continue to see all users' history and remain the only role allowed to delete companies.

## Non-Goals

- Audit logs / activity tracking
- User-side editing or deletion of companies
- Company ownership (`createdBy`) attribution
- New roles (Manager, Viewer)
- User management UI
- Schema migrations or data backfills

## Constraints

- **No data loss.** No existing rows must be deleted, modified, or migrated.
- **No schema changes.** `User`, `Company`, `PdfHistory` remain as-is.
- **No regression** in admin functionality. Existing admin endpoints and `/admin` page must behave identically.

## Architecture Decisions

### 1. Companies remain shared (no ownership)

Every authenticated user sees every company in the dropdown. We do not add a `createdBy` field to `Company`. This avoids a migration on existing rows and matches existing UX (companies are global business entities, not personal data).

### 2. Endpoint split (admin vs. non-admin) is preserved

- `/api/admin/*` continues to be admin-only and unchanged.
- New non-admin endpoints (`/api/history`, `/api/pdf/[id]`) are added next to existing `/api/companies`.
- This avoids role-aware branching inside endpoints and keeps the admin attack surface mentally separate.

### 3. Non-admin endpoints scope by session userId

Non-admin endpoints **always** derive `userId` from the session. They **never** accept it as a query parameter. Any `userId` query value sent by the client is silently ignored.

## API Changes

### Modified

**`POST /api/companies`** (new method on existing route)
- Auth: any authenticated user.
- Body: `{ name: string, taxId: string }`.
- Validation: both required, trimmed, `name` ≤ 255, `taxId` ≤ 50 (matches existing admin POST).
- Response: created `Company`.

`GET /api/companies` is unchanged (already accessible to any authenticated user).

### New

**`GET /api/history`**
- Auth: any authenticated user.
- Query params: `search`, `dateFrom`, `dateTo`, `type`, `page` (same semantics as admin history).
- **Does not accept `userId`.** Filter is hard-coded to `session.user.id`.
- Response shape: `{ items, total, pages, page }`. **Does not** include the `users` list (admin-only data).

**`GET /api/pdf/[id]`**
- Auth: any authenticated user.
- Returns the rendered PDF or `?mode=html` preview for a single `PdfHistory` record.
- Authorization: `record.userId === session.user.id`. If the record belongs to another user, respond **404 Not Found** (not 403, to avoid leaking ID existence).
- PDF/HTML rendering logic mirrors `/api/admin/pdf/[id]` (same puppeteer args, same `waitUntil: "networkidle0"`, same HTML centering injection). To preserve admin behavior 1:1 with zero risk of regression, the admin route is **not modified** — the rendering code is duplicated in the new route. Roughly 30 lines of overlap; acceptable to keep admin untouched.

### Unchanged

- `GET/POST/DELETE /api/admin/companies`
- `GET /api/admin/history`
- `GET /api/admin/pdf/[id]`
- `/api/auth/*`, `/api/generate`, `/api/next-invoice`, `/api/preview`

## Frontend Changes

### `app/page.tsx` (home)

- Show the history button for `USER` too, linking to `/history`.
- Admin link continues to point at `/admin`.
- Greeting ("მოგესალმებით, …") shown for both roles.

### `app/history/page.tsx` (new)

A simplified read-only history view for the current user:

- Sections: history list only (no companies tab).
- Filters: search, date from/to, type, pagination. **No** user filter dropdown.
- Columns: type, invoice number, file name, created at, actions (preview, download). **No** "user" column.
- Data source: `GET /api/history` and `GET /api/pdf/[id]`.
- Admins are not redirected away — they may use this page for their own quick view, but they continue to use `/admin` for the full overview.

### `app/[type]/page.tsx` (PDF form)

- Next to the existing company dropdown, add a small "+" button labeled "ახალი კომპანია".
- Click opens a modal with `name` and `taxId` inputs and a save button.
- Save calls `POST /api/companies`.
  - Success: close modal, refetch the dropdown list, auto-select the newly created company.
  - Error: show inline error inside the modal; modal stays open.
- No delete control is exposed to users.

### `middleware.ts`

- Add `/history` to the `matcher` array so it requires authentication.
- No role check needed — `/history` is open to any authenticated user.

## File Inventory

**New files:**
- `app/api/history/route.ts`
- `app/api/pdf/[id]/route.ts`
- `app/history/page.tsx`

**Modified files:**
- `app/api/companies/route.ts` — add `POST` handler
- `app/page.tsx` — show history link for `USER`
- `app/[type]/page.tsx` — add company creation modal
- `middleware.ts` — add `/history` to matcher

**Untouched:**
- `prisma/schema.prisma`
- `app/admin/page.tsx`
- All `app/api/admin/*` routes (including `app/api/admin/pdf/[id]/route.ts`)
- `lib/auth.ts`, `lib/prisma.ts`, `lib/pdf.ts`

## Security Invariants

1. Admin endpoints (`/api/admin/*`) reject non-admin sessions. This does not change.
2. Non-admin endpoints scope queries by `session.user.id` derived server-side. Client-supplied `userId` is ignored.
3. `/api/pdf/[id]` returns 404 (not 403) on cross-user access attempts.
4. Company deletion remains admin-only.

## Testing Plan (manual, local)

1. Existing admin flow: `/admin` history list, filters, preview, download, company create + delete — all unchanged.
2. As `USER`: open a PDF form, click "+", create a company. Verify it appears in the dropdown and is auto-selected.
3. As `USER`: generate a PDF. Visit `/history`. Verify the new entry appears.
4. As `USER`: verify only your own entries are visible — not other users'.
5. As `USER`: try `GET /api/history?userId=<other_user_id>`. Verify response still contains only your records.
6. As `USER`: try opening another user's PDF by ID directly. Verify 404.
7. As `USER`: try `POST /api/admin/companies`. Verify 401.
8. As `USER`: try navigating to `/admin`. Verify redirect to `/`.
9. Verify total `PdfHistory` row count before and after the change is unchanged for existing users.
10. Verify total `Company` row count is unchanged for pre-existing rows; new rows are additions only.

## Risk and Rollback

- **Schema risk:** none. No migration runs.
- **Endpoint regression risk:** low. Existing endpoints are not modified except for adding a new HTTP method to `/api/companies`.
- **Frontend regression risk:** low. Admin page is untouched. Home page gets a conditional link. PDF form gets an additive UI element.
- **Rollback:** delete the new files and revert four edited files. No DB rollback needed.

## Out of Scope (explicit)

These are intentionally not addressed and may be future work:

- Tracking which user created which company.
- Letting users edit or remove companies they created.
- Audit logging of PDF generation events beyond the existing `PdfHistory` table.
- A management UI for admins to create or modify users.
