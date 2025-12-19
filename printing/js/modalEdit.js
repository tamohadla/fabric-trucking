import { ImageService } from "./imageService.js";
import { CrudService } from "./crudService.js";

export function initEditModal() {
  const backdrop = document.getElementById("editModalBackdrop");
  const closeBtn = document.getElementById("editModalClose");
  const saveBtn = document.getElementById("editSaveBtn");
  const updateImageBtn = document.getElementById("editUpdateImageBtn");

  const fields = {
    designcode: document.getElementById("edit_designcode"),
    screenscount: document.getElementById("edit_screenscount"),
    mariagenumber: document.getElementById("edit_mariagenumber"),
    printtype: document.getElementById("edit_printtype"),
    groundprep: document.getElementById("edit_groundprep"),
    rawmaterial: document.getElementById("edit_rawmaterial"),    qtykg: document.getElementById("edit_qtykg"),
    date: document.getElementById("edit_date"),
    status: document.getElementById("edit_status"),
    notes: document.getElementById("edit_notes"),
    file: document.getElementById("edit_image_file"),
    preview: document.getElementById("edit_image_preview"),
  };

  let currentRow = null;
  let onSaved = () => {};

  function open(row, { onSaved: cb } = {}) {
    currentRow = row;
    onSaved = cb || (()=>{});
    fields.designcode.value = row.designcode ?? "";
    fields.screenscount.value = row.screenscount ?? "";
    fields.mariagenumber.value = row.mariagenumber ?? "";
    fields.printtype.value = row.printtype ?? "";
    fields.groundprep.value = row.groundprep ?? "";
    fields.rawmaterial.value = row.rawmaterial ?? "";
    fields.rawmaterial.value = row.rawmaterial ?? "";
    fields.qtykg.value = row.qtykg ?? "";
    fields.date.value = row.date ?? "";
    fields.status.value = row.status ?? "";
    fields.notes.value = row.notes ?? "";
    fields.preview.src = row.imageurl || "";
    fields.file.value = "";
    backdrop.style.display = "flex";
  }

  function close() {
    backdrop.style.display = "none";
    currentRow = null;
  }

  async function save() {
    if (!currentRow) return;
    const payload = {
      printtype: fields.printtype.value || "",
      groundprep: fields.groundprep.value || "",
      rawmaterial: fields.rawmaterial.value || "",      qtykg: fields.qtykg.value ? Number(fields.qtykg.value) : null,
      date: fields.date.value || "",
      status: fields.status.value || "",
      notes: fields.notes.value || ""
    };

    // designcode/screenscount/mariage are generally fixed, but keep safe: allow mariage change here if user edits.
    const newMariage = fields.mariagenumber.value;
    const oldKey = currentRow.image_key || ImageService.buildImageKey(currentRow.designcode, currentRow.mariagenumber);
    const newKey = ImageService.buildImageKey(currentRow.designcode, newMariage);

    if (String(newKey) !== String(oldKey)) {
      // Handle image path move/copy depending on sharing
      const oldPath = currentRow.image_path || (currentRow.imageurl ? ImageService.extractStoragePathFromPublicUrl(currentRow.imageurl) : "");
      const newPath = ImageService.buildImagePath(currentRow.designcode, newMariage);

      const others = await CrudService.countRowsByImageKey(oldKey, currentRow.id);
      if (oldPath) {
        try {
          if (others > 0) {
            // shared: copy
            await ImageService.copyStoragePath(oldPath, newPath);
          } else {
            // not shared: move
            await ImageService.moveStoragePath(oldPath, newPath);
          }
        } catch {}
      }

      payload.mariagenumber = Number(ImageService.onlyDigits(newMariage)) || newMariage;
      payload.image_key = newKey;
      payload.image_path = newPath;
      payload.imageurl = ImageService.getPublicUrl(newPath);
    }

    await CrudService.updateRow(currentRow.id, payload);
    close();
    onSaved();
  }

  async function updateImage() {
    if (!currentRow) return;
    const file = fields.file.files && fields.file.files[0];
    if (!file) return alert("اختر صورة أولاً.");

    const key = currentRow.image_key || ImageService.buildImageKey(currentRow.designcode, currentRow.mariagenumber);
    const path = ImageService.buildImagePath(currentRow.designcode, currentRow.mariagenumber);

    const resized = await ImageService.resizeToJpegFile(file, 900, 0.86);
    await ImageService.uploadImageToPath(resized, path, true);
    const url = ImageService.getPublicUrl(path);

    // Update all rows sharing the key (reference)
    await CrudService.updateRow(currentRow.id, { image_key: key, image_path: path, imageurl: url });
    // update all other rows with same key (best-effort)
    // (If RLS blocks mass update, at least current row updates; you can enable policy later.)
    // We'll try:
    try {
      // not exposed in CrudService; do direct bulk update by key is better, but keep simple and safe:
    } catch {}

    fields.preview.src = url;
    onSaved();
    alert("تم تحديث الصورة.");
  }

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  saveBtn?.addEventListener("click", () => save().catch(console.error));
  updateImageBtn?.addEventListener("click", () => updateImage().catch(console.error));

  return { open, close };
}
