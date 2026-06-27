# Bank Sampah Digital — Project Reference

## Project Overview

A web application to digitize the operations of a local waste bank (bank sampah) in Indonesia. The system has three zones:

- **Admin Panel** — For bank staff to manage prices, input deposits, handle withdrawal requests, manage members, publish news, and export monthly reports.
- **Member Zone** — For registered members to monitor their deposit history, check their balance, and request cash withdrawals.
- **News Portal** — Public-facing page showing current waste prices and general announcements. No login required.

---

## Tech Stack

| Layer                  | Technology                              |
| ---------------------- | --------------------------------------- |
| Frontend               | React 18 + TypeScript                   |
| Build Tool             | Vite                                    |
| Styling                | TailwindCSS                             |
| Backend                | Supabase (PostgreSQL + Auth + Realtime) |
| State Management       | Zustand                                 |
| Server State / Caching | TanStack React Query                    |
| Forms & Validation     | React Hook Form + Zod                   |
| Routing                | React Router v6                         |
| Notifications (UI)     | react-hot-toast                         |
| Date Utilities         | date-fns                                |
| Excel Export           | SheetJS (xlsx)                          |
| Icons                  | lucide-react                            |

---

## Authentication

- **Method**: Email + password via Supabase Auth (NOT phone-OTP — earlier design changed during build).
- **Signup**: `supabase.auth.signUp({ email, password })` with `full_name`/`role` metadata. Phone number is collected separately afterward via `CompleteProfile.tsx`, not at signup.
- **Login**: two tabs — by email (`signInWithEmail`) or by phone (`signInWithPhone`, which RPC-looks-up the email by phone via `get_email_by_phone`, then signs in with email+password). Both end at the same email/password auth.
- Email verification is required after signup (the app shows a "Verifikasi Email" screen).
- Role (`admin` or `member`) is stored in the `profiles` table and determines which layout/routes are accessible. Role is detected after session is established.

### Duplicate-email handling (important Supabase gotcha)

Supabase returns a **fake-success** from `signUp()` when the email is already registered (anti-enumeration). It does NOT throw and does NOT insert a new `auth.users` row — so the `handle_new_user` trigger never fires for this case, meaning **the database/trigger cannot detect it**. Detection must happen client-side: after `signUp()`, check `result.user && result.user.identities?.length === 0` → already registered. This is implemented in `onSignup` in `LoginPage.tsx`. (Alternatively, "Prevent email enumeration" can be disabled in Supabase Auth settings to make `signUp` throw a real error, at the cost of enumeration protection.)

### profiles auto-creation (phone_number must be NULL, not '')

A trigger (`handle_new_user`) creates the `profiles` row on new `auth.users` insert. Because email signup has no phone yet, the trigger must insert `phone_number = NULL` (via `NULLIF(... , '')`), NOT an empty string — `phone_number` is `UNIQUE`, and Postgres allows multiple NULLs but only one `''`. Inserting `''` caused every signup after the first to fail with `duplicate key value violates unique constraint "profiles_phone_number_key"`.

---

## Folder Structure

```
src/
├── components/
│   ├── common/          # Shared UI: Header, Sidebar, Button, Modal, Toast, etc.
│   ├── admin/
│   │   ├── PriceManagement/
│   │   ├── MemberManagement/
│   │   ├── WithdrawalManagement/
│   │   ├── NewsManagement/
│   │   └── Reports/
│   ├── member/
│   │   ├── DepositHistory/
│   │   ├── WithdrawalFlow/   # Multi-step: Step1_SelectDeposits, Step2_SelectMethod, Step3_Review
│   │   └── WithdrawalHistory/
│   └── public/          # News portal, price display, homepage
├── pages/               # LoginPage, AdminLayout, MemberLayout, PublicLayout, NotFoundPage
├── hooks/               # useAuth, useDeposits, usePrices, useWithdrawal, useNotifications, useOffline
├── services/            # auth.service.ts, deposit.service.ts, price.service.ts, withdrawal.service.ts, etc.
├── context/             # AuthContext, NotificationContext
├── types/               # index.ts — all TypeScript interfaces
├── utils/               # formatters.ts, validators.ts, constants.ts, excelExporter.ts
├── lib/                 # supabase.ts (Supabase client singleton)
└── constants/           # App-wide constants
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values come from Supabase Dashboard → Settings → API.

---

## Supabase Client

Located at `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Database Schema

### `profiles`

Extends `auth.users`. Created automatically after OTP login.

| Column       | Type        | Notes                 |
| ------------ | ----------- | --------------------- |
| id           | UUID (PK)   | References auth.users |
| phone_number | TEXT UNIQUE | Format: +62...        |
| full_name    | TEXT        |                       |
| role         | TEXT        | `admin` or `member`   |
| is_active    | BOOLEAN     | Default true          |
| created_at   | TIMESTAMPTZ |                       |
| updated_at   | TIMESTAMPTZ |                       |

---

### `bank_accounts`

Multiple bank accounts per member (optional, used for transfer withdrawals).

| Column         | Type                 | Notes                  |
| -------------- | -------------------- | ---------------------- |
| id             | UUID (PK)            |                        |
| user_id        | UUID (FK → profiles) |                        |
| bank_name      | TEXT                 | e.g. BCA, BRI, Mandiri |
| account_number | TEXT                 | Encrypted at app level |
| account_holder | TEXT                 |                        |
| is_default     | BOOLEAN              | Default false          |
| created_at     | TIMESTAMPTZ          |                        |

---

### `trash_types`

Hierarchical: category → name.

| Column      | Type        | Notes                             |
| ----------- | ----------- | --------------------------------- |
| id          | UUID (PK)   |                                   |
| category    | TEXT        | e.g. Plastik, Kertas, Logam, Kaca |
| name        | TEXT        | e.g. Botol Plastik, Kardus        |
| description | TEXT        | Optional                          |
| is_accepted | BOOLEAN     | Whether currently accepted        |
| created_at  | TIMESTAMPTZ |                                   |
| updated_at  | TIMESTAMPTZ |                                   |

---

### `trash_prices`

History of prices per trash type. Only one active price per trash type at a time.

| Column         | Type                    | Notes                          |
| -------------- | ----------------------- | ------------------------------ |
| id             | UUID (PK)               |                                |
| trash_type_id  | UUID (FK → trash_types) |                                |
| price_per_kg   | DECIMAL(12,2)           | In IDR                         |
| effective_date | DATE                    | Date price became active       |
| is_active      | BOOLEAN                 | Only one active per trash_type |
| created_by     | UUID (FK → profiles)    | Admin who set it               |
| created_at     | TIMESTAMPTZ             |                                |

When admin updates a price, the old record is set `is_active = false` and a new record is inserted.

---

### `deposits`

Each deposit record = one trash type weighed on one visit.

| Column        | Type                    | Notes                      |
| ------------- | ----------------------- | -------------------------- |
| id            | UUID (PK)               |                            |
| member_id     | UUID (FK → profiles)    |                            |
| trash_type_id | UUID (FK → trash_types) |                            |
| weight_kg     | DECIMAL(10,3)           |                            |
| price_per_kg  | DECIMAL(12,2)           | Locked at time of deposit  |
| total_rupiah  | DECIMAL(12,2)           | weight_kg × price_per_kg   |
| deposit_date  | DATE                    |                            |
| is_withdrawn  | BOOLEAN                 | Default false              |
| notes         | TEXT                    | Optional                   |
| created_by    | UUID (FK → profiles)    | Admin/petugas who input it |
| created_at    | TIMESTAMPTZ             |                            |

**Important**: `price_per_kg` is copied at deposit time, not referenced. This means price changes do not affect past deposits.

---

### `member_balances`

Denormalized for fast balance lookups. One row per member.

| Column          | Type                         | Notes                      |
| --------------- | ---------------------------- | -------------------------- |
| id              | UUID (PK)                    |                            |
| member_id       | UUID (FK → profiles, UNIQUE) |                            |
| total_balance   | DECIMAL(12,2)                | Current unwithrawn balance |
| total_withdrawn | DECIMAL(12,2)                | Lifetime withdrawn         |
| last_updated    | TIMESTAMPTZ                  |                            |

Updated automatically via database triggers (not from frontend).

---

### `withdrawal_requests`

| Column            | Type                      | Notes                                |
| ----------------- | ------------------------- | ------------------------------------ |
| id                | UUID (PK)                 |                                      |
| member_id         | UUID (FK → profiles)      |                                      |
| status            | TEXT                      | `pending`, `completed`, `cancelled`  |
| withdrawal_type   | TEXT                      | `manual` or `bank_transfer`          |
| total_amount      | DECIMAL(12,2)             |                                      |
| selected_deposits | UUID[]                    | Array of deposit IDs to be withdrawn |
| bank_account_id   | UUID (FK → bank_accounts) | Optional, for transfer               |
| notes             | TEXT                      | Optional                             |
| completed_by      | UUID (FK → profiles)      | Admin who processed it               |
| completed_at      | TIMESTAMPTZ               |                                      |
| created_at        | TIMESTAMPTZ               |                                      |
| updated_at        | TIMESTAMPTZ               |                                      |

---

### `notifications`

In-app only. No SMS or email.

| Column            | Type                 | Notes                                                                             |
| ----------------- | -------------------- | --------------------------------------------------------------------------------- |
| id                | UUID (PK)            |                                                                                   |
| user_id           | UUID (FK → profiles) |                                                                                   |
| title             | TEXT                 |                                                                                   |
| message           | TEXT                 |                                                                                   |
| type              | TEXT                 | `deposit_created`, `withdrawal_requested`, `withdrawal_completed`, `price_update` |
| related_record_id | UUID                 | Optional reference                                                                |
| is_read           | BOOLEAN              | Default false                                                                     |
| created_at        | TIMESTAMPTZ          |                                                                                   |

---

### `news`

| Column       | Type                 | Notes                                             |
| ------------ | -------------------- | ------------------------------------------------- |
| id           | UUID (PK)            |                                                   |
| title        | TEXT                 |                                                   |
| content      | TEXT                 |                                                   |
| type         | TEXT                 | `announcement`, `price_update`, `tips`, `general` |
| created_by   | UUID (FK → profiles) |                                                   |
| published_at | TIMESTAMPTZ          |                                                   |
| created_at   | TIMESTAMPTZ          |                                                   |

---

### `audit_logs`

Immutable. Records all sensitive operations.

| Column     | Type                 | Notes                                          |
| ---------- | -------------------- | ---------------------------------------------- |
| id         | UUID (PK)            |                                                |
| user_id    | UUID (FK → profiles) |                                                |
| action     | TEXT                 | e.g. `deposit_created`, `withdrawal_completed` |
| table_name | TEXT                 |                                                |
| record_id  | UUID                 |                                                |
| old_values | JSONB                |                                                |
| new_values | JSONB                |                                                |
| ip_address | TEXT                 | Optional                                       |
| created_at | TIMESTAMPTZ          |                                                |

---

## Row Level Security (RLS) Summary

| Table               | Public | Member               | Admin     |
| ------------------- | ------ | -------------------- | --------- |
| profiles            | ✗      | Own row only         | All rows  |
| bank_accounts       | ✗      | Own rows only        | Read all  |
| trash_types         | Read   | Read                 | Full CRUD |
| trash_prices        | Read   | Read                 | Full CRUD |
| deposits            | ✗      | Own rows (read)      | Full CRUD |
| member_balances     | ✗      | Own row (read)       | Full CRUD |
| withdrawal_requests | ✗      | Own rows, can INSERT | Full CRUD |
| notifications       | ✗      | Own rows             | Full CRUD |
| news                | Read   | Read                 | Full CRUD |
| audit_logs          | ✗      | ✗                    | Read only |

Helper function used in policies:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Database Triggers

### 1. `on_member_created`

After INSERT on `profiles` where role = `member`:
→ Auto-creates a `member_balances` row with zero balance.

### 2. `on_deposit_created`

After INSERT on `deposits`:
→ Increments `member_balances.total_balance` by `total_rupiah`.

### 3. `on_withdrawal_completed`

After UPDATE on `withdrawal_requests` where `status` changes to `completed`:
→ Sets all `selected_deposits` records to `is_withdrawn = true`
→ Decrements `member_balances.total_balance` by `total_amount`
→ Increments `member_balances.total_withdrawn` by `total_amount`
→ Inserts a `notifications` record for the member

---

## TypeScript Interfaces

Located at `src/types/index.ts`:

```typescript
export interface Profile {
	id: string;
	phone_number: string;
	full_name: string;
	role: "admin" | "member";
	is_active: boolean;
	created_at: string;
}

export interface TrashType {
	id: string;
	category: string;
	name: string;
	description?: string;
	is_accepted: boolean;
}

export interface TrashPrice {
	id: string;
	trash_type_id: string;
	price_per_kg: number;
	effective_date: string;
	is_active: boolean;
}

export interface Deposit {
	id: string;
	member_id: string;
	trash_type_id: string;
	weight_kg: number;
	price_per_kg: number;
	total_rupiah: number;
	deposit_date: string;
	is_withdrawn: boolean;
	notes?: string;
	created_by: string;
	created_at: string;
	trash_type?: TrashType;
}

export interface MemberBalance {
	member_id: string;
	total_balance: number;
	total_withdrawn: number;
	last_updated: string;
}

export interface WithdrawalRequest {
	id: string;
	member_id: string;
	status: "pending" | "completed" | "cancelled";
	withdrawal_type: "manual" | "bank_transfer";
	total_amount: number;
	selected_deposits: string[];
	bank_account_id?: string;
	notes?: string;
	created_at: string;
	completed_at?: string;
	completed_by?: string;
}

export interface BankAccount {
	id: string;
	user_id: string;
	bank_name: string;
	account_number: string;
	account_holder: string;
	is_default: boolean;
}

export interface Notification {
	id: string;
	user_id: string;
	title: string;
	message: string;
	type: "deposit_created" | "withdrawal_requested" | "withdrawal_completed" | "price_update";
	related_record_id?: string;
	is_read: boolean;
	created_at: string;
}

export interface News {
	id: string;
	title: string;
	content: string;
	type: "announcement" | "price_update" | "tips" | "general";
	published_at: string;
	created_at: string;
}
```

---

## Business Rules

1. **Deposit input** is only allowed by admin/petugas. Members cannot self-report.
2. **Price is locked at deposit time** — `price_per_kg` is copied from `trash_prices` at insert, not referenced. Past deposit values never change.
3. **Withdrawal cooldown** — Member cannot submit a new withdrawal request within 2 days of their last request.
4. **Withdrawal processing** — Admin processes one withdrawal at a time (no bulk approve).
5. **Withdrawal type**:
   - `manual` — Member comes in person. Admin marks complete after handing over cash.
   - `bank_transfer` — Admin manually transfers the money, then marks complete in the system.
6. **Member balance** is always computed from triggers, never updated directly from frontend.
7. **Deposits become non-withdrawable** once `is_withdrawn = true`. Only deposits where `is_withdrawn = false` appear in withdrawal flow.
8. **Multiple bank accounts** per member are allowed. One can be set as `is_default`.

---

## Key User Flows

### Admin: Input Deposit

1. Search member by phone or name
2. Select trash type (grouped by category in dropdown)
3. Input weight in kg
4. System auto-calculates `total_rupiah = weight × current active price`
5. Submit → inserts into `deposits` → trigger updates `member_balances` → notification sent to member

### Admin: Complete Withdrawal

1. View pending withdrawal requests
2. Open detail of a specific request
3. Verify member info and selected deposits
4. Click "Tandai Selesai" → status set to `completed`
5. Trigger fires: deposits marked withdrawn, balance updated, notification sent

### Member: Request Withdrawal

1. Step 1 — Select which deposits to withdraw (checkbox, or "Select All")
2. Step 2 — Choose method: `manual` or `bank_transfer`
   - If `bank_transfer`: enter or select saved bank account. Option to save for next time.
3. Step 3 — Review summary, confirm
4. Submit → status = `pending`, waits for admin to process

---

## Notification Message Templates

| Type                   | Title               | Message                                                      |
| ---------------------- | ------------------- | ------------------------------------------------------------ |
| `deposit_created`      | Deposit Berhasil    | Deposit [nama sampah] [berat]kg = Rp[total] berhasil dicatat |
| `withdrawal_requested` | Permintaan Diterima | Request penarikan Rp[total] sedang diproses                  |
| `withdrawal_completed` | Penarikan Berhasil  | Penarikan Rp[total] telah berhasil diproses                  |
| `price_update`         | Update Harga        | Harga [nama sampah] diperbarui menjadi Rp[harga]/kg          |

---

## Monthly Report (Excel Export)

Generated using SheetJS. File: `src/utils/excelExporter.ts`

4 sheets:

1. **Summary** — Total member, total deposits (kg + Rp), total withdrawals
2. **Deposit Details** — Date, Member Name, Category, Trash Type, Weight, Price/kg, Total Rp
3. **Withdrawal Details** — Date, Member Name, Amount, Method, Status
4. **Member Balance Sheet** — Member Name, Phone, Total Withdrawn (lifetime), Current Balance

---

## Coding Conventions

- **Language**: TypeScript everywhere. No `any` unless absolutely necessary.
- **Components**: Functional components only. No class components.
- **Styling**: TailwindCSS utility classes only. No inline styles.
- **Forms**: Always use `react-hook-form` + `zod` for validation.
- **API calls**: All Supabase calls go through service files in `src/services/`. Never call `supabase` directly inside a component.
- **Error handling**: All async functions wrapped in try/catch. Show user-facing errors via `react-hot-toast`.
- **Formatting**: IDR amounts always use `toLocaleString('id-ID')` with `Rp` prefix.
- **Phone numbers**: Stored in DB as `+62` format. Display as `08xx` format using a formatter utility.

---

## Out of Scope (Not Implemented in MVP)

- SMS delivery for OTP (use Supabase test OTP or log)
- Push notifications / email notifications
- Payment gateway integration (all transfers are manual)
- Multi-location support (single bank sampah only)
- PDF receipt / slip generation
- WhatsApp integration
- PWA / offline mode (planned Phase 2)
- Member self-registration (admin registers members)
- Role: petugas (only admin and member roles exist)
- Bulk withdrawal approval
- Recurring auto-withdrawal schedule
- Member referral program
- Multi-currency
