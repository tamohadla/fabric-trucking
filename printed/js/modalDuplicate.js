import { CrudService } from "./crudService.js";

export function initDuplicateModal({ onSaved }) {
  const backdrop = document.getElementById("dupModalBackdrop");
  const closeBtn = document.getElementById("dupModalClose");
  const saveBtn = document.getElementById("dupSaveBtn");

  const fields = {
    designcode: document.getElementById("dup_designcode"),
    screenscount: document.getElementById("dup_screenscount"),
    mariagenumber: document.getElementById("dup_mariagenumber"),
    printtype: document.getElementById("dup_printtype"),
    groundprep: document.getElementById("dup_groundprep"),
    rawmaterial: document.getElementById("dup_rawmaterial"),
    grade: document.getElementById("dup_grade"),
    qtykg: document.getElementById("dup_qtykg"),
    orderdate: document.getElementById("dup_orderdate"),
    status: document.getElementById("dup_status"),
    notes: document.getElementById("dup_notes"),
    preview: document.getElementById("dup_preview"),
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
    fields.qtykg.value = row.qty_kg ?? "";
    fields.orderdate.value = (new Date()).toISOString().slice(0,10);
    fields.status.value = row.status ?? "لم يتم التشكيل";
    fields.notes.value = row.notes ?? "";
    fields.preview.src = row.imageurl || row.image_url || "";
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
    const row = {
      designcode: current.designcode,
      screenscount: current.screenscount,
      mariagenumber: current.mariagenumber,
      printtype: fields.printtype.value,
      groundprep: fields.groundprep.value,
      rawmaterial: fields.rawmaterial.value,
      grade: fields.grade.value,
      qty_kg: fields.qtykg.value ? Number(fields.qtykg.value) : null,
      order_date: fields.orderdate.value || null,
      status: fields.status.value,
      notes: fields.notes.value,
      image_key: current.image_key || `${current.designcode}|${current.mariagenumber}`,
      image_path: current.image_path || null,
      imageurl: current.imageurl || null,
    };
    await CrudService.insert(row);
    close();
    onSaved?.();
  }

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  saveBtn?.addEventListener("click", () => save().catch(console.error));

  return { open, close };
}
