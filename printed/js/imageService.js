import { CFG } from "./config.js";
import { sb } from "./supabaseClient.js";

function arabicToEnglishDigits(str) {
  return String(str ?? "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}
function onlyDigits(str) {
  return arabicToEnglishDigits(str).replace(/\D+/g, "");
}

function buildImageKey(designCode, mariageNumber) {
  const d = arabicToEnglishDigits(designCode).trim();
  const m = onlyDigits(mariageNumber);
  return `${d}|${m}`;
}

function buildImagePath(designCode, mariageNumber) {
  const d = arabicToEnglishDigits(designCode).trim();
  const m = onlyDigits(mariageNumber);
  return `${CFG.STORAGE_PREFIX}/${d}/${d}_m${m}.jpg`;
}

function getPublicUrl(path) {
  try {
    const { data } = sb.storage.from(CFG.STORAGE_BUCKET).getPublicUrl(path);
    return data?.publicUrl || "";
  } catch {
    return "";
  }
}

function extractStoragePathFromPublicUrl(url) {
  if (!url) return "";
  const marker = `/storage/v1/object/public/${CFG.STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return "";
  return url.slice(idx + marker.length);
}

async function storageExists(path) {
  const parts = path.split("/");
  const name = parts.pop();
  const dir = parts.join("/");
  const { data, error } = await sb.storage.from(CFG.STORAGE_BUCKET).list(dir, { search: name, limit: 10 });
  if (error) throw error;
  return (data || []).some(f => f.name === name);
}

async function resizeToJpegFile(file, maxWidth = 900, quality = 0.86) {
  // Best-effort: if not an image, return original
  if (!file || !file.type?.startsWith("image/")) return file;
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = URL.createObjectURL(file);
  });

  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
  return new File([blob], "upload.jpg", { type: "image/jpeg" });
}

async function uploadImageToPath(file, path, upsert = true) {
  const { error } = await sb.storage.from(CFG.STORAGE_BUCKET).upload(path, file, {
    upsert,
    contentType: file.type || "image/jpeg",
    cacheControl: "3600"
  });
  if (error) throw error;
}

async function deleteStoragePath(path) {
  if (!path) return;
  const { error } = await sb.storage.from(CFG.STORAGE_BUCKET).remove([path]);
  if (error) throw error;
}

async function moveStoragePath(fromPath, toPath) {
  const { error } = await sb.storage.from(CFG.STORAGE_BUCKET).move(fromPath, toPath);
  if (error) throw error;
}

async function copyStoragePath(fromPath, toPath) {
  const { error } = await sb.storage.from(CFG.STORAGE_BUCKET).copy(fromPath, toPath);
  if (error) throw error;
}

export const ImageService = {
  arabicToEnglishDigits,
  onlyDigits,
  buildImageKey,
  buildImagePath,
  getPublicUrl,
  extractStoragePathFromPublicUrl,
  storageExists,
  resizeToJpegFile,
  uploadImageToPath,
  deleteStoragePath,
  moveStoragePath,
  copyStoragePath
};
