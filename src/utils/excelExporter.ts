import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { DepositWithRelations, WithdrawalWithRelations, MemberWithBalance } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiahNum(n: number): number {
  return Math.round(n);
}

function getMonthName(month: number): string {
  const names = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return names[month - 1];
}

function getMonthStartEnd(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchMonthlyData(year: number, month: number) {
  const { start, end } = getMonthStartEnd(year, month);

  // Deposits in month
  const { data: depositsData, error: depositsError } = await supabase
    .from("deposits")
    .select(
      "*, trash_type:trash_types(*), member:profiles!deposits_member_id_fkey(id, full_name, phone_number)"
    )
    .gte("deposit_date", start.slice(0, 10))
    .lte("deposit_date", end.slice(0, 10))
    .order("deposit_date", { ascending: true });
  if (depositsError) throw depositsError;

  // Withdrawals in month (by created_at)
  const { data: withdrawalsData, error: withdrawalsError } = await supabase
    .from("withdrawal_requests")
    .select(
      "*, member:profiles!withdrawal_requests_member_id_fkey(id, full_name, phone_number)"
    )
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });
  if (withdrawalsError) throw withdrawalsError;

  // All members with balances
  const { data: membersData, error: membersError } = await supabase
    .from("profiles")
    .select("*, member_balance:member_balances(*)")
    .eq("role", "member")
    .order("full_name");
  if (membersError) throw membersError;

  return {
    deposits: (depositsData ?? []) as DepositWithRelations[],
    withdrawals: (withdrawalsData ?? []) as WithdrawalWithRelations[],
    members: (membersData ?? []) as MemberWithBalance[],
  };
}

// ─── Sheet builders ──────────────────────────────────────────────────────────

function buildSummarySheet(
  deposits: DepositWithRelations[],
  withdrawals: WithdrawalWithRelations[],
  members: MemberWithBalance[],
  year: number,
  month: number
): XLSX.WorkSheet {
  const totalMemberActive = members.filter((m) => m.is_active).length;
  const totalDepositCount = deposits.length;
  const totalWeight = deposits.reduce((s, d) => s + (d.weight_kg ?? 0), 0);
  const totalDepositValue = deposits.reduce((s, d) => s + (d.total_rupiah ?? 0), 0);
  const completedWithdrawals = withdrawals.filter((w) => w.status === "completed");
  const totalWithdrawalCount = completedWithdrawals.length;
  const totalWithdrawalValue = completedWithdrawals.reduce((s, w) => s + (w.total_amount ?? 0), 0);
  const totalUnwithdrawn = members.reduce((s, m) => s + (m.member_balance?.total_balance ?? 0), 0);

  const rows: (string | number)[][] = [
    ["Laporan Bulanan Bank Sampah Sembada"],
    [`Periode: ${getMonthName(month)} ${year}`],
    [`Dibuat pada: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: id })}`],
    [],
    ["Ringkasan", "Nilai"],
    ["Total Member Aktif", totalMemberActive],
    ["Total Deposit Bulan Ini", totalDepositCount],
    ["Total Berat Sampah (kg)", totalWeight],
    ["Total Nilai Deposit (Rp)", totalDepositValue],
    ["Total Penarikan Selesai", totalWithdrawalCount],
    ["Total Nilai Penarikan (Rp)", totalWithdrawalValue],
    ["Total Saldo Belum Dicairkan (Rp)", totalUnwithdrawn],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [{ wch: 40 }, { wch: 25 }];

  // Merge title cells
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];

  return ws;
}

function buildDepositSheet(deposits: DepositWithRelations[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ["No", "Tanggal", "Nama Member", "No HP", "Kategori", "Jenis Sampah", "Berat (kg)", "Harga/kg (Rp)", "Total (Rp)"],
  ];

  let totalWeight = 0;
  let totalValue = 0;

  deposits.forEach((d, i) => {
    const weight = d.weight_kg ?? 0;
    const price = d.price_per_kg ?? 0;
    const total = d.total_rupiah ?? 0;
    totalWeight += weight;
    totalValue += total;

    rows.push([
      i + 1,
      d.deposit_date,
      d.member?.full_name ?? "-",
      d.member?.phone_number ?? "-",
      d.trash_type?.category ?? "-",
      d.trash_type?.name ?? "-",
      weight,
      price,
      total,
    ]);
  });

  rows.push([]);
  rows.push(["", "", "", "", "", "Subtotal", totalWeight, "", totalValue]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
  ];

  return ws;
}

function buildWithdrawalSheet(withdrawals: WithdrawalWithRelations[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ["No", "Tanggal Request", "Nama Member", "No HP", "Jumlah (Rp)", "Metode", "Status", "Tanggal Selesai"],
  ];

  let totalCompleted = 0;

  withdrawals.forEach((w, i) => {
    if (w.status === "completed") {
      totalCompleted += w.total_amount ?? 0;
    }

    rows.push([
      i + 1,
      w.created_at ? format(new Date(w.created_at), "yyyy-MM-dd HH:mm") : "-",
      w.member?.full_name ?? "-",
      w.member?.phone_number ?? "-",
      w.total_amount ?? 0,
      w.withdrawal_type === "manual" ? "Tarik Manual" : "Transfer Bank",
      w.status === "pending" ? "Menunggu" : w.status === "completed" ? "Selesai" : "Dibatalkan",
      w.completed_at ? format(new Date(w.completed_at), "yyyy-MM-dd HH:mm") : "-",
    ]);
  });

  rows.push([]);
  rows.push(["", "", "", "", totalCompleted, "", "Total Selesai", ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
  ];

  return ws;
}

function buildBalanceSheet(members: MemberWithBalance[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ["No", "Nama Member", "No HP", "Saldo Saat Ini (Rp)", "Total Dicairkan Lifetime (Rp)"],
  ];

  let grandTotalBalance = 0;
  let grandTotalWithdrawn = 0;

  // Sort by saldo desc
  const sorted = [...members].sort(
    (a, b) => (b.member_balance?.total_balance ?? 0) - (a.member_balance?.total_balance ?? 0)
  );

  sorted.forEach((m, i) => {
    const balance = m.member_balance?.total_balance ?? 0;
    const withdrawn = m.member_balance?.total_withdrawn ?? 0;
    grandTotalBalance += balance;
    grandTotalWithdrawn += withdrawn;

    rows.push([
      i + 1,
      m.full_name,
      m.phone_number,
      balance,
      withdrawn,
    ]);
  });

  rows.push([]);
  rows.push(["", "", "Grand Total", grandTotalBalance, grandTotalWithdrawn]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 24 },
    { wch: 16 },
    { wch: 22 },
    { wch: 26 },
  ];

  return ws;
}

// ─── Main export function ────────────────────────────────────────────────────

export async function exportMonthlyReport(year: number, month: number): Promise<void> {
  const { deposits, withdrawals, members } = await fetchMonthlyData(year, month);

  const wb = XLSX.utils.book_new();

  const summaryWs = buildSummarySheet(deposits, withdrawals, members, year, month);
  const depositWs = buildDepositSheet(deposits);
  const withdrawalWs = buildWithdrawalSheet(withdrawals);
  const balanceWs = buildBalanceSheet(members);

  XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");
  XLSX.utils.book_append_sheet(wb, depositWs, "Detail Deposit");
  XLSX.utils.book_append_sheet(wb, withdrawalWs, "Detail Penarikan");
  XLSX.utils.book_append_sheet(wb, balanceWs, "Saldo Member");

  const filename = `Laporan_BankSampah_${getMonthName(month)}_${year}.xlsx`;
  XLSX.writeFile(wb, filename);
}
