import { useState, useMemo } from "react";
import {
  History,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  ArrowUpDown,
} from "lucide-react";
import ErrorState from "../../common/ErrorState";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useDeposits } from "../../../hooks/useDeposits";
import { useAuth } from "../../../hooks/useAuth";
import { formatRupiah } from "../../../utils/formatters";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import type { DepositWithRelations } from "../../../types";

const ITEMS_PER_PAGE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

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

// ─── Filter UI ───────────────────────────────────────────────────────────────

function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  selectedStatus: string;
  onStatusChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-2 text-slate-400 mr-1">
        <Filter size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Filter
        </span>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          Kategori
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
        >
          <option value="all">Semua</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
        >
          <option value="all">Semua</option>
          <option value="unwithdrawn">Belum Ditarik</option>
          <option value="withdrawn">Sudah Ditarik</option>
        </select>
      </div>

      {/* Date from */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          Dari
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
        />
      </div>

      {/* Date to */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          Sampai
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
        />
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DepositList() {
  usePageTitle("Riwayat Deposit");

  const { user } = useAuth();
  const memberId = user?.id ?? "";

  const { data: deposits, isLoading, error } = useDeposits(memberId);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    deposits?.forEach((d) => {
      if (d.trash_type?.category) set.add(d.trash_type.category);
    });
    return Array.from(set).sort();
  }, [deposits]);

  // Filter + sort
  const filtered = useMemo(() => {
    if (!deposits) return [];

    let result = [...deposits];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((d) => d.trash_type?.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus === "withdrawn") {
      result = result.filter((d) => d.is_withdrawn);
    } else if (selectedStatus === "unwithdrawn") {
      result = result.filter((d) => !d.is_withdrawn);
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const from = dateFrom ? startOfDay(parseISO(dateFrom)) : null;
      const to = dateTo ? endOfDay(parseISO(dateTo)) : null;
      result = result.filter((d) => {
        const dd = parseISO(d.deposit_date);
        if (from && to) return isWithinInterval(dd, { start: from, end: to });
        if (from) return dd >= from;
        if (to) return dd <= to;
        return true;
      });
    }

    // Sort by date desc (default)
    result.sort(
      (a, b) =>
        new Date(b.deposit_date).getTime() - new Date(a.deposit_date).getTime()
    );

    return result;
  }, [deposits, selectedCategory, selectedStatus, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Summary for filtered set
  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, d) => ({
        totalWeight: acc.totalWeight + d.weight_kg,
        totalRupiah: acc.totalRupiah + d.total_rupiah,
      }),
      { totalWeight: 0, totalRupiah: 0 }
    );
  }, [filtered]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <History size={18} className="text-brand-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Riwayat
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Riwayat Deposit
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Semua deposit yang telah Anda lakukan
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(v) => {
          setSelectedCategory(v);
          setPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(v) => {
          setSelectedStatus(v);
          setPage(1);
        }}
        dateFrom={dateFrom}
        onDateFromChange={(v) => {
          setDateFrom(v);
          setPage(1);
        }}
        dateTo={dateTo}
        onDateToChange={(v) => {
          setDateTo(v);
          setPage(1);
        }}
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message="Gagal memuat data deposit." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      Tanggal <ArrowUpDown size={10} />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Jenis Sampah
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Berat (kg)
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Harga/kg
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Total (Rp)
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Package size={28} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">
                        Tidak ada deposit yang cocok dengan filter
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {formatShortDate(d.deposit_date)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600">
                        {d.trash_type?.category ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-900">
                        {d.trash_type?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {d.weight_kg}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {formatRupiah(d.price_per_kg)}
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
              {/* Summary row */}
              {paginated.length > 0 && (
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right"
                    >
                      Total Filter
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap">
                      {summary.totalWeight.toFixed(3)} kg
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap">
                      {formatRupiah(summary.totalRupiah)}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              )}
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
    </div>
  );
}
