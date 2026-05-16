import { Link } from "react-router-dom";
import {
  Leaf,
  Recycle,
  Newspaper,
  ArrowRight,
  Loader2,
  Package,
  FileText,
  Lightbulb,
  Info,
} from "lucide-react";
import ErrorState from "../common/ErrorState";
import { usePageTitle } from "../../hooks/usePageTitle";
import { usePrices } from "../../hooks/usePrices";
import { useNews } from "../../hooks/useNews";
import { formatRupiah } from "../../utils/formatters";
import { formatDate } from "../../utils/formatters";
import type { News } from "../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const categoryIcons: Record<string, React.ReactNode> = {
  Plastik: <Recycle size={20} />,
  Kertas: <FileText size={20} />,
  Logam: <Package size={20} />,
  Kaca: <Package size={20} />,
};

const categoryColors: Record<string, string> = {
  Plastik: "text-blue-600 bg-blue-50 border-blue-100",
  Kertas: "text-amber-600 bg-amber-50 border-amber-100",
  Logam: "text-slate-600 bg-slate-100 border-slate-200",
  Kaca: "text-emerald-600 bg-emerald-50 border-emerald-100",
};

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

// ─── Loading skeletons ───────────────────────────────────────────────────────

function PricesSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-24 bg-slate-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-28 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-600">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-white/90 text-xs font-bold mb-6">
            <Leaf size={14} />
            Bank Sampah Digital
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Bank Sampah Sembada
          </h1>
          <p className="text-lg sm:text-xl text-brand-100 font-medium leading-relaxed mb-8">
            Ubah sampahmu menjadi rupiah. Lestarikan lingkungan, tingkatkan
            ekonomi keluarga bersama Bank Sampah Sembada.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-bold rounded-xl text-sm hover:bg-brand-50 transition-all shadow-lg"
            >
              <Newspaper size={16} />
              Lihat Berita
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white font-bold rounded-xl text-sm hover:bg-brand-800 transition-all border border-brand-500/30"
            >
              <ArrowRight size={16} />
              Masuk sebagai Member
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricesSection() {
  const { data: groupedPrices, isLoading, error, dataUpdatedAt } = usePrices();

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Recycle size={18} className="text-brand-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Harga Terkini
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Daftar Harga Sampah
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Harga per kilogram yang berlaku saat ini
            </p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-400 font-medium">
              Diperbarui: {lastUpdated}
            </span>
          )}
        </div>

        {isLoading ? (
          <PricesSkeleton />
        ) : error ? (
          <ErrorState message="Gagal memuat harga. Silakan coba lagi nanti." />
        ) : !groupedPrices || groupedPrices.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Package size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              Belum ada data harga tersedia
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedPrices.map((group) => (
              <div key={group.category}>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      categoryColors[group.category]?.split(" ").slice(1).join(" ") ??
                      "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <span className={categoryColors[group.category]?.split(" ")[0] ?? "text-slate-600"}>
                      {categoryIcons[group.category] ?? <Package size={16} />}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {group.category}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.trash_type.name}
                        </h4>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            item.trash_type.is_accepted
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-red-50 text-red-600 border-red-100"
                          }`}
                        >
                          {item.trash_type.is_accepted ? "Diterima" : "Tidak Diterima"}
                        </span>
                      </div>

                      {item.trash_type.description && (
                        <p className="text-xs text-slate-400 font-medium mb-3 line-clamp-2">
                          {item.trash_type.description}
                        </p>
                      )}

                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          {formatRupiah(item.price_per_kg)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          /kg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LatestNewsSection() {
  const { data: news, isLoading, error } = useNews(6);

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Newspaper size={18} className="text-brand-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Berita Terbaru
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Info & Pengumuman
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Update terkini seputar Bank Sampah Sembada
            </p>
          </div>
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Lihat Semua
            <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <NewsSkeleton />
        ) : error ? (
          <ErrorState message="Gagal memuat berita. Silakan coba lagi nanti." />
        ) : !news || news.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Newspaper size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              Belum ada berita tersedia
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item) => {
              const config = newsTypeConfig[item.type];
              return (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="group flex flex-col p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-100 transition-all"
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
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  usePageTitle("Beranda");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <HeroSection />
      <PricesSection />
      <LatestNewsSection />
    </div>
  );
}
