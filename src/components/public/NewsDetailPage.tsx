import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Newspaper,
  Info,
  Package,
  Lightbulb,
  Calendar,
} from "lucide-react";
import ErrorState from "../common/ErrorState";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNewsById } from "../../hooks/useNews";
import { formatDate } from "../../utils/formatters";
import type { News } from "../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const newsTypeConfig: Record<
  News["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  announcement: {
    label: "Pengumuman",
    icon: <Info size={14} />,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  price_update: {
    label: "Update Harga",
    icon: <Package size={14} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  tips: {
    label: "Tips",
    icon: <Lightbulb size={14} />,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  general: {
    label: "Umum",
    icon: <Newspaper size={14} />,
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewsDetailPage() {
  usePageTitle("Detail Berita");

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: news, isLoading, error } = useNewsById(id ?? "");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-200 rounded-full blur-xl opacity-20 animate-pulse" />
          <Loader2 size={40} className="animate-spin text-brand-600 relative z-10" />
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">
          Memuat berita...
        </p>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <ErrorState
          message="Berita yang Anda cari mungkin telah dihapus atau URL tidak valid."
        />
        <div className="flex justify-center mt-6">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-all"
          >
            <ArrowLeft size={14} />
            Kembali ke Daftar Berita
          </Link>
        </div>
      </div>
    );
  }

  const config = newsTypeConfig[news.type];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        {/* Article card */}
        <article className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-10 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${config.color}`}
              >
                {config.icon}
                {config.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Calendar size={12} />
                {formatDate(news.published_at)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {news.title}
            </h1>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-10">
            <div className="prose prose-slate max-w-none">
              {news.content.split("\n").map((paragraph, idx) =>
                paragraph.trim() ? (
                  <p
                    key={idx}
                    className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mb-4 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ) : null
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-10 py-5 bg-slate-50/50 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-medium">
                Dipublikasikan pada{" "}
                {new Date(news.published_at).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <Link
                to="/news"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
              >
                <ArrowLeft size={12} />
                Lihat berita lainnya
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
