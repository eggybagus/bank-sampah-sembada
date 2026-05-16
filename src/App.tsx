import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { useAuth } from "./hooks/useAuth";

import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/AdminLayout";
import MemberLayout from "./pages/MemberLayout";
import PublicLayout from "./pages/PublicLayout";
import NotFoundPage from "./pages/NotFoundPage";

import HomePage from "./components/public/HomePage";
import NewsListPage from "./components/public/NewsListPage";
import NewsDetailPage from "./components/public/NewsDetailPage";

import MemberDashboard from "./components/member/MemberDashboard";
import DepositList from "./components/member/DepositHistory/DepositList";
import NotificationCenter from "./components/member/NotificationCenter";
import WithdrawalStepper from "./components/member/WithdrawalFlow/WithdrawalStepper";
import MemberWithdrawalList from "./components/member/WithdrawalHistory/WithdrawalList";
import MemberAccountSettings from "./components/member/AccountSettings";
import CompleteProfile from "./components/common/CompleteProfile";

import AdminDashboard from "./components/admin/AdminDashboard";
import DepositForm from "./components/admin/DepositForm";
import PriceList from "./components/admin/PriceManagement/PriceList";
import MemberList from "./components/admin/MemberManagement/MemberList";
import MemberDetail from "./components/admin/MemberManagement/MemberDetail";
import AdminWithdrawalList from "./components/admin/WithdrawalManagement/WithdrawalList";
import NewsList from "./components/admin/NewsManagement/NewsList";
import MonthlyReport from "./components/admin/Reports/MonthlyReport";
import AccountSettings from "./components/admin/AccountSettings";

// ─── Query client ────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

// ─── Auth redirect guard (login page) ────────────────────────────────────────

// Hoisted — never recreated between renders.
const authLoadingScreen = (
	<div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6">
		<div className="relative">
			<div className="absolute inset-0 bg-brand-200 rounded-full blur-xl opacity-30 animate-pulse" />
			<Loader2 size={44} className="animate-spin text-brand-600 relative z-10" />
		</div>
		<p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Memuat...</p>
	</div>
);

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, profile, loading, needsProfileCompletion, user } = useAuth();
	if (loading) return authLoadingScreen;
	// If user is logged in but needs to complete profile, redirect to complete-profile
	if (user && needsProfileCompletion) {
		return <Navigate to="/complete-profile" replace />;
	}
	if (isAuthenticated && profile) {
		return <Navigate to={profile.role === "admin" ? "/admin" : "/member"} replace />;
	}
	return <>{children}</>;
}

// ─── Placeholder (replaced as real pages land) ───────────────────────────────

const Placeholder = ({ title }: { title: string }) => (
	<div className="flex flex-col items-center justify-center h-64 gap-3">
		<p className="text-slate-400 font-bold">{title}</p>
		<p className="text-xs text-slate-300">Halaman ini sedang dalam pengembangan</p>
	</div>
);

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<NotificationProvider>
					<BrowserRouter>
						<Routes>
							{/* ── Public (no auth) ── */}
							<Route path="/" element={<PublicLayout />}>
								<Route index element={<HomePage />} />
								<Route path="news" element={<NewsListPage />} />
								<Route path="news/:id" element={<NewsDetailPage />} />
							</Route>

							{/* ── Login ── */}
							<Route
								path="/login"
								element={
									<RedirectIfAuthenticated>
										<LoginPage />
									</RedirectIfAuthenticated>
								}
							/>

							{/* ── Complete Profile (requires auth but no role yet) ── */}
							<Route path="/complete-profile" element={<CompleteProfile />} />

							{/* ── Admin zone ── */}
							<Route path="/admin" element={<ProtectedRoute role="admin" />}>
								<Route element={<AdminLayout />}>
									<Route index element={<Navigate to="dashboard" replace />} />
									<Route path="dashboard" element={<AdminDashboard />} />
									<Route path="prices" element={<PriceList />} />
									<Route path="members" element={<MemberList />} />
									<Route path="members/:id" element={<MemberDetail />} />
									<Route path="deposit" element={<DepositForm />} />
									<Route path="withdrawals" element={<AdminWithdrawalList />} />
									<Route path="news" element={<NewsList />} />
									<Route path="reports" element={<MonthlyReport />} />
									<Route path="settings" element={<MemberAccountSettings />} />
								</Route>
							</Route>

							{/* ── Member zone ── */}
							<Route path="/member" element={<ProtectedRoute role="member" />}>
								<Route element={<MemberLayout />}>
									<Route index element={<Navigate to="dashboard" replace />} />
									<Route path="dashboard" element={<MemberDashboard />} />
									<Route path="deposits" element={<DepositList />} />
									<Route path="withdrawal" element={<WithdrawalStepper />} />
									<Route path="withdrawals" element={<MemberWithdrawalList />} />
									<Route path="notifications" element={<NotificationCenter />} />
									<Route path="settings" element={<AccountSettings />} />
								</Route>
							</Route>

							{/* ── 404 ── */}
							<Route path="*" element={<NotFoundPage />} />
						</Routes>

						<Toaster
							position="top-right"
							toastOptions={{
								duration: 4000,
								style: {
									fontFamily: "var(--font-sans)",
									fontSize: "14px",
									fontWeight: 500,
								},
								success: {
									iconTheme: { primary: "#16a34a", secondary: "#fff" },
								},
								error: {
									iconTheme: { primary: "#dc2626", secondary: "#fff" },
								},
							}}
						/>
					</BrowserRouter>
				</NotificationProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}
