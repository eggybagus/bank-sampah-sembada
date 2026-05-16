import { useMemo } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Banknote,
  Clock,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";
import ErrorState from "../../components/common/ErrorState";
import { useMembers } from "../../hooks/useMembers";
import { useAllWithdrawals } from "../../hooks/useWithdrawal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { formatRupiah } from "../../utils/formatters";
import { format, startOfMonth, isWithinInterval, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { DepositWithRelations, WithdrawalRequest } from "../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "emerald" | "brand" | "amber" | "blue";
}) {
  const colorMap = {
    emerald: "from-emerald-500 to-emerald-700 shadow-emerald-200",
    brand: "from-brand-500 to-brand-700 shadow-brand-200",
    amber: "from-amber-500 to-amber-700 shadow-amber-200",
    blue: "from-blue-500 to-blue-700 shadow-blue-200",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-3">
          {icon}
        </div>
        <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  usePageTitle("Dashboard");

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: withdrawals, isLoading: withdrawalsLoading } = useAllWithdrawals();

  // Fetch recent deposits
  const { data: recentDeposits, isLoading: depositsLoading, error: depositsError, refetch: refetchDeposits } = useQuery({
    queryKey: ["recent-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select(
          "*, trash_type:trash_types(*), member:profiles!deposits_member_id_fkey(id, full_name, phone_number)"
        )
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as DepositWithRelations[];
    },
  });

  // Stats
  const stats = useMemo(() => {
    const totalMembers = members?.length ?? 0;
    const totalUnwithdrawnBalance =
      members?.reduce((s, m) => s + (m.member_balance?.total_balance ?? 0), 0) ?? 0;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const completedThisMonth =
      withdrawals?.filter(
        (w) =>
          w.status === "completed" &&
          w.completed_at &&
          isWithinInterval(parseISO(w.completed_at), {
            start: monthStart,
            end: now,
          })
      ) ?? [];
    const totalCompletedThisMonth = completedThisMonth.reduce(
      (s, w) => s + w.total_amount,
      0
    );

    const pendingCount =
      withdrawals?.filter((w) => w.status === "pending").length ?? 0;

    return {
      totalMembers,
      totalUnwithdrawnBalance,
      totalCompletedThisMonth,
      pendingCount,
    };
  }, [members, withdrawals]);

  const pendingWithdrawals = useMemo(
    () => withdrawals?.filter((w) => w.status === "pending").slice(0, 5) ?? [],
    [withdrawals]
  );

  const isLoading = membersLoading || withdrawalsLoading || depositsLoading;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard size={18} className="text-brand-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Dashboard
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Dashboard Admin
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Ringkasan aktivitas Bank Sampah Sembada
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Member"
            value={String(stats.totalMembers)}
            icon={<Users size={16} className="text-white" />}
            color="brand"
          />
          <StatCard
            title="Saldo Belum Dicairkan"
            value={formatRupiah(stats.totalUnwithdrawnBalance)}
            icon={<Wallet size={16} className="text-white" />}
            color="emerald"
          />
          <StatCard
            title="Dicairkan Bulan Ini"
            value={formatRupiah(stats.totalCompletedThisMonth)}
            icon={<Banknote size={16} className="text-white" />}
            color="blue"
          />
          <StatCard
            title="Withdrawal Pending"
            value={String(stats.pendingCount)}
            icon={<Clock size={16} className="text-white" />}
            color="amber"
          />
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Recent deposits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Deposit Terbaru
            </h2>
            <Link
              to="/admin/deposit"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Input Deposit
            </Link>
          </div>

          {depositsLoading ? (
            <TableSkeleton />
          ) : depositsError ? (
            <ErrorState message="Gagal memuat deposit terbaru." onRetry={refetchDeposits} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Jenis
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Berat
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!recentDeposits || recentDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <Package size={24} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-medium">
                            Belum ada deposit
                          </p>
                        </td>
                      </tr>
                    ) : (
                      recentDeposits.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-bold text-slate-900">
                            {d.member?.full_name ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-600">
                            {d.trash_type?.name ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                            {d.weight_kg} kg
                          </td>
                          <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap">
                            {formatRupiah(d.total_rupiah)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                            {formatShortDate(d.deposit_date)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pending withdrawals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Menunggu Proses
            </h2>
            <Link
              to="/admin/withdrawals"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          {withdrawalsLoading ? (
            <TableSkeleton />
          ) : pendingWithdrawals.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Clock size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">
                Tidak ada withdrawal pending
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((w) => (
                <div
                  key={w.id}
                  className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {formatRupiah(w.total_amount)}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100">
                      Menunggu
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {w.withdrawal_type === "manual" ? "Tarik Manual" : "Transfer Bank"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {formatShortDate(w.created_at)}
                  </p>
                  <Link
                    to="/admin/withdrawals"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Proses
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
