// ─── Core entities ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  role: "admin" | "member";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrashType {
  id: string;
  category: string;
  name: string;
  description?: string;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrashPrice {
  id: string;
  trash_type_id: string;
  price_per_kg: number;
  effective_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
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
}

export interface MemberBalance {
  id: string;
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
  completed_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type:
    | "deposit_created"
    | "withdrawal_requested"
    | "withdrawal_completed"
    | "price_update";
  related_record_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  type: "announcement" | "price_update" | "tips" | "general";
  images: string[];
  created_by: string;
  published_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ─── Join / relation types ───────────────────────────────────────────────────

export interface DepositWithRelations extends Deposit {
  trash_type?: TrashType;
  member?: Pick<Profile, "id" | "full_name" | "phone_number">;
}

export interface TrashPriceWithType extends TrashPrice {
  trash_type: TrashType;
}

export interface WithdrawalWithRelations extends WithdrawalRequest {
  member?: Pick<Profile, "id" | "full_name" | "phone_number">;
  bank_account?: BankAccount;
}

export interface MemberWithBalance extends Profile {
  member_balance?: MemberBalance;
}

// ─── Form / payload types ────────────────────────────────────────────────────

export type CreateDepositPayload = Omit<
  Deposit,
  "id" | "created_at" | "is_withdrawn"
>;

export type CreateWithdrawalPayload = Pick<
  WithdrawalRequest,
  | "member_id"
  | "withdrawal_type"
  | "total_amount"
  | "selected_deposits"
  | "bank_account_id"
  | "notes"
>;

export type CreateNewsPayload = Omit<News, "id" | "created_at">;
