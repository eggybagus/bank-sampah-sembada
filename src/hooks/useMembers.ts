import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllMembers, searchMembers, getMemberById, updateMemberStatus } from "../services/member.service";
import toast from "react-hot-toast";

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: getAllMembers,
  });
}

export function useSearchMembers(query: string) {
  return useQuery({
    queryKey: ["members", "search", query],
    queryFn: () => searchMembers(query),
    enabled: query.length >= 2,
  });
}

export function useMemberById(id: string) {
  return useQuery({
    queryKey: ["members", id],
    queryFn: () => getMemberById(id),
    enabled: !!id,
  });
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, isActive }: { memberId: string; isActive: boolean }) =>
      updateMemberStatus(memberId, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Status member diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui status member"),
  });
}
