import { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  Search,
  History,
} from "lucide-react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import ErrorState from "../../../components/common/ErrorState";
import { useAllTrashTypes, useActivePrices, useUpdatePrice, useUpdateTrashType, useCreateTrashType } from "../../../hooks/usePrices";
import { useAuth } from "../../../hooks/useAuth";
import { formatRupiah } from "../../../utils/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import PriceHistory from "./PriceHistory";
import type { TrashType } from "../../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy", { locale: id });
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Add type modal ──────────────────────────────────────────────────────────

function AddTypeModal({
  onClose,
  existingCategories,
}: {
  onClose: () => void;
  existingCategories: string[];
}) {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isAccepted, setIsAccepted] = useState(true);
  const [useNewCategory, setUseNewCategory] = useState(false);

  const createType = useCreateTrashType();
  const setPriceMutation = useUpdatePrice();

  const canSubmit =
    (useNewCategory ? newCategory.trim() : category) &&
    name.trim() &&
    price &&
    Number(price) > 0;

  async function handleSubmit() {
    const finalCategory = useNewCategory ? newCategory.trim() : category;
    const newType = await createType.mutateAsync({
      category: finalCategory,
      name: name.trim(),
      description: "",
      is_accepted: isAccepted,
    });
    await setPriceMutation.mutateAsync({
      trashTypeId: newType.id,
      pricePerKg: Number(price),
      createdBy: user?.id ?? "",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Tambah Jenis Sampah</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Kategori
            </label>
            {!useNewCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium"
                >
                  <option value="">Pilih kategori...</option>
                  {existingCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseNewCategory(true)}
                  className="px-3 py-2 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-xl border border-brand-200 transition-all whitespace-nowrap"
                >
                  Tambah Baru
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nama kategori baru"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => { setUseNewCategory(false); setNewCategory(""); }}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all whitespace-nowrap"
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Nama Jenis Sampah
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Botol Plastik"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Harga Awal per kg (Rp)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* Accepted toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsAccepted((v) => !v)}
              className="relative"
            >
              {isAccepted ? (
                <ToggleRight size={28} className="text-brand-600" />
              ) : (
                <ToggleLeft size={28} className="text-slate-300" />
              )}
            </button>
            <span className="text-sm font-bold text-slate-700">
              {isAccepted ? "Diterima" : "Tidak Diterima"}
            </span>
          </label>
        </div>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || createType.isPending || setPriceMutation.isPending}
            className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {(createType.isPending || setPriceMutation.isPending) && (
              <Loader2 size={14} className="animate-spin" />
            )}
            Tambah Jenis Sampah
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit price inline ───────────────────────────────────────────────────────

function EditPriceButton({
  trashType,
  currentPrice,
}: {
  trashType: TrashType;
  currentPrice: number;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(String(currentPrice));
  const updatePrice = useUpdatePrice();

  async function handleSave() {
    const price = Number(newPrice);
    if (price > 0 && price !== currentPrice) {
      await updatePrice.mutateAsync({
        trashTypeId: trashType.id,
        pricePerKg: price,
        createdBy: user?.id ?? "",
      });
    }
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          autoFocus
          className="w-24 px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-brand-600"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={updatePrice.isPending}
          className="px-2 py-1 bg-brand-600 text-white text-[10px] font-black rounded-lg hover:bg-brand-700 transition-all"
        >
          Simpan
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-200 transition-all"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-50 border border-brand-100 text-brand-600 font-bold rounded-lg text-xs hover:bg-brand-100 transition-all"
    >
      <TrendingUp size={12} />
      Ubah Harga
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function PriceList() {
  usePageTitle("Kelola Harga");

  const { data: trashTypes, isLoading, error, refetch } = useAllTrashTypes();
  const updateTrashType = useUpdateTrashType();
  const [search, setSearch] = useState("");
  const [historyType, setHistoryType] = useState<TrashType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch active prices to show current price per row
  const { data: activePrices } = useActivePrices();

  const priceMap = useMemo(() => {
    const map = new Map<string, { price: number; updatedAt: string }>();
    activePrices?.forEach((p) => {
      map.set(p.trash_type_id, { price: p.price_per_kg, updatedAt: p.created_at });
    });
    return map;
  }, [activePrices]);

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    trashTypes?.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [trashTypes]);

  const grouped = useMemo(() => {
    const filtered =
      trashTypes?.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      ) ?? [];

    const map = new Map<string, TrashType[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return Array.from(map.entries());
  }, [trashTypes, search]);

  async function toggleAccepted(type: TrashType) {
    await updateTrashType.mutateAsync({
      id: type.id,
      payload: { is_accepted: !type.is_accepted },
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-brand-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Kelola
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Harga Sampah
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Atur harga dan jenis sampah yang diterima
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
        >
          <Plus size={15} />
          Tambah Jenis
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari jenis sampah..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm font-medium placeholder-slate-400"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message="Gagal memuat data." onRetry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Jenis Sampah
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Harga/kg
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Terakhir Update
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              {grouped.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <DollarSign size={28} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">
                        Tidak ada data
                      </p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                grouped.map(([category, items]) => (
                  <tbody key={`cat-${category}`} className="border-b border-slate-100 last:border-0">
                    <tr className="bg-slate-50/30">
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                      >
                        {category}
                      </td>
                    </tr>
                    {items.map((t) => {
                      const priceInfo = priceMap.get(t.id);
                      return (
                        <tr
                          key={t.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3 text-xs font-bold text-slate-900">
                            {t.name}
                          </td>
                          <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap">
                            {priceInfo
                              ? formatRupiah(priceInfo.price)
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleAccepted(t)}
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                                t.is_accepted
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-red-50 text-red-600 border-red-100"
                              }`}
                            >
                              {t.is_accepted ? "Diterima" : "Tidak Diterima"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                            {priceInfo
                              ? formatShortDate(priceInfo.updatedAt)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {priceInfo && (
                                <EditPriceButton
                                  trashType={t}
                                  currentPrice={priceInfo.price}
                                />
                              )}
                              <button
                                onClick={() => setHistoryType(t)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all"
                              >
                                <History size={12} />
                                Riwayat
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))
              )}
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {historyType && (
        <PriceHistory trashType={historyType} onClose={() => setHistoryType(null)} />
      )}
      {showAddModal && (
        <AddTypeModal
          onClose={() => setShowAddModal(false)}
          existingCategories={existingCategories}
        />
      )}
    </div>
  );
}


