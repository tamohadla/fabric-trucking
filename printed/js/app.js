import { CrudService } from "./crudService.js";
import { ImageService } from "./imageService.js";
import { applyFiltersAndSort, statusBadgeClass, normalizeRow } from "./table.js";
import { initEditModal } from "./modalEdit.js";
import { initDuplicateModal } from "./modalDuplicate.js";
import { bindRowActions } from "./actions.js";

function ensureSupabaseScript() {
  if (window.supabase) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load supabase-js"));
    document.head.appendChild(s);
  });
}

const state = { rows: [] };

function badgeHtml(status) {
  const cls = statusBadgeClass(status);
  const text = status || "لم يتم التشكيل";
  return `<span class="badge ${cls}">${text}</span>`;
}

function renderTable() {
  const body = document.getElementById("rowsBody");
  const statusFilter = document.getElementById("statusFilter").value;
  const sortBy = document.getElementById("sortBy").value;
  const search = document.getElementById("searchBox").value;

  const filtered = applyFiltersAndSort(state.rows, { statusFilter, sortBy, search });

  body.innerHTML = filtered.map((r, idx) => {
    const img = r.imageurl || "";
    const payload = encodeURIComponent(JSON.stringify(r));
    return `<tr>
      <td>${idx+1}</td>
      <td>${img ? `<img class="thumb" data-action="view" data-payload='${decodeURIComponent(payload)}' src="${img}" alt="img"/>` : ""}</td>
      <td>${r.designcode || ""}</td>
      <td>${r.screenscount ?? ""}</td>
      <td>${r.mariagenumber ?? ""}</td>
      <td>${r.printtype || ""}</td>
      <td>${r.groundprep || ""}</td>
      <td>${r.rawmaterial || ""}</td>
      <td>${r.grade || ""}</td>
      <td>${r.qty_kg ?? ""}</td>
      <td>${(r.order_date||"").slice(0,10)}</td>
      <td>${badgeHtml(r.status)}</td>
      <td>${r.notes || ""}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn" data-action="edit" data-id="${r.id}" data-payload='${decodeURIComponent(payload)}'>تعديل</button>
          <button class="btn" data-action="dup" data-id="${r.id}" data-payload='${decodeURIComponent(payload)}'>تكرار</button>
          <button class="btn danger" data-action="del" data-id="${r.id}" data-payload='${decodeURIComponent(payload)}'>حذف</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

async function refresh() {
  const data = await CrudService.listAll();
  state.rows = data.map(normalizeRow);
  renderTable();
}

function bindToolbar() {
  ["searchBox","statusFilter","sortBy"].forEach(id => {
    document.getElementById(id).addEventListener("input", renderTable);
    document.getElementById(id).addEventListener("change", renderTable);
  });
}

function initImageViewer() {
  const backdrop = document.getElementById("imageModal");
  const closeBtn = document.getElementById("imageModalClose");
  const img = document.getElementById("imageModalImg");
  function open(url) {
    if (!url) return;
    img.src = url;
    backdrop.classList.add("active");
    backdrop.setAttribute("aria-hidden","false");
  }
  function close() {
    backdrop.classList.remove("active");
    backdrop.setAttribute("aria-hidden","true");
    img.src = "";
  }
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", (e)=>{ if (e.target===backdrop) close(); });
  return { open, close };
}

function todayISO() {
  return new Date().toISOString().slice(0,10);
}

function initInputDefaults() {
  const d = document.getElementById("in_orderdate");
  if (d && !d.value) d.value = todayISO();
}

function getInputValue(id) { return document.getElementById(id).value; }

async function saveOneMariage() {
  const designcode = getInputValue("in_designcode").trim();
  const screenscount = Number(getInputValue("in_screenscount") || 0);
  const mariagenumber = Number(getInputValue("in_mariagenumber") || 0);
  if (!designcode || !mariagenumber) { alert("أدخل رقم الرسمة ورقم المرياج"); return; }

  const row = {
    designcode,
    screenscount,
    mariagenumber,
    printtype: getInputValue("in_printtype"),
    groundprep: getInputValue("in_groundprep"),
    rawmaterial: getInputValue("in_rawmaterial"),
    grade: getInputValue("in_grade"),
    qty_kg: getInputValue("in_qtykg") ? Number(getInputValue("in_qtykg")) : null,
    order_date: getInputValue("in_orderdate") || null,
    status: getInputValue("in_status"),
    notes: document.getElementById("in_notes").value,
  };

  // image handling
  const file = document.getElementById("in_image").files?.[0];
  const image_key = `${designcode}|${mariagenumber}`;
  row.image_key = image_key;

  if (file) {
    const image_path = await ImageService.uploadImage(designcode, mariagenumber, file);
    row.image_path = image_path;
    row.imageurl = ImageService.publicUrl(image_path);
  } else {
    // if image exists already for this key, do not require (duplicate by mistake)
    // keep empty; user can update later from edit modal
  }

  await CrudService.insert(row);
}

function clearMariageFields(keepDesign=true) {
  ["in_mariagenumber","in_printtype","in_groundprep","in_rawmaterial","in_grade","in_qtykg","in_notes"].forEach(id=>{
    const el=document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("in_image").value = "";
  document.getElementById("in_status").value = "لم يتم التشكيل";
  document.getElementById("in_orderdate").value = todayISO();
  if (!keepDesign) {
    document.getElementById("in_designcode").value="";
    document.getElementById("in_screenscount").value="";
  }
}

function initForm() {
  const addBtn = document.getElementById("btn_addMariage");
  const saveBtn = document.getElementById("btn_saveMariages");

  addBtn.addEventListener("click", () => {
    // this UI is single-mariage entry; "add new" just clears mariage fields
    clearMariageFields(true);
    const seq = document.getElementById("mariageSeqLabel");
    seq.textContent = String((Number(seq.textContent||"1")+1));
  });

  saveBtn.addEventListener("click", async () => {
    try {
      await saveOneMariage();
      clearMariageFields(true);
      await refresh();
      alert("تم الحفظ.");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ. راجع Console.");
    }
  });
}

async function main() {
  await ensureSupabaseScript();

  // make sure all modals are hidden on load
  document.querySelectorAll(".modal-backdrop").forEach(b=>b.classList.remove("active"));

  initInputDefaults();

  const imageViewer = initImageViewer();
  const editModal = initEditModal({ onSaved: refresh });
  const dupModal = initDuplicateModal({ onSaved: refresh });

  document.body.addEventListener("click", bindRowActions({
    onEdit: (row)=>editModal.open(row),
    onDuplicate: (row)=>dupModal.open(row),
    onViewImage: (url)=>imageViewer.open(url),
    refresh,
  }));

  bindToolbar();
  initForm();

  await refresh();
}

main().catch(err => {
  console.error(err);
  alert("تعذر تشغيل الصفحة. راجع Console.");
});
