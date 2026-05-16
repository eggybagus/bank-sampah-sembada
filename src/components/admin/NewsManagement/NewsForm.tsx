import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Newspaper, FileText, Type, Calendar } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useCreateNews, useUpdateNews } from "../../../hooks/useNews";
import type { News } from "../../../types";

// ─── Schema ──────────────────────────────────────────────────────────────────

const newsSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200, "Maksimal 200 karakter"),
  type: z.enum(["announcement", "price_update", "tips", "general"]),
  content: z.string().min(10, "Konten minimal 10 karakter"),
  published_at: z.string().min(1, "Tanggal publish wajib diisi"),
});

type NewsFormData = z.infer<typeof newsSchema>;

// ─── Type label map ──────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: News["type"]; label: string }[] = [
  { value: "announcement", label: "Pengumuman" },
  { value: "price_update", label: "Update Harga" },
  { value: "tips", label: "Tips" },
  { value: "general", label: "Umum" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewsForm({
  news,
  onClose,
}: {
  news?: News | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();
  const isEditing = !!news;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      type: "general",
      content: "",
      published_at: new Date().toISOString().slice(0, 16),
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (news) {
      reset({
        title: news.title,
        type: news.type,
        content: news.content,
        published_at: news.published_at.slice(0, 16),
      });
    }
  }, [news, reset]);

  const contentValue = watch("content") ?? "";

  function onSubmit(data: NewsFormData) {
    const payload = {
      title: data.title,
      content: data.content,
      type: data.type,
      published_at: new Date(data.published_at).toISOString(),
    };

    if (isEditing && news) {
      updateMutation.mutate(
        { id: news.id, payload },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(
        { payload: payload as Omit<News, "id" | "created_at">, createdBy: user?.id ?? "" },
        { onSuccess: onClose }
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-brand-600" />
            <h2 className="text-sm font-black text-slate-900">
              {isEditing ? "Edit Berita" : "Tambah Berita"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Judul
            </label>
            <div className="relative">
              <Type
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                {...register("title")}
                placeholder="Judul berita..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                  errors.title
                    ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                }`}
              />
            </div>
            {errors.title && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.title.message}</p>
            )}
            <p className="text-[10px] text-slate-400 font-medium mt-1 text-right">
              {contentValue.length}/200
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Tipe Berita
            </label>
            <div className="relative">
              <FileText
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                {...register("type")}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium bg-white"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.type && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Konten
            </label>
            <textarea
              {...register("content")}
              rows={5}
              placeholder="Isi konten berita..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 resize-none ${
                errors.content
                  ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              }`}
            />
            {errors.content && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.content.message}</p>
            )}
            <p className="text-[10px] text-slate-400 font-medium mt-1 text-right">
              {contentValue.length} karakter
            </p>
          </div>

          {/* Published at */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Tanggal & Waktu Publish
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="datetime-local"
                {...register("published_at")}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                  errors.published_at
                    ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                }`}
              />
            </div>
            {errors.published_at && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.published_at.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-all shadow-lg shadow-brand-200 flex items-center justify-center gap-1.5"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
