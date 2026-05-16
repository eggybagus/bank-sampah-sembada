import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Wallet,
  Eye,
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Ban,
} from "lucide-react";
import { useMembers } from "../../../hooks/useMembers";
import { useUpdateMemberStatus } from "../../../hooks/useMembers";
import { formatRupiah } from "../../../utils/formatters";
import type { MemberWithBalance } from "../../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  });
  return debounced;
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
        <CheckCircle2 size={10} />
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100">
      <Ban size={10} />
      Nonaktif
    </span>
  );
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

type SortKey = "name" | "balance" | "date";
type SortDir = "asc" | "desc";

function sortMembers(
  members: MemberWithBalance[],
  key: SortKey,
  dir: SortDir
): MemberWithBalance[] {
  const sorted = [...members];
  sorted.sort((a, b) => {
    let cmp = 0;
    if (key === "name") {
      cmp = a.full_name.localeCompare(b.full_name);
    } else if (key === "balance") {
      cmp = (a.member_balance?.total_balance ?? 0) - (b.member_balance?.total_balance ?? 0);
    } else if (key === "date") {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

// ─── Toggle status modal ─────────────────────────────────────────────────────

function ToggleStatusModal({
  member,
  onClose,
  onConfirm,
}: {
  member: MemberWithBalance;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const mutation = useUpdateMemberStatus();
  const isActive = member.is_active;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isActive ? "bg-red-100" : "bg-emerald-100"
            }`}
          >
            {isActive ? <Ban size={18} className="text-red-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">
              {isActive ? "Nonaktifkan Member?" : "Aktifkan Member?"}
            </p>
            <p className="text-xs text-slate-500 font-medium">{member.full_name}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          {isActive
            ? "Member tidak akan bisa login setelah dinonaktifkan. Saldo dan riwayat tetap tersimpan."
            : "Member akan dapat login kembali setelah diaktifkan."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
          >
            Batal
          </button>
          <button
            onClick={() => {
              mutation.mutate({ memberId: member.id, isActive: !isActive }, { onSuccess: onClose });
            }}
            disabled={mutation.isPending}
            className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isActive
                ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
            } disabled:opacity-60`}
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function MemberList() {
  const { data: members, isLoading } = useMembers();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [toggleTarget, setToggleTarget] = useState<MemberWithBalance | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    if (!members) return [];
    let list = members;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.phone_number.toLowerCase().includes(q)
      );
    }
    return sortMembers(list, sortKey, sortDir);
  }, [members, debouncedSearch, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortKey]
  );

  const totalBalance = useMemo(
    () => members?.reduce((s, m) => s + (m.member_balance?.total_balance ?? 0), 0) ?? 0,
    [members]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-brand-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Member
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Kelola Member
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {members?.length ?? 0} member terdaftar · Total saldo{" "}
            {formatRupiah(totalBalance)}
          </p>
        </div>
        <Link
          to="/admin/deposit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
        >
          <UserPlus size={16} />
          Input Deposit
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama atau nomor HP..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                    >
                      Member
                      <ArrowUpDown size={10} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("balance")}
                      className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                    >
                      Saldo
                      <ArrowUpDown size={10} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                    >
                      Bergabung
                      <ArrowUpDown size={10} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <User size={24} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">
                        {search ? "Member tidak ditemukan" : "Belum ada member"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <User size={16} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{m.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Phone size={9} />
                              {m.phone_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Wallet size={12} className="text-emerald-500" />
                          <span className="text-xs font-black text-slate-900">
                            {formatRupiah(m.member_balance?.total_balance ?? 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={m.is_active} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/members/${m.id}`}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                            title="Detail"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => setToggleTarget(m)}
                            className={`p-1.5 rounded-lg transition-all ${
                              m.is_active
                                ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={m.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {m.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold">
                {filtered.length} member · Halaman {safePage} dari {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {toggleTarget && (
        <ToggleStatusModal
          member={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onConfirm={() => setToggleTarget(null)}
        />
      )}
    </div>
  );
}
