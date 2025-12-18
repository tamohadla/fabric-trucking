import { ImageService } from "./imageService.js";
import { CrudService } from "./crudService.js";

export function initEditModal({ onSaved }) {
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
    rawmaterial: document.getElementById("edit_rawmaterial"),
    grade: document.getElementById("edit_grade"),
    qtykg: document.getElementById("edit_qtykg"),
    orderdate: document.getElementById("edit_orderdate"),
    status: document.getElementById("edit_status"),
    notes: document.getElementById("edit_notes"),
    image: document.getElementById("edit_image"),
    preview: document.getElementById("edit_preview"),
  };

  let current = null;

  function open(row) {
    current = row;
    fields.designcode.value = row.designcode ?? "";
    fields.screenscount.value = row.screenscount ?? "";
    fields.mariagenumber.value = row.mariagenumber ?? "";
    fields.printtype.value = row.printtype ?? "";
    fields.groundprep.value = row.groundprep ?? "";
    fields.rawmaterial.value = row.rawmaterial ?? "";
    fields.grade.value = row.grade ?? "";
    fields.qtykg.value = row.qty_kg ?? row.qtykg ?? "";
    fields.orderdate.value = (row.order_date ?? "").slice(0,10);
    fields.status.value = row.status ?? "لم يتم التشكيل";
    fields.notes.value = row.notes ?? "";
    fields.preview.src = row.imageurl || row.image_url || "";
    fields.image.value = "";
    backdrop.classList.add("active");
    backdrop.setAttribute("aria-hidden","false");
  }

  function close() {
    backdrop.classList.remove("active");
    backdrop.setAttribute("aria-hidden","true");
    current = null;
  }

  async function save() {
    if (!current) return;

    const newMariage = String(fields.mariagenumber.value || "").trim();
    const oldMariage = String(current.mariagenumber ?? "").trim();

    // If mariage number changed and no new image selected, stop (to keep image path consistent)
    if (newMariage && oldMariage && newMariage !== oldMariage && !fields.image.files?.[0]) {
      alert("تم تغيير رقم المرياج. الرجاء اختيار صورة جديدة حتى يتم حفظها بالاسم الصحيح.");
      return;
    }

    let patch = {
      mariagenumber: Number(newMariage || current.mariagenumber),
      printtype: fields.printtype.value,
      groundprep: fields.groundprep.value,
      rawmaterial: fields.rawmaterial.value,
      grade: fields.grade.value,
      qty_kg: fields.qtykg.value ? Number(fields.qtykg.value) : null,
      order_date: fields.orderdate.value || null,
      status: fields.status.value,
      notes: fields.notes.value,
    };

    // If user selected new image, upload to correct path based on (designcode, mariage)
    const file = fields.image.files?.[0];
    if (file) {
      const designcode = String(fields.designcode.value).trim();
      const mariage = Number(fields.mariagenumber.value);
      const image_key = `${designcode}|${mariage}`;
      const image_path = await ImageService.uploadImage(designcode, mariage, file);
      const imageurl = ImageService.publicUrl(image_path);
      patch = { ...patch, image_key, image_path, imageurl };
      fields.preview.src = imageurl;
    }

    await CrudService.update(current.id, patch);
    close();
    onSaved?.();
  }

  async function updateImage() {
    if (!current) return;
    const file = fields.image.files?.[0];
    if (!file) { alert("اختر صورة أولاً."); return; }

    const designcode = String(fields.designcode.value).trim();
    const mariage = Number(fields.mariagenumber.value);
    const image_key = `${designcode}|${mariage}`;
    const image_path = await ImageService.uploadImage(designcode, mariage, file);
    const imageurl = ImageService.publicUrl(image_path);

    await CrudService.update(current.id, { image_key, image_path, imageurl });
    fields.preview.src = imageurl;
    onSaved?.();
    alert("تم تحديث الصورة.");
  }

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  saveBtn?.addEventListener("click", () => save().catch(console.error));
  updateImageBtn?.addEventListener("click", () => updateImage().catch(console.error));

  return { open, close };
}
