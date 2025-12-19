import { ImageService } from "./imageService.js";
import { CrudService } from "./crudService.js";

export function initDuplicateModal() {
  const backdrop = document.getElementById("dupModalBackdrop");
  const closeBtn = document.getElementById("dupModalClose");
  const saveBtn = document.getElementById("dupSaveBtn");
  const preview = document.getElementById("dup_image_preview");

  const f = {
    designcode: document.getElementById("dup_designcode"),
    screenscount: document.getElementById("dup_screenscount"),
    mariagenumber: document.getElementById("dup_mariagenumber"),
    printtype: document.getElementById("dup_printtype"),
    groundprep: document.getElementById("dup_groundprep"),
    rawmaterial: document.getElementById("dup_rawmaterial"),
    quality: document.getElementById("dup_quality"),
    qtykg: document.getElementById("dup_qtykg"),
    date: document.getElementById("dup_date"),
    notes: document.getElementById("dup_notes"),
  };

  let srcRow = null;
  let onSaved = () => {};

  function open(row, { onSaved: cb } = {}) {
    srcRow = row;
    onSaved = cb || (()=>{});
    f.designcode.value = row.designcode ?? "";
    f.screenscount.value = row.screenscount ?? "";
    f.mariagenumber.value = row.mariagenumber ?? "";
    f.printtype.value = row.printtype ?? "";
    f.groundprep.value = row.groundprep ?? "";
    f.rawmaterial.value = row.rawmaterial ?? "";
    f.quality.value = row.quality ?? "";
    f.qtykg.value = row.qtykg ?? "";
    f.date.value = row.date ?? "";
    f.notes.value = row.notes ?? "";
    preview.src = row.imageurl || "";
    backdrop.style.display = "flex";
  }

  function close() {
    backdrop.style.display = "none";
    srcRow = null;
  }

  async function save() {
    if (!srcRow) return;

    const designcode = srcRow.designcode;
    const mariage = srcRow.mariagenumber;
    const key = ImageService.buildImageKey(designcode, mariage);
    const path = ImageService.buildImagePath(designcode, mariage);

    // Reuse existing canonical image if it exists
    let imageurl = "";
    try {
      if (await ImageService.storageExists(path)) imageurl = ImageService.getPublicUrl(path);
    } catch {}

    const payload = {
      designcode,
      mariagenumber: Number(mariage),
      screenscount: srcRow.screenscount ?? null,
      printtype: f.printtype.value || "",
      groundprep: f.groundprep.value || "",
      rawmaterial: f.rawmaterial.value || "",
      quality: f.quality.value || "",
      qtykg: f.qtykg.value ? Number(f.qtykg.value) : null,
      date: f.date.value || "",
      status: "لم يتم التشكيل",
      notes: f.notes.value || "",
      image_key: key,
      image_path: imageurl ? path : null,
      imageurl: imageurl || null
    };

    await CrudService.insertRow(payload);
    close();
    onSaved();
  }

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", (e)=>{ if (e.target === backdrop) close(); });
  saveBtn?.addEventListener("click", () => save().catch(console.error));

  return { open, close };
}
