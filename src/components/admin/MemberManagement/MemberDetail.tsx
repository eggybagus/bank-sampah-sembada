import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, Wallet, Package, Banknote, Loader2, Calendar, CheckCircle2, Ban } from "lucide-react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useMemberById } from "../../../hooks/useMembers";
import { useDeposits } from "../../../hooks/useDeposits";
import { useMemberWithdrawals } from "../../../hooks/useWithdrawal";
import { formatRupiah } from "../../../utils/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
	return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function Skeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="h-8 bg-slate-100 rounded-xl w-48" />
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="h-24 bg-slate-100 rounded-2xl" />
				<div className="h-24 bg-slate-100 rounded-2xl" />
				<div className="h-24 bg-slate-100 rounded-2xl" />
			</div>
			<div className="h-64 bg-slate-100 rounded-2xl" />
		</div>
	);
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "deposits" | "withdrawals";

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MemberDetail() {
	usePageTitle("Detail Member");

	const { id } = useParams<{ id: string }>();
	const memberId = id ?? "";
	const [activeTab, setActiveTab] = useState<Tab>("deposits");

	const { data: member, isLoading: memberLoading } = useMemberById(memberId);
	const { data: deposits, isLoading: depositsLoading } = useDeposits(memberId);
	const { data: withdrawals, isLoading: withdrawalsLoading } = useMemberWithdrawals(memberId);

	const isLoading = memberLoading || depositsLoading || withdrawalsLoading;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 size={28} className="animate-spin text-brand-600" />
			</div>
		);
	}

	if (!member) {
		return (
			<div className="text-center py-16">
				<User size={32} className="text-slate-300 mx-auto mb-3" />
				<p className="text-sm font-bold text-slate-400">Member tidak ditemukan</p>
				<Link to="/admin/members" className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-brand-600 hover:text-brand-700">
					<ArrowLeft size={12} />
					Kembali ke daftar member
				</Link>
			</div>
		);
	}

	const balance = member.member_balance;

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
			{/* Back + header */}
			<div>
				<Link
					to="/admin/members"
					className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3"
				>
					<ArrowLeft size={12} />
					Kembali
				</Link>
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
							<User size={22} className="text-brand-600" />
						</div>
						<div>
							<h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{member.full_name}</h1>
							<div className="flex items-center gap-3 mt-1">
								<p className="text-xs text-slate-500 font-medium flex items-center gap-1">
									<Phone size={10} />
									{member.phone_number}
								</p>
								<span
									className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-full border ${
										member.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
									}`}
								>
									{member.is_active ? <CheckCircle2 size={10} /> : <Ban size={10} />}
									{member.is_active ? "Aktif" : "Nonaktif"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Stats cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)]">
					<div className="flex items-center gap-2 mb-2">
						<Wallet size={14} className="text-emerald-500" />
						<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</span>
					</div>
					<p className="text-xl font-black text-slate-900">{formatRupiah(balance?.total_balance ?? 0)}</p>
				</div>
				<div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)]">
					<div className="flex items-center gap-2 mb-2">
						<Package size={14} className="text-brand-500" />
						<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Deposit</span>
					</div>
					<p className="text-xl font-black text-slate-900">{formatRupiah(deposits?.reduce((s, d) => s + d.total_rupiah, 0) ?? 0)}</p>
					<p className="text-[10px] text-slate-400 font-medium mt-0.5">{deposits?.length ?? 0} transaksi</p>
				</div>
				<div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)]">
					<div className="flex items-center gap-2 mb-2">
						<Banknote size={14} className="text-blue-500" />
						<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dicairkan</span>
					</div>
					<p className="text-xl font-black text-slate-900">{formatRupiah(balance?.total_withdrawn ?? 0)}</p>
					<p className="text-[10px] text-slate-400 font-medium mt-0.5">{withdrawals?.filter((w) => w.status === "completed").length ?? 0} selesai</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
				<div className="flex border-b border-slate-100">
					<button
						onClick={() => setActiveTab("deposits")}
						className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
							activeTab === "deposits" ? "text-brand-600 border-brand-600" : "text-slate-400 border-transparent hover:text-slate-600"
						}`}
					>
						Riwayat Deposit
					</button>
					<button
						onClick={() => setActiveTab("withdrawals")}
						className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
							activeTab === "withdrawals" ? "text-brand-600 border-brand-600" : "text-slate-400 border-transparent hover:text-slate-600"
						}`}
					>
						Riwayat Penarikan
					</button>
				</div>

				<div className="p-4">
					{activeTab === "deposits" ? (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[500px]">
								<thead className="bg-slate-50/50 border-b border-slate-100">
									<tr>
										<th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Tanggal</th>
										<th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Jenis</th>
										<th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Berat</th>
										<th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Total</th>
										<th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
									</tr>
								</thead>
								<tbody>
									{!deposits || deposits.length === 0 ? (
										<tr>
											<td colSpan={5} className="px-3 py-8 text-center">
												<Package size={20} className="text-slate-300 mx-auto mb-2" />
												<p className="text-xs text-slate-400 font-medium">Belum ada deposit</p>
											</td>
										</tr>
									) : (
										deposits.map((d) => (
											<tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
												<td className="px-3 py-2.5 text-xs text-slate-400 font-medium whitespace-nowrap">{formatShortDate(d.deposit_date)}</td>
												<td className="px-3 py-2.5 text-xs font-medium text-slate-700">{d.trash_type?.name ?? "-"}</td>
												<td className="px-3 py-2.5 text-xs font-medium text-slate-600 whitespace-nowrap">{d.weight_kg} kg</td>
												<td className="px-3 py-2.5 text-xs font-black text-slate-900 text-right whitespace-nowrap">{formatRupiah(d.total_rupiah)}</td>
												<td className="px-3 py-2.5">
													{d.is_withdrawn ? (
														<span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full border border-slate-100">
															Dicairkan
														</span>
													) : (
														<span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
															Tersedia
														</span>
													)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[500px]">
								<thead className="bg-slate-50/50 border-b border-slate-100">
									<tr>
										<th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Tanggal</th>
										<th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipe</th>
										<th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Jumlah</th>
										<th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
									</tr>
								</thead>
								<tbody>
									{!withdrawals || withdrawals.length === 0 ? (
										<tr>
											<td colSpan={4} className="px-3 py-8 text-center">
												<Banknote size={20} className="text-slate-300 mx-auto mb-2" />
												<p className="text-xs text-slate-400 font-medium">Belum ada withdrawal</p>
											</td>
										</tr>
									) : (
										withdrawals.map((w) => (
											<tr key={w.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
												<td className="px-3 py-2.5 text-xs text-slate-400 font-medium whitespace-nowrap">{formatShortDate(w.created_at)}</td>
												<td className="px-3 py-2.5 text-xs font-medium text-slate-700">
													{w.withdrawal_type === "manual" ? "Tarik Manual" : "Transfer Bank"}
												</td>
												<td className="px-3 py-2.5 text-xs font-black text-slate-900 text-right whitespace-nowrap">{formatRupiah(w.total_amount)}</td>
												<td className="px-3 py-2.5">
													{w.status === "pending" && (
														<span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100">
															Menunggu
														</span>
													)}
													{w.status === "completed" && (
														<span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
															Selesai
														</span>
													)}
													{w.status === "cancelled" && (
														<span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100">
															Dibatalkan
														</span>
													)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
