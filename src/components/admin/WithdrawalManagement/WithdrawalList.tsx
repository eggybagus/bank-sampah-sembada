import { useState, useMemo, useRef, useEffect } from "react";
import { Banknote, Search, X, Clock, CheckCircle2, Ban, Eye, RefreshCw } from "lucide-react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import ErrorState from "../../../components/common/ErrorState";
import { useAllWithdrawalRequests } from "../../../hooks/useWithdrawal";
import { supabase } from "../../../lib/supabase";
import { formatRupiah } from "../../../utils/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { WithdrawalWithRelations } from "../../../types";
import WithdrawalDetailModal from "./WithdrawalDetailModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
	return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

function useDebounce<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
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

function StatusBadge({ status }: { status: WithdrawalWithRelations["status"] }) {
	if (status === "pending") {
		return (
			<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100">
				<Clock size={10} />
				Menunggu
			</span>
		);
	}
	if (status === "completed") {
		return (
			<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
				<CheckCircle2 size={10} />
				Selesai
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100">
			<Ban size={10} />
			Dibatalkan
		</span>
	);
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "all" | "pending" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
	{ key: "all", label: "Semua" },
	{ key: "pending", label: "Menunggu" },
	{ key: "completed", label: "Selesai" },
	{ key: "cancelled", label: "Dibatalkan" },
];

// ─── Main page ───────────────────────────────────────────────────────────────

export default function WithdrawalList() {
	usePageTitle("Kelola Penarikan");

	const { data: withdrawals, isLoading, error, refetch, dataUpdatedAt } = useAllWithdrawalRequests();
	const [search, setSearch] = useState("");
	const [activeTab, setActiveTab] = useState<Tab>("all");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const instanceId = useRef(crypto.randomUUID());

	const debouncedSearch = useDebounce(search, 300);

	// Realtime subscription for withdrawal updates
	const qc = useAllWithdrawalRequests().refetch;
	useEffect(() => {
		const channel = supabase
			.channel(`withdrawals-admin-${instanceId.current}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "withdrawal_requests",
				},
				() => {
					refetch();
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [refetch]);

	const filtered = useMemo(() => {
		if (!withdrawals) return [];
		let list = withdrawals;
		if (activeTab !== "all") {
			list = list.filter((w) => w.status === activeTab);
		}
		if (debouncedSearch.trim()) {
			const q = debouncedSearch.toLowerCase();
			list = list.filter((w) => w.member?.full_name.toLowerCase().includes(q) || w.member?.phone_number.toLowerCase().includes(q));
		}
		return list;
	}, [withdrawals, activeTab, debouncedSearch]);

	const counts = useMemo(() => {
		const all = withdrawals?.length ?? 0;
		const pending = withdrawals?.filter((w) => w.status === "pending").length ?? 0;
		const completed = withdrawals?.filter((w) => w.status === "completed").length ?? 0;
		const cancelled = withdrawals?.filter((w) => w.status === "cancelled").length ?? 0;
		return { all, pending, completed, cancelled };
	}, [withdrawals]);

	const selectedWithdrawal = useMemo(() => withdrawals?.find((w) => w.id === selectedId) ?? null, [withdrawals, selectedId]);

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Banknote size={18} className="text-brand-600" />
						<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penarikan</span>
					</div>
					<h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Kelola Penarikan</h1>
					<p className="text-sm text-slate-500 font-medium mt-1">
						{counts.pending} menunggu proses · {counts.completed} selesai
					</p>
				</div>
				<button
					onClick={() => refetch()}
					className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
				>
					<RefreshCw size={14} />
					Refresh
				</button>
			</div>

			{/* Search */}
			<div className="relative max-w-md">
				<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Cari member..."
					className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400"
				/>
				{search && (
					<button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
						<X size={14} />
					</button>
				)}
			</div>

			{/* Tabs */}
			<div className="flex flex-wrap gap-2">
				{TABS.map((t) => (
					<button
						key={t.key}
						onClick={() => setActiveTab(t.key)}
						className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
							activeTab === t.key
								? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200"
								: "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
						}`}
					>
						{t.label}
						<span
							className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
								activeTab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
							}`}
						>
							{counts[t.key]}
						</span>
					</button>
				))}
			</div>

			{/* Table */}
			{isLoading ? (
				<TableSkeleton />
			) : error ? (
				<ErrorState message="Gagal memuat data penarikan." onRetry={refetch} />
			) : (
				<div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[700px]">
							<thead className="bg-slate-50/50 border-b border-slate-100">
								<tr>
									<th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Member</th>
									<th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipe</th>
									<th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Jumlah</th>
									<th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
									<th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Tanggal</th>
									<th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={6} className="px-4 py-10 text-center">
											<Banknote size={24} className="text-slate-300 mx-auto mb-2" />
											<p className="text-xs text-slate-400 font-medium">{search ? "Tidak ditemukan" : "Tidak ada withdrawal"}</p>
										</td>
									</tr>
								) : (
									filtered.map((w) => (
										<tr key={w.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
											<td className="px-4 py-3">
												<p className="text-xs font-bold text-slate-900">{w.member?.full_name ?? "-"}</p>
												<p className="text-[10px] text-slate-400 font-medium">{w.member?.phone_number ?? "-"}</p>
											</td>
											<td className="px-4 py-3 text-xs font-medium text-slate-600">
												{w.withdrawal_type === "manual" ? "Tarik Manual" : "Transfer Bank"}
											</td>
											<td className="px-4 py-3 text-xs font-black text-slate-900 text-right whitespace-nowrap">{formatRupiah(w.total_amount)}</td>
											<td className="px-4 py-3">
												<StatusBadge status={w.status} />
											</td>
											<td className="px-4 py-3 text-xs text-slate-400 font-medium whitespace-nowrap">{formatShortDate(w.created_at)}</td>
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-1">
													<button
														onClick={() => setSelectedId(w.id)}
														className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
														title="Detail"
													>
														<Eye size={14} />
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{selectedWithdrawal && <WithdrawalDetailModal withdrawal={selectedWithdrawal} onClose={() => setSelectedId(null)} />}
		</div>
	);
}
