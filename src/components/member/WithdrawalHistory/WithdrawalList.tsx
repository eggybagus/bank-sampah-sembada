import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
  Banknote,
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import ErrorState from "../../common/ErrorState";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useAuth } from "../../../hooks/useAuth";
import { useMemberWithdrawals } from "../../../hooks/useWithdrawal";
import { useDeposits } from "../../../hooks/useDeposits";
import { useBankAccounts } from "../../../hooks/useBankAccounts";
import { formatRupiah } from "../../../utils/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { WithdrawalRequest } from "../../../types";

const ITEMS_PER_PAGE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: id });
}

const statusConfig: Record<
  WithdrawalRequest["status"],
  { label: string; color: string; border: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Menunggu",
    color: "text-amber-700",
    border: "border-amber-200",
    bg: "bg-amber-50",
    icon: <Clock size={12} />,
  },
  completed: {
    label: "Selesai",
    color: "text-emerald-700",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    icon: <CheckCircle2 size={12} />,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-slate-600",
    border: "border-slate-200",
    bg: "bg-slate-100",
    icon: <XCircle size={12} />,
  },
};

// ─── Skeletons ───────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Detail modal ────────────────────────────────────────────────────────────

function DetailModal({
  withdrawal,
  deposits,
  accounts,
  onClose,
}: {
  withdrawal: WithdrawalRequest;
  deposits: import("../../../types").DepositWithRelations[] | undefined;
  accounts: import("../../../types").BankAccount[] | undefined;
  onClose: () => void;
}) {
  const selectedDeposits =
    deposits?.filter((d) => withdrawal.selected_deposits.includes(d.id)) ?? [];
  const account = accounts?.find((a) => a.id === withdrawal.bank_account_id);
  const status = statusConfig[withdrawal.status];

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Detail Penarikan</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">Jumlah</p>
            <p className="text-2xl font-black text-slate-900">
              {formatRupiah(withdrawal.total_amount)}
            </p>
          </div>

          {/* Meta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Status</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}
              >
                {status.icon}
                {status.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Tanggal</span>
              <span className="text-xs font-bold text-slate-700">
                {formatDateTime(withdrawal.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Metode</span>
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                {withdrawal.withdrawal_type === "manual" ? (
                  <>
                    <Banknote size={12} /> Tarik Manual
                  </>
                ) : (
                  <>
                    <Landmark size={12} /> Transfer Bank
                  </>
                )}
              </span>
            </div>
            {withdrawal.completed_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Selesai</span>
                <span className="text-xs font-bold text-slate-700">
                  {formatDateTime(withdrawal.completed_at)}
                </span>
              </div>
            )}
          </div>

          {/* Bank info */}
          {account && (
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Rekening Tujuan
              </p>
              <p className="text-sm font-bold text-slate-900">{account.bank_name}</p>
              <p className="text-xs text-slate-500 font-medium">
                {account.account_number}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                a.n. {account.account_holder}
              </p>
            </div>
          )}

          {/* Deposits */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Deposit yang Ditarik ({selectedDeposits.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDeposits.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Package size={12} className="text-slate-400 shrink-0" />
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {d.trash_type?.name ?? "-"}
                    </p>
                  </div>
                  <p className="text-xs font-black text-slate-900 whitespace-nowrap">
                    {formatRupiah(d.total_rupiah)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WithdrawalList() {
  usePageTitle("Riwayat Penarikan");

  const { user } = useAuth();
  const memberId = user?.id ?? "";

  const { data: withdrawals, isLoading, error } = useMemberWithdrawals(memberId);
  const { data: deposits } = useDeposits(memberId);
  const { data: accounts } = useBankAccounts(memberId);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!withdrawals) return [];
    if (statusFilter === "all") return withdrawals;
    return withdrawals.filter((w) => w.status === statusFilter);
  }, [withdrawals, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const detailWithdrawal = useMemo(
    () => withdrawals?.find((w) => w.id === detailId) ?? null,
    [withdrawals, detailId]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History size={18} className="text-brand-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Riwayat
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Riwayat Penarikan
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Semua permintaan penarikan Anda
          </p>
        </div>
        <Link
          to="/member/withdrawal"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
        >
          <Banknote size={15} />
          Ajukan Penarikan
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter size={14} className="text-slate-400 shrink-0" />
        {[
          { value: "all", label: "Semua" },
          { value: "pending", label: "Menunggu" },
          { value: "completed", label: "Selesai" },
          { value: "cancelled", label: "Dibatalkan" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setStatusFilter(opt.value);
              setPage(1);
            }}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === opt.value
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message="Gagal memuat data penarikan." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Metode
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <History size={28} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">
                        Tidak ada data penarikan
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((w) => {
                    const s = statusConfig[w.status];
                    return (
                      <tr
                        key={w.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                          {formatShortDate(w.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap">
                          {formatRupiah(w.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-600">
                          {w.withdrawal_type === "manual" ? (
                            <span className="flex items-center gap-1">
                              <Banknote size={12} /> Manual
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Landmark size={12} /> Transfer
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${s.bg} ${s.color} ${s.border}`}
                          >
                            {s.icon}
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDetailId(w.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all"
                          >
                            <Eye size={12} />
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          p === page
                            ? "bg-brand-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detailWithdrawal && (
        <DetailModal
          withdrawal={detailWithdrawal}
          deposits={deposits}
          accounts={accounts}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
