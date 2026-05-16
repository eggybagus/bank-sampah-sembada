import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  UserCircle,
  LogOut,
  Loader2,
  Save,
  Shield,
  Phone,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

// ─── Schema ──────────────────────────────────────────────────────────────────

const nameSchema = z.object({
  fullName: z.string().min(1, "Nama wajib diisi").max(100, "Maksimal 100 karakter"),
});

type NameFormData = z.infer<typeof nameSchema>;

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AccountSettings() {
  const { user, profile, signOut } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
    },
  });

  async function onSubmit(data: NameFormData) {
    if (!user) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Nama berhasil diperbarui");
    } catch {
      toast.error("Gagal memperbarui nama");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings size={18} className="text-brand-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Pengaturan
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Pengaturan Akun
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Kelola informasi akun admin Anda
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
            <UserCircle size={28} className="text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">{profile?.full_name ?? "Admin"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-black rounded-full border border-brand-100">
                <Shield size={9} />
                Admin
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Phone size={12} />
            {profile?.phone_number ?? "-"}
          </div>
        </div>
      </div>

      {/* Change name form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <h2 className="text-sm font-black text-slate-900">Ubah Nama Tampilan</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              {...register("fullName")}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                errors.fullName
                  ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.fullName.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isUpdating || !isDirty}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-all shadow-lg shadow-brand-200"
          >
            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isUpdating ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-sm font-black text-slate-900 mb-3">Keluar</h2>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-all border border-red-100"
        >
          <LogOut size={14} />
          Keluar dari Akun
        </button>
      </div>
    </div>
  );
}
