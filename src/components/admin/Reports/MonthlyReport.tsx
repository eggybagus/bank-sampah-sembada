import { useState, useMemo, useEffect } from "react";
import {
  FileBarChart,
  Calendar,
  Download,
  Loader2,
  Package,
  Scale,
  Banknote,
  Users,
  ArrowDownToLine,
  FileSpreadsheet,
} from "lucide-react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { supabase } from "../../../lib/supabase";
import { exportMonthlyReport } from "../../../utils/excelExporter";
import { formatRupiah } from "../../../utils/formatters";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import type { DepositWithRelations, WithdrawalWithRelations, MemberWithBalance } from "../../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthOptions() {
  const names = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return names.map((name, i) => ({ value: i + 1, label: name }));
}

function getYearOptions() {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - 2 + i);
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
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
  color: "emerald" | "brand" | "amber" | "blue" | "purple";
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    brand: "bg-brand-50 text-brand-600 border-brand-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)]">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 border ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {title}
      </p>
      <p className="text-lg font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MonthlyReport() {
  usePageTitle("Laporan Bulanan");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deposits, setDeposits] = useState<DepositWithRelations[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithRelations[]>([]);
  const [members, setMembers] = useState<MemberWithBalance[]>([]);

  const monthStart = useMemo(() => startOfMonth(new Date(year, month - 1)), [year, month]);
  const monthEnd = useMemo(() => endOfMonth(new Date(year, month - 1)), [year, month]);

  // Fetch data when month/year changes
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setIsLoading(true);
      const startStr = monthStart.toISOString();
      const endStr = monthEnd.toISOString();

      try {
        const [depositsRes, withdrawalsRes, membersRes] = await Promise.all([
          supabase
            .from("deposits")
            .select(
              "*, trash_type:trash_types(*), member:profiles!deposits_member_id_fkey(id, full_name, phone_number)"
            )
            .gte("deposit_date", startStr.slice(0, 10))
            .lte("deposit_date", endStr.slice(0, 10))
            .order("deposit_date", { ascending: true }),
          supabase
            .from("withdrawal_requests")
            .select(
              "*, member:profiles!withdrawal_requests_member_id_fkey(id, full_name, phone_number)"
            )
            .gte("created_at", startStr)
            .lte("created_at", endStr)
            .order("created_at", { ascending: true }),
          supabase
            .from("profiles")
            .select("*, member_balance:member_balances(*)")
            .eq("role", "member")
            .order("full_name"),
        ]);

        if (cancelled) return;

        if (depositsRes.error) throw depositsRes.error;
        if (withdrawalsRes.error) throw withdrawalsRes.error;
        if (membersRes.error) throw membersRes.error;

        setDeposits((depositsRes.data ?? []) as DepositWithRelations[]);
        setWithdrawals((withdrawalsRes.data ?? []) as WithdrawalWithRelations[]);
        setMembers((membersRes.data ?? []) as MemberWithBalance[]);
      } catch {
        toast.error("Gagal memuat data laporan");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [monthStart, monthEnd]);

  const stats = useMemo(() => {
    const totalDepositCount = deposits.length;
    const totalDepositValue = deposits.reduce((s, d) => s + (d.total_rupiah ?? 0), 0);
    const completedWithdrawals = withdrawals.filter((w) => w.status === "completed");
    const totalWithdrawalValue = completedWithdrawals.reduce((s, w) => s + (w.total_amount ?? 0), 0);
    const totalMember = members.length;

    const weightMap: Record<string, { name: string; category: string; weight: number }> = {};
    for (const d of deposits) {
      const t = d.trash_type;
      if (!t) continue;
      if (!weightMap[t.id]) weightMap[t.id] = { name: t.name, category: t.category, weight: 0 };
      weightMap[t.id].weight += d.weight_kg ?? 0;
    }
    const weightByType = Object.values(weightMap).sort((a, b) => b.weight - a.weight);
    const totalWeight = weightByType.reduce((s, x) => s + x.weight, 0);

    return {
      totalDepositCount,
      totalDepositValue,
      totalWithdrawalValue,
      totalMember,
      weightByType,
      totalWeight,
    };
  }, [deposits, withdrawals, members]);

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportMonthlyReport(year, month);
      toast.success("Laporan berhasil didownload");
    } catch {
      toast.error("Gagal mengekspor laporan");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileBarChart size={18} className="text-brand-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Laporan
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Laporan Bulanan
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Ekspor data bulanan ke format Excel
        </p>
      </div>

      {/* Month/Year picker */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-4">
          <Calendar size={18} className="text-slate-400" />
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium bg-white"
            >
              {getMonthOptions().map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium bg-white"
            >
              {getYearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || isLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-200"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {isExporting ? "Mengekspor..." : "Export ke Excel"}
        </button>
      </div>

      {/* Preview stats */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">
            Ringkasan {format(monthStart, "MMMM yyyy", { locale: id })}
          </h2>

          {/* 4-card summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Deposit"
              value={String(stats.totalDepositCount)}
              icon={<Package size={16} />}
              color="brand"
            />
            <StatCard
              title="Total Nilai Deposit"
              value={formatRupiah(stats.totalDepositValue)}
              icon={<Banknote size={16} />}
              color="emerald"
            />
            <StatCard
              title="Total Penarikan"
              value={formatRupiah(stats.totalWithdrawalValue)}
              icon={<ArrowDownToLine size={16} />}
              color="amber"
            />
            <StatCard
              title="Total Member"
              value={String(stats.totalMember)}
              icon={<Users size={16} />}
              color="purple"
            />
          </div>

          {/* Weight per trash type */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-blue-50 text-blue-600 border-blue-100">
                  <Scale size={16} />
                </div>
                <p className="text-sm font-black text-slate-900">Berat per Jenis Sampah</p>
              </div>
              <span className="text-xs font-black text-slate-400">
                Total: {stats.totalWeight.toLocaleString("id-ID")} kg
              </span>
            </div>

            {stats.weightByType.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-6">
                Tidak ada data deposit bulan ini
              </p>
            ) : (
              <div className="space-y-3">
                {stats.weightByType.map((item) => {
                  const pct = stats.totalWeight > 0 ? (item.weight / stats.totalWeight) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{item.name}</span>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-700">
                          {item.weight.toLocaleString("id-ID")} kg
                          <span className="text-slate-400 font-medium ml-1">
                            ({pct.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <FileSpreadsheet size={18} className="text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-slate-600">Format Laporan</p>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            Laporan akan didownload dalam format .xlsx dengan 4 sheet: Ringkasan, Detail Deposit,
            Detail Penarikan, dan Saldo Member.
          </p>
        </div>
      </div>
    </div>
  );
}
