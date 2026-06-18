import { supabase } from "../lib/supabase";
import type { TrashPrice, TrashType } from "../types";

export interface CurrentPriceItem extends TrashPrice {
  trash_type: TrashType;
}

export interface PricesByCategory {
  category: string;
  items: CurrentPriceItem[];
}

export async function getActivePrices(): Promise<CurrentPriceItem[]> {
  const { data, error } = await supabase
    .from("trash_prices")
    .select("*, trash_type:trash_types(*)")
    .eq("is_active", true);
  if (error) throw error;
  return data as CurrentPriceItem[];
}

/**
 * Fetch all active prices joined with their trash types,
 * then group them by category (Plastik, Kertas, Logam, Kaca, etc.).
 */
export async function getCurrentPrices(): Promise<PricesByCategory[]> {
  const items = await getActivePrices();

  const grouped = new Map<string, CurrentPriceItem[]>();
  for (const item of items) {
    // Hide deactivated trash types from the public homepage.
    if (!item.trash_type.is_accepted) continue;
    const cat = item.trash_type.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

/**
 * Fetch only trash types that are currently accepted.
 */
export async function getAcceptedTypes(): Promise<TrashType[]> {
  const { data, error } = await supabase
    .from("trash_types")
    .select("*")
    .eq("is_accepted", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data as TrashType[];
}

/**
 * Fetch all trash types ordered by category, name.
 */
export async function getAllTrashTypes(): Promise<TrashType[]> {
  const { data, error } = await supabase
    .from("trash_types")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data as TrashType[];
}

export async function createTrashType(
  payload: Omit<TrashType, "id" | "created_at" | "updated_at">
): Promise<TrashType> {
  const { data, error } = await supabase
    .from("trash_types")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as TrashType;
}

export async function updateTrashType(
  id: string,
  payload: Partial<Omit<TrashType, "id" | "created_at" | "updated_at">>
): Promise<TrashType> {
  const { data, error } = await supabase
    .from("trash_types")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TrashType;
}

/**
 * Set a new active price for a trash type.
 * Deactivates all existing prices for the type, then inserts a new active one.
 */
export async function setNewPrice(
  trashTypeId: string,
  pricePerKg: number,
  createdBy: string
): Promise<TrashPrice> {
  await supabase
    .from("trash_prices")
    .update({ is_active: false })
    .eq("trash_type_id", trashTypeId)
    .eq("is_active", true);

  const { data, error } = await supabase
    .from("trash_prices")
    .insert({
      trash_type_id: trashTypeId,
      price_per_kg: pricePerKg,
      effective_date: new Date().toISOString().split("T")[0],
      is_active: true,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TrashPrice;
}

export async function deleteTrashType(id: string): Promise<void> {
  const { error } = await supabase.from("trash_types").delete().eq("id", id);
  if (error) throw error;
}

export async function updatePrice(
  trashTypeId: string,
  pricePerKg: number,
  createdBy: string
): Promise<TrashPrice> {
  return setNewPrice(trashTypeId, pricePerKg, createdBy);
}

/**
 * Fetch all price history for a trash type, ordered by effective_date desc.
 */
export async function getPriceHistory(
  trashTypeId: string
): Promise<TrashPrice[]> {
  const { data, error } = await supabase
    .from("trash_prices")
    .select("*")
    .eq("trash_type_id", trashTypeId)
    .order("effective_date", { ascending: false });
  if (error) throw error;
  return data as TrashPrice[];
}
