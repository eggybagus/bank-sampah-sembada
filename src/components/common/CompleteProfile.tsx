import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { UserCircle, Phone, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile } from "../../services/auth.service";
import { formatPhoneStorage } from "../../utils/formatters";
import toast from "react-hot-toast";

// ─── Schema ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter").max(100, "Maksimal 100 karakter"),
  phone: z
    .string()
    .min(10, "Nomor terlalu pendek")
    .regex(/^(08|628|\+628)\d{7,11}$/, "Format: 08xx... atau +628xx..."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function CompleteProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      phone: profile?.phone_number?.startsWith("+62")
        ? "0" + profile.phone_number.slice(3)
        : profile?.phone_number ?? "",
    },
  });

  async function onSubmit(data: ProfileFormData) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateProfile(user.id, {
        full_name: data.fullName.trim(),
        phone_number: formatPhoneStorage(data.phone),
      });
      await refreshProfile();
      toast.success("Profil berhasil dilengkapi");
      const role = profile?.role ?? "member";
      navigate(role === "admin" ? "/admin/dashboard" : "/member/dashboard", {
        replace: true,
      });
    } catch {
      toast.error("Gagal menyimpan profil. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200 mb-4">
            <UserCircle size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Lengkapi Profil
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 text-center">
            Isi informasi dasar untuk melanjutkan
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <UserCircle
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  {...register("fullName")}
                  placeholder="Nama lengkap Anda"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                    errors.fullName
                      ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Nomor HP
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  {...register("phone")}
                  placeholder="08xxxxxxxxxx"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                    errors.phone
                      ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan & Lanjutkan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
