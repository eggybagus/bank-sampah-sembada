import { useState, useCallback } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Leaf, LayoutDashboard, DollarSign, Users, PackagePlus, Banknote, Newspaper, FileBarChart, LogOut, Menu, X, UserCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMediaQuery } from "../hooks/useMediaQuery";

// ─── Sidebar nav config ───────────────────────────────────────────────────────
const NAV_ITEMS = [
	{ to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
	{ to: "/admin/prices", label: "Kelola Harga", icon: <DollarSign size={18} /> },
	{ to: "/admin/members", label: "Kelola Member", icon: <Users size={18} /> },
	{ to: "/admin/deposit", label: "Input Deposit", icon: <PackagePlus size={18} /> },
	{ to: "/admin/withdrawals", label: "Kelola Penarikan", icon: <Banknote size={18} /> },
	{ to: "/admin/news", label: "Kelola Berita", icon: <Newspaper size={18} /> },
	{ to: "/admin/reports", label: "Laporan", icon: <FileBarChart size={18} /> },
] as const;

// ─── Nav item ─────────────────────────────────────────────────────────────────
interface NavItemProps {
	to: string;
	label: string;
	icon: React.ReactNode;
	end?: boolean;
	onClick?: () => void;
}

function NavItem({ to, label, icon, end, onClick }: NavItemProps) {
	return (
		<NavLink
			to={to}
			end={end}
			onClick={onClick}
			className={({ isActive }) =>
				[
					"group flex items-center justify-between px-4 py-3 rounded-2xl",
					"transition-all duration-200 border",
					isActive
						? "bg-brand-50/60 border-brand-100/50 text-brand-700 shadow-sm"
						: "bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900",
				].join(" ")
			}
		>
			{({ isActive }) => (
				<>
					<div className="flex items-center gap-3.5">
						<span className={isActive ? "text-brand-600" : ""}>{icon}</span>
						<span className="text-sm font-bold tracking-tight">{label}</span>
					</div>
					{isActive ? <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" /> : null}
				</>
			)}
		</NavLink>
	);
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ onClose, onSignOut, adminName }: { onClose?: () => void; onSignOut: () => void; adminName: string }) {
	return (
		<aside className="w-[260px] bg-white border-r border-slate-200/60 flex flex-col h-full shadow-[2px_0_24px_-12px_rgba(0,0,0,0.06)]">
			{/* Logo */}
			<div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
				<div className="flex items-center gap-2.5">
					<div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm shadow-brand-200">
						<Leaf size={16} className="text-white" />
					</div>
					<div>
						<p className="text-xs font-black text-slate-900 leading-none">Bank Sampah</p>
						<p className="text-xs font-black text-brand-600 leading-none">Sembada</p>
					</div>
				</div>
				{/* Close button — mobile only */}
				{onClose ? (
					<button
						onClick={onClose}
						className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
						aria-label="Tutup sidebar"
					>
						<X size={18} />
					</button>
				) : null}
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
				<div className="px-4 pb-2">
					<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigasi</span>
				</div>
				{NAV_ITEMS.map((item) => (
					<NavItem key={item.to} {...item} onClick={onClose} />
				))}
			</nav>

			{/* User footer */}
			<div className="p-4 border-t border-slate-100">
				<div className="flex items-center gap-3 px-2 py-2 mb-2">
					<div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
						<UserCircle size={18} className="text-slate-500" />
					</div>
					<div className="min-w-0">
						<p className="text-xs font-black text-slate-900 truncate">{adminName}</p>
						<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin</p>
					</div>
				</div>
				<button
					onClick={onSignOut}
					className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
				>
					<LogOut size={15} />
					Keluar
				</button>
			</div>
		</aside>
	);
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout() {
	const { profile, signOut } = useAuth();
	const isMobile = useMediaQuery("(max-width: 1023px)");
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Functional setState — stable, no stale closure (Vercel rule).
	const openSidebar = useCallback(() => setSidebarOpen(true), []);
	const closeSidebar = useCallback(() => setSidebarOpen(false), []);

	const adminName = profile?.full_name ?? "Administrator";

	return (
		<div className="flex h-screen bg-slate-50 overflow-hidden">
			{/* ── Desktop sidebar ── */}
			{!isMobile ? <Sidebar onSignOut={signOut} adminName={adminName} /> : null}

			{/* ── Mobile: overlay + slide-in sidebar ── */}
			{isMobile && sidebarOpen ? (
				<>
					{/* Backdrop */}
					<div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={closeSidebar} aria-hidden="true" />
					{/* Slide-in panel */}
					<div className="fixed inset-y-0 left-0 z-40 animate-in slide-in-from-left duration-200">
						<Sidebar onClose={closeSidebar} onSignOut={signOut} adminName={adminName} />
					</div>
				</>
			) : null}

			{/* ── Main content ── */}
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				{/* Mobile top bar */}
				{isMobile ? (
					<div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100">
						<button
							onClick={openSidebar}
							className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
							aria-label="Buka menu"
						>
							<Menu size={20} />
						</button>
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
								<Leaf size={13} className="text-white" />
							</div>
							<span className="text-sm font-black text-slate-900">Bank Sampah Sembada</span>
						</div>
						<button onClick={signOut} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" aria-label="Keluar">
							<LogOut size={18} />
						</button>
					</div>
				) : null}

				{/* Page content */}
				<main className="flex-1 overflow-y-auto p-6 lg:p-8">
					<div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
