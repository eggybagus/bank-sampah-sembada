import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Lock,
  Loader2,
  Leaf,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  UserCircle,
} from "lucide-react";
import {
  signUp,
  signInWithEmail,
  signInWithPhone,
  resendConfirmationEmail,
  devLogin,
} from "../services/auth.service";
import { formatPhoneStorage } from "../utils/formatters";

// ─── Validation schemas ───────────────────────────────────────────────────────

const loginEmailSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const loginPhoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Nomor terlalu pendek")
    .regex(/^(08|628|\+628)\d{7,11}$/, "Format: 08xx..."),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const signupSchema = z
  .object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type LoginEmailValues = z.infer<typeof loginEmailSchema>;
type LoginPhoneValues = z.infer<typeof loginPhoneSchema>;
type SignupValues = z.infer<typeof signupSchema>;

// ─── Password input with toggle ──────────────────────────────────────────────

function PasswordInput({
  register,
  error,
  placeholder = "Password",
}: {
  register: ReturnType<typeof useForm>["register"];
  error?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-bold text-slate-900 mb-2">
        Password
      </label>
      <div className="relative">
        <Lock
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          {...register}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
            error
              ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
              : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Mode = "login" | "signup" | "verify-email";
type LoginTab = "email" | "phone";

export default function LoginPage() {
  usePageTitle("Masuk");
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loginTab, setLoginTab] = useState<LoginTab>("email");
  const [devLoading, setDevLoading] = useState<"member" | "admin" | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── Login Email form ──
  const {
    register: registerLoginEmail,
    handleSubmit: handleLoginEmail,
    formState: { errors: loginEmailErrors, isSubmitting: loginEmailSubmitting },
  } = useForm<LoginEmailValues>({ resolver: zodResolver(loginEmailSchema) });

  // ── Login Phone form ──
  const {
    register: registerLoginPhone,
    handleSubmit: handleLoginPhone,
    formState: { errors: loginPhoneErrors, isSubmitting: loginPhoneSubmitting },
  } = useForm<LoginPhoneValues>({ resolver: zodResolver(loginPhoneSchema) });

  // ── Signup form ──
  const {
    register: registerSignup,
    handleSubmit: handleSignup,
    formState: { errors: signupErrors, isSubmitting: signupSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  // ── Handlers ──
  async function onLoginEmail(data: LoginEmailValues) {
    try {
      await signInWithEmail(data.email, data.password);
      // AuthContext picks up SIGNED_IN → RedirectIfAuthenticated handles nav
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Email atau password salah"
      );
    }
  }

  async function onLoginPhone(data: LoginPhoneValues) {
    try {
      const formatted = formatPhoneStorage(data.phone);
      await signInWithPhone(formatted, data.password);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nomor atau password salah"
      );
    }
  }

  async function onSignup(data: SignupValues) {
    try {
      await signUp(data.email, data.password, {
        full_name: "",
        role: "member",
      });
      setPendingEmail(data.email);
      setMode("verify-email");
      toast.success("Akun berhasil dibuat. Cek email untuk verifikasi.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal mendaftar. Email mungkin sudah terdaftar."
      );
    }
  }

  async function handleResendEmail() {
    if (!pendingEmail) return;
    try {
      await resendConfirmationEmail(pendingEmail);
      toast.success("Email verifikasi telah dikirim ulang");
    } catch {
      toast.error("Gagal mengirim ulang email");
    }
  }

  // ── Dev bypass ──
  async function handleDevLogin(role: "member" | "admin") {
    setDevLoading(role);
    try {
      const profile = await devLogin(
        role === "admin"
          ? "admin@banksampah.dev"
          : "member@banksampah.dev",
        role === "admin" ? "admin123456" : "member123456"
      );
      toast.success(`Berhasil masuk sebagai ${profile.role}`);
      navigate(profile.role === "admin" ? "/admin" : "/member", {
        replace: true,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Gagal masuk sebagai ${role}. Cek kredensial di Supabase.`
      );
    } finally {
      setDevLoading(null);
    }
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200 mb-4">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bank Sampah Sembada
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {mode === "login"
              ? "Masuk ke akun Anda"
              : mode === "signup"
              ? "Buat akun baru"
              : "Verifikasi email Anda"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] p-6">
          {/* Mode tabs */}
          {mode === "login" && (
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                onClick={() => setLoginTab("email")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  loginTab === "email"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setLoginTab("phone")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  loginTab === "phone"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Nomor HP
              </button>
            </div>
          )}

          {/* ── LOGIN: Email ── */}
          {mode === "login" && loginTab === "email" && (
            <form
              onSubmit={handleLoginEmail(onLoginEmail)}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    {...registerLoginEmail("email")}
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                      loginEmailErrors.email
                        ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    }`}
                  />
                </div>
                {loginEmailErrors.email && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {loginEmailErrors.email.message}
                  </p>
                )}
              </div>

              <PasswordInput
                register={registerLoginEmail("password")}
                error={loginEmailErrors.password?.message}
              />

              <button
                type="submit"
                disabled={loginEmailSubmitting}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loginEmailSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loginEmailSubmitting ? "Memuat..." : "Masuk"}
              </button>

              <p className="text-center text-xs text-slate-500 font-medium">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-brand-600 font-bold hover:text-brand-700"
                >
                  Daftar
                </button>
              </p>
            </form>
          )}

          {/* ── LOGIN: Phone ── */}
          {mode === "login" && loginTab === "phone" && (
            <form
              onSubmit={handleLoginPhone(onLoginPhone)}
              className="space-y-5"
            >
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
                    {...registerLoginPhone("phone")}
                    type="tel"
                    inputMode="numeric"
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                      loginPhoneErrors.phone
                        ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    }`}
                  />
                </div>
                {loginPhoneErrors.phone && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {loginPhoneErrors.phone.message}
                  </p>
                )}
              </div>

              <PasswordInput
                register={registerLoginPhone("password")}
                error={loginPhoneErrors.password?.message}
              />

              <button
                type="submit"
                disabled={loginPhoneSubmitting}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loginPhoneSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loginPhoneSubmitting ? "Memuat..." : "Masuk"}
              </button>

              <p className="text-center text-xs text-slate-500 font-medium">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-brand-600 font-bold hover:text-brand-700"
                >
                  Daftar
                </button>
              </p>
            </form>
          )}

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <form onSubmit={handleSignup(onSignup)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    {...registerSignup("email")}
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                      signupErrors.email
                        ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    }`}
                  />
                </div>
                {signupErrors.email && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {signupErrors.email.message}
                  </p>
                )}
              </div>

              <PasswordInput
                register={registerSignup("password")}
                error={signupErrors.password?.message}
                placeholder="Password (min. 6 karakter)"
              />

              <PasswordInput
                register={registerSignup("confirmPassword")}
                error={signupErrors.confirmPassword?.message}
                placeholder="Konfirmasi password"
              />

              <button
                type="submit"
                disabled={signupSubmitting}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {signupSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserCircle size={16} />
                )}
                {signupSubmitting ? "Mendaftar..." : "Daftar"}
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={14} />
                Sudah punya akun? Masuk
              </button>
            </form>
          )}

          {/* ── VERIFY EMAIL ── */}
          {mode === "verify-email" && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto">
                <Mail size={28} className="text-brand-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Verifikasi Email
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Kami telah mengirim link verifikasi ke{" "}
                  <span className="font-bold text-slate-700">{pendingEmail}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-left space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  1. Buka email Anda
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  2. Klik link verifikasi dari Bank Sampah Sembada
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  3. Kembali ke halaman ini dan klik "Sudah Verifikasi"
                </p>
              </div>

              <button
                onClick={() => setMode("login")}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Sudah Verifikasi — Masuk
              </button>

              <button
                onClick={handleResendEmail}
                className="text-xs text-brand-600 font-bold hover:text-brand-700"
              >
                Kirim ulang email verifikasi
              </button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={14} />
                Kembali
              </button>
            </div>
          )}
        </div>

        {/* Dev bypass */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Dev Only
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-amber-700 text-center">
              Akses cepat untuk pengembangan
            </p>

            <button
              type="button"
              onClick={() => handleDevLogin("member")}
              disabled={devLoading !== null}
              className="w-full py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {devLoading === "member" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Masuk sebagai Member (Dev)
            </button>

            <button
              type="button"
              onClick={() => handleDevLogin("admin")}
              disabled={devLoading !== null}
              className="w-full py-2 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {devLoading === "admin" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Masuk sebagai Admin (Dev)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
