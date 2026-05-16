import { useState, useMemo, useCallback, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PackagePlus,
  Search,
  X,
  User,
  Phone,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Scale,
  Calendar,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSearchMembers } from "../../hooks/useMembers";
import { useAcceptedTypes, useActivePrices } from "../../hooks/usePrices";
import { useCreateDeposit } from "../../hooks/useDeposits";
import { formatRupiah } from "../../utils/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { MemberWithBalance, TrashType } from "../../types";

// ─── Schema ──────────────────────────────────────────────────────────────────

const depositSchema = z.object({
  memberId: z.string().min(1, "Pilih member terlebih dahulu"),
  trashTypeId: z.string().min(1, "Pilih jenis sampah"),
  weightKg: z.number().positive("Berat harus lebih dari 0"),
  depositDate: z.string().min(1, "Pilih tanggal"),
  notes: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="p-3 space-y-2">
      <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
      <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
    </div>
  );
}

// ─── Member search section ───────────────────────────────────────────────────

function MemberSearchSection({
  selectedMember,
  onSelect,
  onClear,
}: {
  selectedMember: MemberWithBalance | null;
  onSelect: (m: MemberWithBalance) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useSearchMembers(debouncedQuery);

  const handleSelect = useCallback(
    (m: MemberWithBalance) => {
      onSelect(m);
      setQuery("");
      setOpen(false);
    },
    [onSelect]
  );

  if (selectedMember) {
    return (
      <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <User size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {selectedMember.full_name}
              </p>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Phone size={10} />
                {selectedMember.phone_number}
              </p>
              <p className="text-xs text-brand-600 font-bold mt-0.5">
                Saldo: {formatRupiah(selectedMember.member_balance?.total_balance ?? 0)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cari member (nama atau nomor HP)..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400"
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
          {isLoading ? (
            <SearchSkeleton />
          ) : !results || results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Member tidak ditemukan
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto py-1">
              {results.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelect(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {m.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {m.phone_number}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-brand-600 whitespace-nowrap">
                    {formatRupiah(m.member_balance?.total_balance ?? 0)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Trash type dropdown ─────────────────────────────────────────────────────

function TrashTypeSelect({
  types,
  value,
  onChange,
  error,
}: {
  types: TrashType[] | undefined;
  value: string;
  onChange: (id: string, price: number) => void;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, TrashType[]>();
    types?.forEach((t) => {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    });
    return Array.from(map.entries());
  }, [types]);

  const selected = types?.find((t) => t.id === value);

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-900 mb-1.5">
        Jenis Sampah
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
          error
            ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
            : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        } bg-white outline-none`}
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected
            ? `${selected.category} — ${selected.name}`
            : "Pilih jenis sampah..."}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden max-h-64 overflow-y-auto">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {category}
              </div>
              {items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onChange(t.id, 0); // price will be fetched separately
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors ${
                    value === t.id ? "bg-brand-50 text-brand-700 font-bold" : "text-slate-700"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Receipt card ────────────────────────────────────────────────────────────

function ReceiptCard({ deposit }: { deposit: { memberName: string; trashName: string; weight: number; price: number; total: number; date: string; notes?: string } }) {
  return (
    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-emerald-600" />
        <p className="text-sm font-black text-emerald-700">Deposit Berhasil Dicatat</p>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Member</span>
          <span className="font-bold text-slate-900">{deposit.memberName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Jenis Sampah</span>
          <span className="font-bold text-slate-900">{deposit.trashName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Berat</span>
          <span className="font-bold text-slate-900">{deposit.weight} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Harga/kg</span>
          <span className="font-bold text-slate-900">{formatRupiah(deposit.price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Tanggal</span>
          <span className="font-bold text-slate-900">{formatShortDate(deposit.date)}</span>
        </div>
        <div className="pt-2 border-t border-emerald-100 flex justify-between">
          <span className="text-slate-500 font-medium">Total</span>
          <span className="text-base font-black text-emerald-700">{formatRupiah(deposit.total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DepositForm() {
  usePageTitle("Input Deposit");

  const { user, profile } = useAuth();
  const adminId = user?.id ?? "";

  const [selectedMember, setSelectedMember] = useState<MemberWithBalance | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{
    memberName: string;
    trashName: string;
    weight: number;
    price: number;
    total: number;
    date: string;
    notes?: string;
  } | null>(null);

  const { data: acceptedTypes, isLoading: typesLoading } = useAcceptedTypes();
  const createDeposit = useCreateDeposit();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      depositDate: new Date().toISOString().split("T")[0],
      weightKg: undefined,
      notes: "",
    },
  });

  const trashTypeId = watch("trashTypeId");
  const weightKg = watch("weightKg");
  const depositDate = watch("depositDate");
  const notes = watch("notes");

  const selectedType = acceptedTypes?.find((t) => t.id === trashTypeId);

  // Get current active price for selected type
  const currentPrice = useMemo(() => {
    if (!selectedType || !acceptedTypes) return 0;
    // We need the active price. Since useAcceptedTypes only returns trash_types,
    // we'll need to fetch prices separately. For now, we'll use a simple approach:
    // The price will be set when the type is selected via a separate fetch.
    return 0;
  }, [selectedType, acceptedTypes]);

  const { data: activePrices } = useActivePrices();

  const pricePerKg = useMemo(() => {
    if (!trashTypeId || !activePrices) return 0;
    return activePrices.find((p) => p.trash_type_id === trashTypeId)?.price_per_kg ?? 0;
  }, [trashTypeId, activePrices]);

  const totalRupiah = useMemo(() => {
    if (!weightKg || !pricePerKg) return 0;
    return Math.round(weightKg * pricePerKg);
  }, [weightKg, pricePerKg]);

  function onSubmit(data: DepositFormData) {
    if (!selectedMember || !pricePerKg) return;

    createDeposit.mutate(
      {
        member_id: data.memberId,
        trash_type_id: data.trashTypeId,
        weight_kg: data.weightKg,
        price_per_kg: pricePerKg,
        total_rupiah: totalRupiah,
        deposit_date: data.depositDate,
        notes: data.notes || undefined,
        created_by: adminId,
      },
      {
        onSuccess: () => {
          setLastReceipt({
            memberName: selectedMember.full_name,
            trashName: selectedType?.name ?? "-",
            weight: data.weightKg,
            price: pricePerKg,
            total: totalRupiah,
            date: data.depositDate,
            notes: data.notes || undefined,
          });
          // Reset form but keep member
          reset({
            memberId: selectedMember.id,
            trashTypeId: "",
            weightKg: undefined,
            depositDate: new Date().toISOString().split("T")[0],
            notes: "",
          });
        },
      }
    );
  }

  function handleSelectMember(m: MemberWithBalance) {
    setSelectedMember(m);
    setValue("memberId", m.id, { shouldValidate: true });
    setLastReceipt(null);
  }

  function handleClearMember() {
    setSelectedMember(null);
    setValue("memberId", "", { shouldValidate: true });
    setLastReceipt(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <PackagePlus size={18} className="text-brand-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Input
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Input Deposit
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Catat deposit sampah dari member
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Member */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-brand-600 text-white text-xs flex items-center justify-center">
              1
            </span>
            Cari Member
          </h2>
          <MemberSearchSection
            selectedMember={selectedMember}
            onSelect={handleSelectMember}
            onClear={handleClearMember}
          />
          {errors.memberId && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle size={12} /> {errors.memberId.message}
            </p>
          )}
        </div>

        {/* Section 2: Trash detail */}
        {selectedMember && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-5">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-600 text-white text-xs flex items-center justify-center">
                2
              </span>
              Detail Sampah
            </h2>

            <TrashTypeSelect
              types={acceptedTypes}
              value={trashTypeId ?? ""}
              onChange={(id) => setValue("trashTypeId", id, { shouldValidate: true })}
              error={errors.trashTypeId?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Berat (kg)
                </label>
                <div className="relative">
                  <Scale
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    step="0.001"
                    {...register("weightKg", { valueAsNumber: true })}
                    placeholder="0.000"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all placeholder-slate-400 ${
                      errors.weightKg
                        ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    }`}
                  />
                </div>
                {errors.weightKg && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {errors.weightKg.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Tanggal Deposit
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    {...register("depositDate")}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                      errors.depositDate
                        ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Catatan (opsional)
              </label>
              <div className="relative">
                <FileText
                  size={16}
                  className="absolute left-3.5 top-3 text-slate-400"
                />
                <textarea
                  {...register("notes")}
                  rows={2}
                  placeholder="Tambahkan catatan jika perlu..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400 resize-none"
                />
              </div>
            </div>

            {/* Live total */}
            {pricePerKg > 0 && weightKg > 0 && (
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium mb-1">
                  {selectedType?.name} · {formatRupiah(pricePerKg)}/kg · {weightKg} kg
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  Total: {formatRupiah(totalRupiah)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Submit */}
        {selectedMember && trashTypeId && weightKg > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-600 text-white text-xs flex items-center justify-center">
                3
              </span>
              Preview & Submit
            </h2>

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Member</span>
                <span className="font-bold text-slate-900">{selectedMember.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Jenis Sampah</span>
                <span className="font-bold text-slate-900">{selectedType?.name ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Berat</span>
                <span className="font-bold text-slate-900">{weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Harga/kg</span>
                <span className="font-bold text-slate-900">{formatRupiah(pricePerKg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Tanggal</span>
                <span className="font-bold text-slate-900">{formatShortDate(depositDate)}</span>
              </div>
              {notes && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Catatan</span>
                  <span className="font-bold text-slate-900">{notes}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <span className="text-slate-500 font-bold">Total</span>
                <span className="text-base font-black text-brand-600">{formatRupiah(totalRupiah)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={createDeposit.isPending}
              className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
            >
              {createDeposit.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {createDeposit.isPending ? "Menyimpan..." : "Catat Deposit"}
            </button>
          </div>
        )}
      </form>

      {/* Receipt */}
      {lastReceipt && <ReceiptCard deposit={lastReceipt} />}
    </div>
  );
}


