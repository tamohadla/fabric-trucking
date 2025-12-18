import { CFG } from "./config.js";
import { sb } from "./supabaseClient.js";
import { ImageService } from "./imageService.js";

async function loadPrintedTable() {
  return await sb.from(CFG.TABLE_NAME).select("*").order("date", { ascending: false });
}

async function bestEffortBackfillImageKey(row) {
  if (!row.image_key) {
    const key = ImageService.buildImageKey(row.designcode, row.mariagenumber);
    row.image_key = key;
    try { await sb.from(CFG.TABLE_NAME).update({ image_key: key }).eq("id", row.id); } catch {}
  }
  return row;
}

async function countRowsByImageKey(imageKey, excludeId = null) {
  if (!imageKey) return 0;
  let q = sb.from(CFG.TABLE_NAME).select("id", { count: "exact", head: true }).eq("image_key", imageKey);
  if (excludeId != null) q = q.neq("id", excludeId);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

async function deleteRow(row) {
  // Delete DB row first or later? We'll do: check image usage first, then delete row, then delete image if safe.
  const imageKey = row.image_key || ImageService.buildImageKey(row.designcode, row.mariagenumber);
  const imagePath = row.image_path || (row.imageurl ? ImageService.extractStoragePathFromPublicUrl(row.imageurl) : "");
  const others = await countRowsByImageKey(imageKey, row.id);

  const { error } = await sb.from(CFG.TABLE_NAME).delete().eq("id", row.id);
  if (error) throw error;

  // If no other rows reference the image, delete it (only if it's in our canonical space)
  if (others === 0 && imagePath) {
    // Only delete paths under STORAGE_PREFIX to avoid accidental deletes
    if (imagePath.startsWith(CFG.STORAGE_PREFIX + "/")) {
      try { await ImageService.deleteStoragePath(imagePath); } catch {}
    }
  }
}

async function updateRow(id, payload) {
  const { error } = await sb.from(CFG.TABLE_NAME).update(payload).eq("id", id);
  if (error) throw error;
}

async function insertRow(payload) {
  const { error } = await sb.from(CFG.TABLE_NAME).insert(payload);
  if (error) throw error;
}

export const CrudService = {
  loadPrintedTable,
  bestEffortBackfillImageKey,
  countRowsByImageKey,
  deleteRow,
  updateRow,
  insertRow
};
