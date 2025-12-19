import { CFG } from "./config.js";
import { sb } from "./supabaseClient.js";
import { ImageService } from "./imageService.js";
import { CrudService } from "./crudService.js";
import { applyFiltersAndSort, renderPrintedTable } from "./table.js";
import { wireTableActions } from "./actions.js";
import { initEditModal } from "./modalEdit.js";
import { initDuplicateModal } from "./modalDuplicate.js";

// Global error helper (shows user-friendly message)
function showFatal(msg, err) {
  console.error(msg, err);
  alert(msg + "\n" + "راجع Console للتفاصيل." );
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

const el = {
  addMariageBtn: document.getElementById("addMariageBtn"),
  saveAllBtn: document.getElementById("saveAllBtn"),
  mariagesContainer: document.getElementById("mariagesContainer"),
  statusFilter: document.getElementById("statusFilter"),
  sortField: document.getElementById("sortField"),
  searchInput: document.getElementById("searchInput"),
  tbody: document.getElementById("printedTableBody"),
  totalsInfo: document.getElementById("totalsInfo"),
};

const state = { groups: [], rows: [] };

function makeGroup(prefill = {}) {
  const wrap = document.createElement("div");
  wrap.className = "mariage-card";
  wrap.innerHTML = `
    <div class="row">
<div class="field"><label>رقم المرياج</label><input class="inp" data-k="mariagenumber" placeholder="مثال: 2"></div>
      <div class="field"><label>نوع الطباعة</label><input class="inp" data-k="printtype" placeholder="مثال: بجمنت"></div>
    </div>
    <div class="row">
      <div class="field"><label>تحضير الأرضية</label><input class="inp" data-k="groundprep" placeholder="أوفوايت"></div>
      <div class="field"><label>الخامة</label><input class="inp" data-k="rawmaterial" placeholder=""></div>
<div class="field"><label>الكمية (كغ)</label><input class="inp" data-k="qtykg" placeholder="400"></div>
    </div>
    <div class="row">
      <div class="field"><label>تاريخ الطلب</label><input class="inp" data-k="date" type="date"></div>
      <div class="field grow"><label>ملاحظات</label><input class="inp" data-k="notes" placeholder=""></div>
      <div class="field"><label>الصورة</label><input class="inp" data-k="image" type="file" accept="image/*"></div>
      <div class="field"><label>&nbsp;</label><button class="btn small danger" data-k="remove">حذف</button></div>
    </div>
  `;
  // Prefill
  wrap.querySelector('[data-k="date"]').value = prefill.date || todayISO();
  for (const [k,v] of Object.entries(prefill)) {
    const inp = wrap.querySelector(`[data-k="${k}"]`);
    if (inp && inp.type !== "file") inp.value = v ?? "";
  }

  const group = {
    root: wrap,
    get mariagenumber(){ return wrap.querySelector('[data-k="mariagenumber"]').value; },
    get printtype(){ return wrap.querySelector('[data-k="printtype"]').value; },
    get groundprep(){ return wrap.querySelector('[data-k="groundprep"]').value; },
    get rawmaterial(){ return wrap.querySelector('[data-k="rawmaterial"]').value; },
    get qtykg(){ return wrap.querySelector('[data-k="qtykg"]').value; },
    get date(){ return wrap.querySelector('[data-k="date"]').value; },
    get notes(){ return wrap.querySelector('[data-k="notes"]').value; },
    get file(){ return wrap.querySelector('[data-k="image"]').files?.[0]; },
  };

  wrap.querySelector('[data-k="remove"]').addEventListener("click", () => {
    state.groups = state.groups.filter(g => g !== group);
    wrap.remove();
  });

  return group;
}

function addGroup() {
  const g = makeGroup();
  state.groups.push(g);
  el.mariagesContainer.appendChild(g.root);
}

async function saveAll() {
  const payloads = [];
  const topDesignCode = ImageService.arabicToEnglishDigits(document.getElementById("designCode")?.value || "").trim();
  const topScreensCountStr = ImageService.onlyDigits(document.getElementById("screensCount")?.value || "");
  if (!topDesignCode) { alert("يرجى إدخال رقم الرسمة."); return; }
  const topScreensCount = topScreensCountStr ? Number(topScreensCountStr) : null;
  for (const g of state.groups) {
    const designcode = topDesignCode;
    const mariage = ImageService.onlyDigits(g.mariagenumber);
    if (!designcode || !mariage) {
      alert("يرجى إدخال رقم المرياج.");
      return;
    }
    const key = ImageService.buildImageKey(designcode, mariage);
    const path = ImageService.buildImagePath(designcode, mariage);

    let imageurl = null;
    let image_path = null;

    if (g.file) {
      const resized = await ImageService.resizeToJpegFile(g.file, 900, 0.86);
      await ImageService.uploadImageToPath(resized, path, true);
      imageurl = ImageService.getPublicUrl(path);
      image_path = path;
    } else {
      // If already exists, reuse
      try {
        if (await ImageService.storageExists(path)) {
          imageurl = ImageService.getPublicUrl(path);
          image_path = path;
        }
      } catch {}
    }

    payloads.push({
      designcode,
      screenscount: topScreensCount,
      mariagenumber: Number(mariage),
      printtype: g.printtype || "",
      groundprep: g.groundprep || "",
      rawmaterial: g.rawmaterial || "",
      qtykg: g.qtykg ? Number(g.qtykg) : null,
      date: g.date || todayISO(),
      status: "لم يتم التشكيل",
      notes: g.notes || "",
      image_key: key,
      image_path,
      imageurl
    });
  }

  if (!payloads.length) return;

  const { error } = await sb.from(CFG.TABLE_NAME).insert(payloads);
  if (error) {
    console.error(error);
    alert("فشل الحفظ: " + (error.message || error));
    return;
  }

  el.mariagesContainer.innerHTML = "";
  state.groups = [];
  addGroup();
  await refreshTable();
}

async function refreshTable() {
  const { data, error } = await CrudService.loadPrintedTable();
  if (error) {
    console.error(error);
    alert("تعذر تحميل البيانات.");
    return;
  }
  const rows = [];
  for (const r of (data || [])) rows.push(await CrudService.bestEffortBackfillImageKey(r));
  state.rows = rows;
  render();
}

function render() {
  const filtered = applyFiltersAndSort(state.rows, { statusFilter: el.statusFilter, sortField: el.sortField, searchInput: el.searchInput });
  renderPrintedTable(filtered, el.tbody, el.totalsInfo);
}

const editModal = initEditModal();
const dupModal = initDuplicateModal();


// Image viewer modal (click on thumbnail)
const imageModal = document.getElementById("imageModal");
const imageModalImg = document.getElementById("imageModalImg");
function openImageModal(url){
  if (!imageModal || !imageModalImg) return;
  imageModalImg.src = url;
  imageModal.style.display = "flex";
  imageModal.setAttribute("aria-hidden","false");
}
function closeImageModal(){
  if (!imageModal) return;
  imageModal.style.display = "none";
  imageModal.setAttribute("aria-hidden","true");
  if (imageModalImg) imageModalImg.src = "";
}
imageModal?.addEventListener("click", (e) => { if (e.target === imageModal) closeImageModal(); });
    document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closeImageModal(); });

// Delegate click on thumbnails inside table
el.tbody?.addEventListener("click", (e) => {
  const img = e.target.closest?.("img.printed-table-img");
  if (!img) return;
  const url = img.getAttribute("src");
  if (url) openImageModal(url);
});

wireTableActions(el.tbody, async (action, id) => {
  const row = state.rows.find(r => String(r.id) === String(id));
  if (!row) return;
  if (action === "edit") return editModal.open(row, { onSaved: refreshTable });
  if (action === "duplicate") return dupModal.open(row, { onSaved: refreshTable });
  if (action === "delete") {
    if (!confirm("هل أنت متأكد من حذف الطلب؟")) return;
    try {
      await CrudService.deleteRow(row);
      await refreshTable();
    } catch (e) {
      console.error(e);
      alert("فشل الحذف.");
    }
  }
});

el.addMariageBtn?.addEventListener("click", addGroup);
el.saveAllBtn?.addEventListener("click", () => saveAll().catch(console.error));
el.statusFilter?.addEventListener("change", render);
el.sortField?.addEventListener("change", render);
el.searchInput?.addEventListener("input", render);

// Start
addGroup();
refreshTable();