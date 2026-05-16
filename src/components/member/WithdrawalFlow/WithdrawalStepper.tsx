import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  Package,
  Landmark,
  Send,
  ChevronRight,
} from "lucide-react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import Step1_SelectDeposits from "./Step1_SelectDeposits";
import Step2_SelectMethod from "./Step2_SelectMethod";
import Step3_Review from "./Step3_Review";

// ─── Validation schema ───────────────────────────────────────────────────────

const withdrawalSchema = z.object({
  selectedDepositIds: z
    .array(z.string())
    .min(1, "Pilih minimal 1 deposit"),
  withdrawalType: z.enum(["manual", "bank_transfer"]),
  bankAccountId: z.string().optional(),
});

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Pilih Deposit", icon: <Package size={16} /> },
  { num: 2, label: "Metode Penarikan", icon: <Landmark size={16} /> },
  { num: 3, label: "Review", icon: <Send size={16} /> },
] as const;

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((step, idx) => {
        const isActive = step.num === currentStep;
        const isCompleted = step.num < currentStep;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.num} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive
                    ? "bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-200"
                    : isCompleted
                    ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <ChevronRight size={16} strokeWidth={3} />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider hidden sm:block ${
                  isActive
                    ? "text-brand-600"
                    : isCompleted
                    ? "text-emerald-600"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`w-8 sm:w-12 h-0.5 rounded-full transition-colors ${
                  isCompleted ? "bg-emerald-300" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main container ──────────────────────────────────────────────────────────

export default function WithdrawalStepper() {
  usePageTitle("Ajukan Penarikan");

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const methods = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      selectedDepositIds: [],
      withdrawalType: "manual",
      bankAccountId: undefined,
    },
    mode: "onChange",
  });

  const goNext = () => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  return (
    <FormProvider {...methods}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wallet size={18} className="text-brand-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Penarikan Saldo
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ajukan Penarikan
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Pilih deposit dan metode penarikan Anda
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-5 sm:p-8">
          {step === 1 && <Step1_SelectDeposits onNext={goNext} />}
          {step === 2 && <Step2_SelectMethod onNext={goNext} onBack={goBack} />}
          {step === 3 && <Step3_Review onBack={goBack} />}
        </div>
      </div>
    </FormProvider>
  );
}
