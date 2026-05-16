import { useState, useMemo, useEffect } from "react";
import {
  Newspaper,
  Search,
  X,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import ErrorState from "../../../components/common/ErrorState";
import { useNews, useDeleteNews } from "../../../hooks/useNews";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { News } from "../../../types";
import NewsForm from "./NewsForm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy HH:mm", { locale: id });
}

// ─── Type badge ──────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: News["type"] }) {
  const map: Record<News["type"], { label: string; classes: string }> = {
    announcement: {
      label: "Pengumuman",
      classes: "bg-blue-50 text-blue-600 border-blue-100",
    },
    price_update: {
      label: "Update Harga",
      classes: "bg-amber-50 text-amber-600 border-amber-100",
    },
    tips: {
      label: "Tips",
      classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    general: {
      label: "Umum",
      classes: "bg-slate-50 text-slate-500 border-slate-100",
    },
  };
  const config = map[type];
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] font-black rounded-full border ${config.classes}`}
    >
      {config.label}
    </span>
  );
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

// ─── Delete confirmation modal ───────────────────────────────────────────────

function DeleteModal({
  news,
  onClose,
  onConfirm,
}: {
  news: News;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const deleteMutation = useDeleteNews();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Hapus Berita?</p>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
              {news.title}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Berita yang dihapus tidak dapat dikembalikan. Tindakan ini bersifat permanen.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
          >
            Batal
          </button>
          <button
            onClick={() => deleteMutation.mutate(news.id, { onSuccess: onClose })}
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

// ─── Main page ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function NewsList() {
  usePageTitle("Kelola Berita");

  const { data: newsList, isLoading, error, refetch } = useNews();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formNews, setFormNews] = useState<News | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<News | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    if (!newsList) return [];
    if (!debouncedSearch.trim()) return newsList;
    const q = debouncedSearch.toLowerCase();
    return newsList.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [newsList, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleAdd() {
    setFormNews(null);
    setShowForm(true);
  }

  function handleEdit(news: News) {
    setFormNews(news);
    setShowForm(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Newspaper size={18} className="text-brand-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Berita
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Kelola Berita
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {newsList?.length ?? 0} berita terbit
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
        >
          <Plus size={16} />
          Tambah Berita
        </button>
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
          placeholder="Cari judul atau konten..."
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
      ) : error ? (
        <ErrorState message="Gagal memuat data berita." onRetry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Judul
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Tanggal Publish
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <FileText size={24} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">
                        {search ? "Berita tidak ditemukan" : "Belum ada berita"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((n) => (
                    <tr
                      key={n.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[300px]">
                          {n.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[300px]">
                          {n.content}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={n.type} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                        {formatShortDate(n.published_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(n)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(n)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
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
                {filtered.length} berita · Halaman {safePage} dari {totalPages}
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

      {/* Modals */}
      {showForm && <NewsForm news={formNews} onClose={() => setShowForm(false)} />}
      {deleteTarget && (
        <DeleteModal
          news={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
