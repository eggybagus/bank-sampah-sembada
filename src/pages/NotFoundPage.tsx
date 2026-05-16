import { usePageTitle } from "../hooks/usePageTitle";
import { Link } from "react-router-dom";
import { Leaf, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  usePageTitle("Halaman Tidak Ditemukan");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-6">
        <Leaf size={32} className="text-brand-500" />
      </div>

      {/* Copy */}
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
        Halaman tidak ditemukan
      </p>
      <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-3">
        404
      </h1>
      <p className="text-slate-500 font-medium text-sm max-w-xs">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>

      {/* CTA */}
      <Link
        to="/"
        className="mt-8 flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
      >
        <ArrowLeft size={15} />
        Kembali ke Beranda
      </Link>
    </div>
  );
}
