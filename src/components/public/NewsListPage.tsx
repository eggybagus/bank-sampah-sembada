import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Newspaper,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  Lightbulb,
  Filter,
} from "lucide-react";
import ErrorState from "../common/ErrorState";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNews } from "../../hooks/useNews";
import { formatDate } from "../../utils/formatters";
import type { News } from "../../types";

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const newsTypeConfig: Record<
  News["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  announcement: {
    label: "Pengumuman",
    icon: <Info size={12} />,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  price_update: {
    label: "Update Harga",
    icon: <Package size={12} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  tips: {
    label: "Tips",
    icon: <Lightbulb size={12} />,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  general: {
    label: "Umum",
    icon: <Newspaper size={12} />,
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const filterOptions: { value: News["type"] | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "announcement", label: "Pengumuman" },
  { value: "price_update", label: "Update Harga" },
  { value: "tips", label: "Tips" },
  { value: "general", label: "Umum" },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewsListPage() {
  usePageTitle("Berita");

  const { data: allNews, isLoading, error } = useNews();
  const [activeFilter, setActiveFilter] = useState<News["type"] | "all">("all");
  const [page, setPage] = useState(1);

  const filteredNews = useMemo(() => {
    if (!allNews) return [];
    if (activeFilter === "all") return allNews;
    return allNews.filter((n) => n.type === activeFilter);
  }, [allNews, activeFilter]);

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  const paginatedNews = filteredNews.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: News["type"] | "all") => {
    setActiveFilter(value);
    setPage(1);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Newspaper size={18} className="text-brand-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Berita & Info
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Semua Berita
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Update informasi terkini seputar Bank Sampah Sembada
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <Filter size={14} className="text-slate-400 shrink-0 mr-1" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeFilter === opt.value
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <NewsSkeleton />
        ) : error ? (
          <ErrorState message="Gagal memuat berita. Silakan coba lagi nanti." />
        ) : paginatedNews.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Newspaper size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              Tidak ada berita untuk kategori ini
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {paginatedNews.map((item) => {
                const config = newsTypeConfig[item.type];
                return (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="group flex flex-col p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.color}`}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {formatDate(item.published_at)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed mb-4 flex-1">
                      {item.content}
                    </p>

                    <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:text-brand-700 transition-colors">
                      Baca Selengkapnya
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          p === page
                            ? "bg-brand-600 text-white shadow-sm"
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
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Results count */}
            <p className="text-center text-xs text-slate-400 font-medium mt-4">
              Menampilkan {paginatedNews.length} dari {filteredNews.length}{" "}
              berita
            </p>
          </>
        )}
      </div>
    </div>
  );
}
