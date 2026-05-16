import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNews, getNewsById, createNews, updateNews, deleteNews } from "../services/news.service";
import toast from "react-hot-toast";
import type { News } from "../types";

export function useNews(limit?: number) {
  return useQuery({
    queryKey: ["news", limit ?? "all"],
    queryFn: () => getNews(limit),
  });
}

export function useNewsById(id: string) {
  return useQuery({
    queryKey: ["news", id],
    queryFn: () => getNewsById(id),
    enabled: !!id,
  });
}

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, createdBy }: { payload: Omit<News, "id" | "created_at">; createdBy: string }) =>
      createNews(payload, createdBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      toast.success("Berita berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menambahkan berita"),
  });
}

export function useUpdateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<News, "id" | "created_at" | "created_by">> }) =>
      updateNews(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      toast.success("Berita berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui berita"),
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      toast.success("Berita berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus berita"),
  });
}
