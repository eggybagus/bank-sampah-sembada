import { Link, Outlet, useLocation } from "react-router-dom";
import { Leaf, LogIn, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const { isAuthenticated, isAdmin } = useAuth();
  const dashboardPath = isAdmin ? "/admin" : "/member";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm shadow-brand-200 group-hover:scale-105 transition-transform duration-200">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="text-sm font-black text-slate-900 tracking-tight">
              Bank Sampah Sembada
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-bold transition-colors ${
                isHome ? "text-brand-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Beranda
            </Link>
            <Link
              to="/news"
              className={`text-sm font-bold transition-colors ${
                location.pathname.startsWith("/news")
                  ? "text-brand-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Berita
            </Link>
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-sm shadow-brand-200"
              >
                <LayoutDashboard size={15} />
                Ke Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-sm shadow-brand-200"
              >
                <LogIn size={15} />
                Masuk
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isHome
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Beranda
            </Link>
            <Link
              to="/news"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                location.pathname.startsWith("/news")
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Berita
            </Link>
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-bold text-brand-600 hover:bg-brand-50 transition-colors"
              >
                Ke Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-bold text-brand-600 hover:bg-brand-50 transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm shadow-brand-200">
                <Leaf size={16} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 tracking-tight block">
                  Bank Sampah Sembada
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Sistem Pengelolaan Bank Sampah Digital
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Beranda
              </Link>
              <Link
                to="/news"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Berita
              </Link>
              <Link
                to="/login"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Masuk
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-slate-300 font-medium">
              © {new Date().getFullYear()} Bank Sampah Sembada
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Semua hak dilindungi
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
