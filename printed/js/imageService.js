import { BUCKET_IMAGES } from "./config.js";
import { getSupabase } from "./supabaseClient.js";

export class ImageService {
  static makeImagePath(designcode, mariagenumber, fileName) {
    const ext = (fileName && fileName.split(".").pop()) ? fileName.split(".").pop().toLowerCase() : "jpg";
    return `printed/${designcode}/${designcode}_m${mariagenumber}.${ext}`;
  }

  static async uploadImage(designcode, mariagenumber, file) {
    const supabase = getSupabase();
    const path = this.makeImagePath(designcode, mariagenumber, file?.name || "image.jpg");
    const { error } = await supabase.storage.from(BUCKET_IMAGES).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  static publicUrl(path) {
    const supabase = getSupabase();
    const { data } = supabase.storage.from(BUCKET_IMAGES).getPublicUrl(path);
    return data?.publicUrl || "";
  }

  static async remove(path) {
    const supabase = getSupabase();
    const { error } = await supabase.storage.from(BUCKET_IMAGES).remove([path]);
    if (error) throw error;
  }
}
