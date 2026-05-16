import {
  X,
  User,
  Phone,
  Banknote,
  Clock,
  CheckCircle2,
  Ban,
  Loader2,
  AlertCircle,
  Building2,
  CreditCard,
  UserCheck,
  Calendar,
  Package,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  useCompleteWithdrawal,
  useCancelWithdrawal,
} from "../../../hooks/useWithdrawal";
import { formatRupiah } from "../../../utils/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { WithdrawalWithRelations } from "../../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy HH:mm", { locale: id });
}

function formatLongDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMMM yyyy", { locale: id });
}

// ─── Status section ──────────────────────────────────────────────────────────

function StatusSection({ status }: { status: WithdrawalWithRelations["status"] }) {
  if (status === "pending") {
    return (
      <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
        <Clock size={20} className="text-amber-500 shrink-0" />
        <div>
          <p className="text-xs font-black text-amber-700">Menunggu Proses</p>
          <p className="text-[10px] text-amber-600 font-medium">
            Withdrawal ini belum diproses oleh admin.
          </p>
        </div>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-xs font-black text-emerald-700">Selesai</p>
          <p className="text-[10px] text-emerald-600 font-medium">
            Withdrawal telah berhasil diproses.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
      <Ban size={20} className="text-red-500 shrink-0" />
      <div>
        <p className="text-xs font-black text-red-700">Dibatalkan</p>
        <p className="text-[10px] text-red-600 font-medium">
          Withdrawal ini telah dibatalkan.
        </p>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WithdrawalDetailModal({
  withdrawal,
  onClose,
}: {
  withdrawal: WithdrawalWithRelations;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const completeMutation = useCompleteWithdrawal();
  const cancelMutation = useCancelWithdrawal();
  const adminId = user?.id ?? "";

  const isPending = withdrawal.status === "pending";
  const isProcessing = completeMutation.isPending || cancelMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Banknote size={18} className="text-brand-600" />
            <h2 className="text-sm font-black text-slate-900">Detail Withdrawal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          <StatusSection status={withdrawal.status} />

          {/* Member info */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Member
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <User size={18} className="text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {withdrawal.member?.full_name ?? "-"}
                </p>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Phone size={10} />
                  {withdrawal.member?.phone_number ?? "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Jumlah Penarikan
            </p>
            <p className="text-2xl font-black text-slate-900">
              {formatRupiah(withdrawal.total_amount)}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Package size={12} />
              {withdrawal.selected_deposits.length} deposit dipilih
            </div>
          </div>

          {/* Withdrawal type details */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Detail Penarikan
            </p>
            {withdrawal.withdrawal_type === "bank_transfer" && withdrawal.bank_account ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Building2 size={14} className="text-slate-400" />
                  {withdrawal.bank_account.bank_name}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <CreditCard size={14} className="text-slate-400" />
                  {withdrawal.bank_account.account_number}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <UserCheck size={14} className="text-slate-400" />
                  {withdrawal.bank_account.account_holder}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <Banknote size={14} className="text-slate-400" />
                Penarikan manual di lokasi Bank Sampah
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Calendar size={12} />
              Diajukan: {formatShortDate(withdrawal.created_at)}
            </div>
            {withdrawal.completed_at && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <CheckCircle2 size={12} />
                Diselesaikan: {formatShortDate(withdrawal.completed_at)}
              </div>
            )}
          </div>

          {/* Notes */}
          {withdrawal.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Catatan
              </p>
              <p className="text-xs text-slate-600 font-medium">{withdrawal.notes}</p>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (window.confirm("Yakin ingin menandai withdrawal ini selesai?")) {
                    completeMutation.mutate(
                      { id: withdrawal.id, completedBy: adminId },
                      { onSuccess: onClose }
                    );
                  }
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-1.5"
              >
                {completeMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Tandai Selesai
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Yakin ingin membatalkan withdrawal ini?")) {
                    cancelMutation.mutate(withdrawal.id, { onSuccess: onClose });
                  }
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-1.5"
              >
                {cancelMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Ban size={14} />
                )}
                Batalkan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
