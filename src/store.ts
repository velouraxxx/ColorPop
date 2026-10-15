import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "./types";
export let db: SupabaseClient | null = null;
export async function connect() {
  const r = await fetch("/api/config");
  if (!r.ok)
    throw new Error("The ColorPop server is unavailable. Start npm run dev.");
  const c = await r.json();
  if (c.url && c.key) db = createClient(c.url, c.key);
  return c;
}
export function readLocal(): Item[] {
  try {
    return JSON.parse(localStorage.getItem("colorpop_v2_guest") || "[]");
  } catch {
    return [];
  }
}
export function writeLocal(items: Item[]) {
  localStorage.setItem("colorpop_v2_guest", JSON.stringify(items));
}
export async function readCloud() {
  const { data, error } = await db!
    .from("colorpop_items")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Item[];
}
export async function saveCloud(item: Item, previous?: Item) {
  const {
    data: { user },
    error: authError,
  } = await db!.auth.getUser();
  if (authError || !user) throw new Error("Sign in again to save.");
  const next = {
    ...item,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };
  const query = previous
    ? db!
        .from("colorpop_items")
        .update(next)
        .eq("id", item.id)
        .eq("updated_at", previous.updated_at)
    : db!.from("colorpop_items").insert(next);
  const { data, error } = await query.select().single();
  if (error)
    throw new Error(
      error.code === "PGRST116"
        ? "This item changed on another device. Refresh before saving again."
        : error.message,
    );
  return data as Item;
}
