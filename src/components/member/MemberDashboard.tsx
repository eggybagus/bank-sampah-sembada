import { Link } from "react-router-dom";
import {
  Wallet,
  ArrowDownLeft,
  ArrowRight,
  History,
  Loader2,
  AlertCircle,
  Bell,
  Leaf,
  TrendingUp,
  Package,
} from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAuth } from "../../hooks/useAuth";
import { useDeposits, useDepositStats } from "../../hooks/useDeposits";
import { useBalance } from "../../hooks/useBalance";
import { useNotifications } from "../../hooks/useNotifications";
import { formatRupiah } from "../../utils/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { DepositWithRelations } from "../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
  );
}

function DepositsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function StatCards({
  balance,
  stats,
  isLoadingBalance,
  isLoadingStats,
}: {
  balance: { total_balance: number; total_withdrawn: number } | null | undefined;
  stats: { totalDeposited: number; totalWithdrawn: number; unwithdrawnCount: number } | null | undefined;
  isLoadingBalance: boolean;
  isLoadingStats: boolean;
}) {
  if (isLoadingBalance || isLoadingStats) return <StatCardsSkeleton />;

  const totalBalance = balance?.total_balance ?? 0;
  const totalWithdrawn = balance?.total_withdrawn ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Saldo Saat Ini
            </span>
          </div>
          <p className="text-3xl font-black tracking-tight">
            {formatRupiah(totalBalance)}
          </p>
          <p className="text-xs text-emerald-100 font-medium mt-1">
            {stats?.unwithdrawnCount ?? 0} deposit belum ditarik
          </p>
        </div>
      </div>

      {/* Withdrawn card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-lg shadow-brand-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ArrowDownLeft size={16} className="text-white" />
            </div>
            <span className="text-xs font-bold text-brand-100 uppercase tracking-wider">
              Total Ditarik
            </span>
          </div>
          <p className="text-3xl font-black tracking-tight">
            {formatRupiah(totalWithdrawn)}
          </p>
          <p className="text-xs text-brand-100 font-medium mt-1">
            Seumur hidup
          </p>
        </div>
      </div>
    </div>
  );
}

function RecentDeposits({
  deposits,
  isLoading,
  error,
}: {
  deposits: DepositWithRelations[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) return <DepositsSkeleton />;
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
        <AlertCircle size={16} />
        Gagal memuat deposit.
      </div>
    );
  }

  const recent = deposits?.slice(0, 5) ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Jenis Sampah
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Berat
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Package size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">
                    Belum ada deposit
                  </p>
                </td>
              </tr>
            ) : (
              recent.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                    {formatShortDate(d.deposit_date)}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">
                    {d.trash_type?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                    {d.weight_kg} kg
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(d.total_rupiah)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        d.is_withdrawn
                          ? "bg-slate-100 text-slate-500 border-slate-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}
                    >
                      {d.is_withdrawn ? "Sudah Ditarik" : "Belum Ditarik"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotificationPreview({
  notifications,
  isLoading,
  userId,
}: {
  notifications: import("../../types").Notification[] | undefined;
  isLoading: boolean;
  userId: string;
}) {
  if (isLoading) return <NotificationsSkeleton />;

  const unread = notifications?.filter((n) => !n.is_read).slice(0, 3) ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-brand-600" />
          <h3 className="text-sm font-black text-slate-900">Notifikasi</h3>
        </div>
        <Link
          to="/member/notifications"
          className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Lihat Semua
        </Link>
      </div>

      {unread.length === 0 ? (
        <div className="text-center py-6">
          <Bell size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">
            Tidak ada notifikasi baru
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {unread.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-0.5">
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MemberDashboard() {
  usePageTitle("Dashboard");

  const { user, profile } = useAuth();
  const memberId = user?.id ?? "";
  const memberName = profile?.full_name ?? "Anggota";

  const {
    data: deposits,
    isLoading: depositsLoading,
    error: depositsError,
  } = useDeposits(memberId);

  const {
    data: stats,
    isLoading: statsLoading,
  } = useDepositStats(memberId);

  const {
    data: balance,
    isLoading: balanceLoading,
  } = useBalance(memberId);

  const {
    data: notifications,
    isLoading: notificationsLoading,
  } = useNotifications(memberId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Greeting */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Leaf size={18} className="text-brand-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Dashboard Anggota
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Selamat datang, {memberName.split(" ")[0]}.
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Pantau saldo dan riwayat deposit Anda di sini.
        </p>
      </div>

      {/* Stats */}
      <StatCards
        balance={balance ?? null}
        stats={stats ?? null}
        isLoadingBalance={balanceLoading}
        isLoadingStats={statsLoading}
      />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/member/deposits"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all shadow-sm"
        >
          <History size={15} />
          Lihat Semua Deposit
          <ArrowRight size={14} className="text-slate-400" />
        </Link>
        <Link
          to="/member/withdrawal"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
        >
          <TrendingUp size={15} />
          Ajukan Penarikan
        </Link>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Recent deposits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Deposit Terbaru
            </h2>
            <Link
              to="/member/deposits"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>
          <RecentDeposits
            deposits={deposits}
            isLoading={depositsLoading}
            error={depositsError ?? null}
          />
        </div>

        {/* Notifications */}
        <div>
          <NotificationPreview
            notifications={notifications}
            isLoading={notificationsLoading}
            userId={memberId}
          />
        </div>
      </div>
    </div>
  );
}
