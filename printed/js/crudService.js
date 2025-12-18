import { TABLE_PRINTED } from "./config.js";
import { getSupabase } from "./supabaseClient.js";

export class CrudService {
  static async listAll() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE_PRINTED)
      .select("*")
      .order("order_date", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async insert(row) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(TABLE_PRINTED).insert(row).select("*").single();
    if (error) throw error;
    return data;
  }

  static async update(id, patch) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(TABLE_PRINTED).update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  }

  static async remove(id) {
    const supabase = getSupabase();
    const { error } = await supabase.from(TABLE_PRINTED).delete().eq("id", id);
    if (error) throw error;
  }

  static async countByImageKey(image_key) {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from(TABLE_PRINTED)
      .select("*", { count: "exact", head: true })
      .eq("image_key", image_key);
    if (error) throw error;
    return count || 0;
  }
}
