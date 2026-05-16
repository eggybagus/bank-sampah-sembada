import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWithdrawalsByMember,
  getAllWithdrawals,
  getAllWithdrawalRequests,
  getWithdrawalById,
  getLastWithdrawalDate,
  createWithdrawalRequest,
  completeWithdrawal,
  cancelWithdrawal,
} from "../services/withdrawal.service";
import toast from "react-hot-toast";
import type { WithdrawalRequest } from "../types";

export function useMemberWithdrawals(memberId: string) {
  return useQuery({
    queryKey: ["withdrawals", "member", memberId],
    queryFn: () => getWithdrawalsByMember(memberId),
    enabled: !!memberId,
  });
}

export function useAllWithdrawals() {
  return useQuery({
    queryKey: ["withdrawals", "all"],
    queryFn: getAllWithdrawals,
  });
}

export function useAllWithdrawalRequests() {
  return useQuery({
    queryKey: ["withdrawals", "all-with-relations"],
    queryFn: getAllWithdrawalRequests,
  });
}

export function useWithdrawalById(id: string) {
  return useQuery({
    queryKey: ["withdrawals", id],
    queryFn: () => getWithdrawalById(id),
    enabled: !!id,
  });
}

export function useLastWithdrawalDate(memberId: string) {
  return useQuery({
    queryKey: ["withdrawals", "last", memberId],
    queryFn: () => getLastWithdrawalDate(memberId),
    enabled: !!memberId,
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Pick<
        WithdrawalRequest,
        | "member_id"
        | "withdrawal_type"
        | "total_amount"
        | "selected_deposits"
        | "bank_account_id"
        | "notes"
      >
    ) => createWithdrawalRequest(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["withdrawals", "member", vars.member_id] });
      qc.invalidateQueries({ queryKey: ["withdrawals", "last", vars.member_id] });
      qc.invalidateQueries({ queryKey: ["deposits", vars.member_id] });
      qc.invalidateQueries({ queryKey: ["balance", vars.member_id] });
      toast.success("Permintaan penarikan berhasil dikirim");
    },
    onError: () => toast.error("Gagal mengirim permintaan penarikan"),
  });
}

export function useCompleteWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completedBy }: { id: string; completedBy: string }) =>
      completeWithdrawal(id, completedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Penarikan ditandai selesai");
    },
    onError: () => toast.error("Gagal memproses penarikan"),
  });
}

export function useCancelWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelWithdrawal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Penarikan dibatalkan");
    },
    onError: () => toast.error("Gagal membatalkan penarikan"),
  });
}
