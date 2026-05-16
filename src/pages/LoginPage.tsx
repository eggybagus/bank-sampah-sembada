import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Phone, KeyRound, ArrowLeft, Loader2, Leaf } from "lucide-react";
import { sendOtp, verifyOtp, devLogin } from "../services/auth.service";
import { formatPhoneStorage } from "../utils/formatters";

// ─── Validation schemas ───────────────────────────────────────────────────────
const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Nomor terlalu pendek")
    .regex(
      /^(08|628|\+628)\d{7,11}$/,
      "Format: 08xx... atau +628xx..."
    ),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP harus 6 digit")
    .regex(/^\d+$/, "OTP hanya angka"),
});

type PhoneValues = z.infer<typeof phoneSchema>;
type OtpValues   = z.infer<typeof otpSchema>;

// ─── OTP visual input ─────────────────────────────────────────────────────────
// Renders 6 styled boxes with a transparent full-coverage input overlay so that
// tapping anywhere in the OTP area opens the numeric keyboard on mobile.
function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="relative flex gap-2.5 justify-center cursor-text"
      onClick={() => hiddenRef.current?.focus()}
      role="group"
      aria-label="Kode OTP"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={[
            "w-11 h-14 rounded-xl border-2 flex items-center justify-center",
            "text-2xl font-black text-slate-900 transition-all duration-150 select-none",
            i < value.length
              ? "border-slate-300 bg-white"
              : i === value.length
              ? "border-brand-600 bg-brand-50/30 shadow-sm shadow-brand-100"
              : "border-slate-200 bg-slate-50",
          ].join(" ")}
        >
          {value[i] ?? ""}
        </div>
      ))}

      {/* Transparent overlay captures all taps and keyboard input */}
      <input
        ref={hiddenRef}
        type="tel"
        inputMode="numeric"
        pattern="\d*"
        maxLength={6}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        autoComplete="one-time-code"
        aria-label="Kode OTP"
        className="absolute inset-0 opacity-0 cursor-pointer"
        tabIndex={0}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  usePageTitle("Masuk");
  const [step, setStep]         = useState<1 | 2>(1);
  const [storedPhone, setStoredPhone] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [devLoading, setDevLoading] = useState<"member" | "admin" | null>(null);

  // Step 1 — phone form
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors, isSubmitting: phoneSending },
  } = useForm<PhoneValues>({ resolver: zodResolver(phoneSchema) });

  // Step 2 — OTP form
  const {
    handleSubmit: handleOtpSubmit,
    formState: { isSubmitting: otpVerifying },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    values: { otp: otpValue },
  });

  // ── Step 1: send OTP ──
  async function onSendOtp({ phone }: PhoneValues) {
    try {
      const formatted = formatPhoneStorage(phone);
      await sendOtp(formatted);
      setStoredPhone(formatted);
      setStep(2);
      setOtpValue("");
      toast.success("Kode OTP telah dikirim ke nomor Anda");
    } catch {
      toast.error("Gagal mengirim OTP. Pastikan nomor HP valid.");
    }
  }

  // ── Step 2: verify OTP ──
  async function onVerifyOtp() {
    if (otpValue.length < 6) {
      toast.error("Masukkan 6 digit kode OTP");
      return;
    }
    try {
      await verifyOtp(storedPhone, otpValue);
      // AuthContext picks up SIGNED_IN → RedirectIfAuthenticated handles navigation
    } catch {
      toast.error("Kode OTP salah atau sudah kedaluwarsa");
    }
  }

  const navigate = useNavigate();

  // ── Dev bypass ──
  async function handleDevLogin(role: "member" | "admin") {
    setDevLoading(role);
    try {
      const profile = await devLogin(
        role === "admin"
          ? "admin@banksampah.dev"
          : "member@banksampah.dev",
        role === "admin"
          ? "admin123456"
          : "member123456"
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200 mb-4">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bank Sampah Sembada
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Masuk ke akun Anda
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] p-6">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1 rounded-full bg-brand-600" />
            <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step === 2 ? "bg-brand-600" : "bg-slate-200"}`} />
          </div>

          {/* ── Step 1: Phone ── */}
          {step === 1 ? (
            <form onSubmit={handlePhoneSubmit(onSendOtp)} className="space-y-5">
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
                    {...registerPhone("phone")}
                    type="tel"
                    inputMode="numeric"
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all placeholder-slate-400 text-sm font-medium"
                  />
                </div>
                {phoneErrors.phone ? (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {phoneErrors.phone.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={phoneSending}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {phoneSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {phoneSending ? "Mengirim..." : "Kirim OTP"}
              </button>
            </form>

          ) : (
            /* ── Step 2: OTP ── */
            <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={14} className="text-slate-400" />
                  <label className="text-sm font-bold text-slate-900">
                    Kode OTP
                  </label>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  Kode dikirim ke{" "}
                  <span className="font-bold text-slate-700">{storedPhone}</span>
                </p>
                <OtpInput value={otpValue} onChange={setOtpValue} />
              </div>

              <button
                type="submit"
                disabled={otpVerifying || otpValue.length < 6}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {otpVerifying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {otpVerifying ? "Memverifikasi..." : "Verifikasi"}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtpValue(""); }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={14} />
                Ganti nomor HP
              </button>
            </form>
          )}
        </div>

        {/* ── Dev bypass section ── */}
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
