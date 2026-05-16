import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  UserCircle,
  Phone,
  LogOut,
  Loader2,
  Save,
  AlertCircle,
  Landmark,
  Star,
  Trash2,
  Plus,
  CheckCircle2,
  Shield,
  Clock,
} from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAuth } from "../../hooks/useAuth";
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
  useSetDefaultBankAccount,
} from "../../hooks/useBankAccounts";
import { supabase } from "../../lib/supabase";
import { formatPhone, maskAccountNumber } from "../../utils/formatters";
import toast from "react-hot-toast";
import type { BankAccount } from "../../types";

// ─── Schema ──────────────────────────────────────────────────────────────────

const nameSchema = z.object({
  fullName: z.string().min(3, "Nama minimal 3 karakter").max(100, "Maksimal 100 karakter"),
});

type NameFormData = z.infer<typeof nameSchema>;

// ─── Delete confirmation modal ───────────────────────────────────────────────

function DeleteBankModal({
  account,
  onClose,
}: {
  account: BankAccount;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const deleteMutation = useDeleteBankAccount(user?.id ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Hapus Rekening?</p>
            <p className="text-xs text-slate-500 font-medium">
              {account.bank_name} — {maskAccountNumber(account.account_number)}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Rekening yang dihapus tidak dapat dikembalikan.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
          >
            Batal
          </button>
          <button
            onClick={() => deleteMutation.mutate(account.id, { onSuccess: onClose })}
            disabled={deleteMutation.isPending}
            className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-1.5"
          >
            {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New account form ────────────────────────────────────────────────────────

function NewAccountForm({
  userId,
  onCancel,
}: {
  userId: string;
  onCancel: () => void;
}) {
  const createMutation = useCreateBankAccount(userId);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const canSave = bankName.trim() && accountNumber.trim() && accountHolder.trim();

  async function handleSave() {
    if (!canSave) return;
    await createMutation.mutateAsync({
      user_id: userId,
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      account_holder: accountHolder.trim(),
      is_default: isDefault,
    });
    onCancel();
  }

  return (
    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1.5">Nama Bank</label>
        <input
          type="text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Contoh: BCA, BRI, Mandiri"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1.5">Nomor Rekening</label>
        <input
          type="text"
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          placeholder="1234567890"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1.5">Nama Pemilik Rekening</label>
        <input
          type="text"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          placeholder="Nama sesuai rekening"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-xs font-bold text-slate-600">Jadikan rekening utama</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || createMutation.isPending}
          className="flex-1 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-all shadow-lg shadow-brand-200 flex items-center justify-center gap-1.5"
        >
          {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Simpan
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AccountSettings() {
  usePageTitle("Pengaturan Akun");

  const { user, profile, signOut } = useAuth();
  const userId = user?.id ?? "";
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);

  const { data: accounts, isLoading: accountsLoading } = useBankAccounts(userId);
  const setDefault = useSetDefaultBankAccount(userId);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { fullName: profile?.full_name ?? "" },
  });

  async function onSubmit(data: NameFormData) {
    if (!user) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Nama berhasil diperbarui");
    } catch {
      toast.error("Gagal memperbarui nama");
    } finally {
      setIsUpdating(false);
    }
  }

  const sessionSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings size={18} className="text-brand-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Pengaturan
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Pengaturan Akun
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Kelola profil dan rekening bank Anda
        </p>
      </div>

      {/* Section 1 — Profil */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <UserCircle size={20} className="text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Profil Saya</p>
            <p className="text-xs text-slate-400 font-medium">Informasi dasar akun</p>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Phone size={12} />
            {formatPhone(profile?.phone_number ?? "")}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              {...register("fullName")}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                errors.fullName
                  ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.fullName.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isUpdating || !isDirty}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-all shadow-lg shadow-brand-200"
          >
            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isUpdating ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>

      {/* Section 2 — Rekening Bank */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Landmark size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Rekening Bank Tersimpan</p>
              <p className="text-xs text-slate-400 font-medium">
                {accounts?.length ?? 0} rekening
              </p>
            </div>
          </div>
          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-600 text-xs font-bold rounded-xl hover:bg-brand-100 transition-all border border-brand-100"
            >
              <Plus size={14} />
              Tambah
            </button>
          )}
        </div>

        {showNewForm && <NewAccountForm userId={userId} onCancel={() => setShowNewForm(false)} />}

        {accountsLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Landmark size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Belum ada rekening tersimpan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                    <Landmark size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{acc.bank_name}</p>
                      {acc.is_default && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded border border-emerald-100">
                          <Star size={8} />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {maskAccountNumber(acc.account_number)} — {acc.account_holder}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!acc.is_default && (
                    <button
                      onClick={() => setDefault.mutate(acc.id)}
                      disabled={setDefault.isPending}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                      title="Jadikan Default"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(acc)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3 — Keamanan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Keamanan</p>
            <p className="text-xs text-slate-400 font-medium">Kelola sesi dan akses akun</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-3 border-t border-slate-100">
          <Clock size={12} />
          Sesi aktif sejak {sessionSince}
        </div>

        <button
          onClick={signOut}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-all border border-red-100"
        >
          <LogOut size={14} />
          Keluar dari Akun
        </button>
      </div>

      {deleteTarget && (
        <DeleteBankModal account={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
