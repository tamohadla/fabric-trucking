/************ دوال مساعدة عامة ************/

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// تحويل الأرقام العربية-الهندية إلى أرقام عادية
function normalizeArabicDigits(str) {
  if (!str) return str;
  const map = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
  };
  return String(str).replace(/[٠-٩]/g, ch => map[ch] ?? ch);
}

function setupDigitNormalization() {
  const inputs = document.querySelectorAll(".normalize-digits");
  inputs.forEach(input => {
    if (input.dataset.digitNormalized === "1") return;
    input.dataset.digitNormalized = "1";
    input.addEventListener("input", () => {
      const current = input.value;
      const normalized = normalizeArabicDigits(current);
      if (normalized !== current) {
        const pos = input.selectionStart;
        input.value = normalized;
        try { input.setSelectionRange(pos, pos); } catch (e) {}
      }
    });
  });
}

/************ ربط عناصر الصفحة ************/

// نموذج الإدخال الأساسي
const solidColorText = document.getElementById("solidColorText");
const solidColorCode = document.getElementById("solidColorCode");
const solidForWhom   = document.getElementById("solidForWhom");
const solidPattern   = document.getElementById("solidPattern");
const solidQuality   = document.getElementById("solidQuality");
const solidStatus    = document.getElementById("solidStatus");
const solidDate      = document.getElementById("solidDate");
const solidQtyKg     = document.getElementById("solidQtyKg");
const solidSaveBtn   = document.getElementById("solidSaveBtn");
const solidMsg       = document.getElementById("solidMsg");

// جداول
const labTableBody       = document.getElementById("labTableBody");
const labTotals          = document.getElementById("labTotals");
const solidMainTableBody = document.getElementById("solidMainTableBody");
const solidTotals        = document.getElementById("solidTotals");

// فلاتر
const filterStatusSelect = document.getElementById("filterStatus");
const filterClient       = document.getElementById("filterClient");
const filterQualityInp   = document.getElementById("filterQuality");
const filterDateFrom     = document.getElementById("filterDateFrom");
const filterDateTo       = document.getElementById("filterDateTo");
const clearFiltersBtn    = document.getElementById("clearFiltersBtn");

// Modal عناصر
const modalColorText  = document.getElementById("modalColorText");
const modalColorCode  = document.getElementById("modalColorCode");
const modalForWhom    = document.getElementById("modalForWhom");
const modalPattern    = document.getElementById("modalPattern");
const modalQuality    = document.getElementById("modalQuality");
const modalStatus     = document.getElementById("modalStatus");
const modalDate       = document.getElementById("modalDate");
const modalQtyKg      = document.getElementById("modalQtyKg");
const modalSaveBtn    = document.getElementById("modalSaveBtn");
const modalMsg        = document.getElementById("modalMsg");

// اقتراحات الخامة
const qualitySuggestions      = document.getElementById("qualitySuggestions");
const modalQualitySuggestions = document.getElementById("modalQualitySuggestions");

/************ متغيّرات حالة ************/

let solidOrders = [];      // كل الطلبات من Firestore
let editOrderId = null;    // ID الطلب الذي نعدّله حالياً (في الـ Modal)

let filterStatusVal   = "";
let filterClientText  = "";
let filterQualityText = "";
let filterDateFromVal = "";
let filterDateToVal   = "";

// تعبئة التاريخ افتراضياً في نموذج الإدخال
if (solidDate) {
  solidDate.value = todayISO();
}

/************ دوال للنموذج الأساسي (إضافة طلب جديد) ************/

function clearSolidForm() {
  solidColorText.value = "";
  solidColorCode.value = "";
  solidForWhom.value   = "";
  solidPattern.value   = "";
  solidQuality.value   = "";
  solidStatus.value    = "";
  solidDate.value      = todayISO();
  solidQtyKg.value     = "";
}

async function saveSolidOrder() {
  // تحويل الأرقام قبل القراءة
  solidColorCode.value = normalizeArabicDigits(solidColorCode.value);
  solidQtyKg.value     = normalizeArabicDigits(solidQtyKg.value);

  const qtyStr = solidQtyKg.value.trim();
  const qtyKg  = qtyStr ? Number(qtyStr) : null;

  const data = {
    colorText: solidColorText.value.trim(),
    colorCode: solidColorCode.value.trim(),
    forWhom  : solidForWhom.value.trim(),
    pattern  : solidPattern.value.trim(),
    quality  : solidQuality.value.trim(),
    status   : solidStatus.value,
    date     : solidDate.value,
    qtyKg    : qtyKg,
    receivedAt: null
  };

  if (!data.colorText ||
      !data.forWhom ||
      !data.status ||
      !data.date ||
      data.qtyKg === null) {

    solidMsg.textContent = "من فضلك املأ جميع الحقول الأساسية (اللون، لصالح مين، حالة الطلب، التاريخ، الكمية).";
    solidMsg.style.color = "red";
    return;
  }

  try {
    const newData = {
      ...data,
      createdAt: FieldValue.serverTimestamp()
    };
    await db.collection("solid_orders").add(newData);
    solidMsg.textContent = "تم حفظ طلب السادة بنجاح ✅";
    solidMsg.style.color = "green";
    clearSolidForm();
    setTimeout(() => { solidMsg.textContent = ""; }, 2000);
  } catch (err) {
    console.error(err);
    solidMsg.textContent = "حدث خطأ أثناء الحفظ، تأكد من اتصال الإنترنت أو من صلاحيات Firestore.";
    solidMsg.style.color = "red";
  }
}

if (solidSaveBtn) {
  solidSaveBtn.addEventListener("click", saveSolidOrder);
}

/************ فلترة الجداول ************/

if (filterStatusSelect) {
  filterStatusSelect.addEventListener("change", () => {
    filterStatusVal = filterStatusSelect.value;
    renderTables();
  });
}

if (filterClient) {
  filterClient.addEventListener("input", () => {
    filterClientText = filterClient.value.trim().toLowerCase();
    renderTables();
  });
}

if (filterQualityInp) {
  filterQualityInp.addEventListener("input", () => {
    filterQualityText = filterQualityInp.value.trim().toLowerCase();
    renderTables();
  });
}

if (filterDateFrom) {
  filterDateFrom.addEventListener("change", () => {
    filterDateFromVal = filterDateFrom.value;
    renderTables();
  });
}

if (filterDateTo) {
  filterDateTo.addEventListener("change", () => {
    filterDateToVal = filterDateTo.value;
    renderTables();
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    filterStatusSelect.value = "";
    filterClient.value       = "";
    filterQualityInp.value   = "";
    filterDateFrom.value     = "";
    filterDateTo.value       = "";

    filterStatusVal   = "";
    filterClientText  = "";
    filterQualityText = "";
    filterDateFromVal = "";
    filterDateToVal   = "";
    renderTables();
  });
}

/************ اقتراحات الخامة (من الطلبات الموجودة) ************/

function updateQualitySuggestionsList() {
  const set = new Set();
  solidOrders.forEach(o => {
    if (o.data && o.data.quality) set.add(o.data.quality);
  });
  const html = Array.from(set).map(q =>
    `<div class="quality-option" data-val="${q}">${q}</div>`
  ).join("");

  if (qualitySuggestions) {
    qualitySuggestions.innerHTML = html;
  }
  if (modalQualitySuggestions) {
    modalQualitySuggestions.innerHTML = html;
  }
}

// تفعيل الاقتراحات في حقل الخامة (النموذج الأساسي)
if (solidQuality && qualitySuggestions) {
  solidQuality.addEventListener("input", () => {
    const val = solidQuality.value.trim().toLowerCase();
    const options = qualitySuggestions.querySelectorAll(".quality-option");
    let anyVisible = false;
    options.forEach(opt => {
      const txt = opt.dataset.val.toLowerCase();
      const show = !val || txt.includes(val);
      opt.style.display = show ? "block" : "none";
      if (show) anyVisible = true;
    });
    if (anyVisible) qualitySuggestions.classList.remove("hidden");
    else qualitySuggestions.classList.add("hidden");
  });

  qualitySuggestions.addEventListener("click", (e) => {
    const opt = e.target.closest(".quality-option");
    if (!opt) return;
    solidQuality.value = opt.dataset.val;
    qualitySuggestions.classList.add("hidden");
  });
}

// اقتراحات الخامة داخل الـ Modal
if (modalQuality && modalQualitySuggestions) {
  modalQuality.addEventListener("input", () => {
    const val = modalQuality.value.trim().toLowerCase();
    const options = modalQualitySuggestions.querySelectorAll(".quality-option");
    let anyVisible = false;
    options.forEach(opt => {
      const txt = opt.dataset.val.toLowerCase();
      const show = !val || txt.includes(val);
      opt.style.display = show ? "block" : "none";
      if (show) anyVisible = true;
    });
    if (anyVisible) modalQualitySuggestions.classList.remove("hidden");
    else modalQualitySuggestions.classList.add("hidden");
  });

  modalQualitySuggestions.addEventListener("click", (e) => {
    const opt = e.target.closest(".quality-option");
    if (!opt) return;
    modalQuality.value = opt.dataset.val;
    modalQualitySuggestions.classList.add("hidden");
  });
}

// إخفاء الاقتراحات عند الضغط خارجها
document.addEventListener("click", (e) => {
  if (qualitySuggestions &&
      !qualitySuggestions.contains(e.target) &&
      e.target !== solidQuality) {
    qualitySuggestions.classList.add("hidden");
  }
  if (modalQualitySuggestions &&
      !modalQualitySuggestions.contains(e.target) &&
      e.target !== modalQuality) {
    modalQualitySuggestions.classList.add("hidden");
  }
});

/************ عرض الجداول ************/

function renderTables() {
  // تقسيم الطلبات
  const labOrders = solidOrders.filter(o =>
    o.data && o.data.status === "تم طلب المخبريات"
  );

  const mainOrders = solidOrders.filter(o =>
    o.data &&
    (o.data.status === "تم التشكيل" ||
     o.data.status === "لم يتم التشكيل" ||
     o.data.status === "تم الاستلام")
  );

  /***** جدول المخبريات *****/
  labTableBody.innerHTML = "";
  let labCount = 0;
  let labTotal = 0;
  labOrders.forEach((o, i) => {
    const d = o.data;
    labCount++;
    if (d.qtyKg) labTotal += Number(d.qtyKg);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="#">${i + 1}</td>
      <td class="wrap-cell" data-label="اللون">${d.colorText || "—"}</td>
      <td data-label="كود اللون">${d.colorCode || "—"}</td>
      
      <td class="wrap-cell" data-label="الخامة">${d.quality || "—"}</td>
      <td data-label="الكمية (كغ)">${d.qtyKg ?? "—"}</td>
      <td data-label="تاريخ الطلب">${d.date || "—"}</td>
      <td class="wrap-cell" data-label="لصالح مين">${d.forWhom || "—"}</td>
      <td data-label="الحالة">
        <span class="status-pill status-lab">تم طلب المخبريات</span>
      </td>
      <td class="actions-cell" data-label="إجراءات">
        <button class="small-btn lab-move" data-id="${o.id}" data-action="lab-to-printed">تشكيل</button>
        <button class="small-btn edit" data-id="${o.id}" data-action="edit">تعديل</button>
        <button class="small-btn delete" data-id="${o.id}" data-action="delete">حذف</button>
      </td>
    `;
    labTableBody.appendChild(tr);
  });
  labTotals.textContent = `عدد المخبريات: ${labCount} | إجمالي الكمية: ${labTotal || 0} كغ`;

  /***** جدول التشكيلات *****/
  let rows = mainOrders.slice();

  // فلترة حسب حالة الطلب (Dropdown)
  if (filterStatusVal) {
    rows = rows.filter(o => o.data.status === filterStatusVal);
  }

  // فلترة إضافية
  if (filterClientText) {
  rows = rows.filter(o => {
    const d = o.data || {};

    // نجمع الحقول المطلوب البحث فيها: اسم العميل + اسم اللون + كود اللون
    const haystackRaw = [
      d.forWhom ?? "",
      d.colorText ?? "",
      d.colorCode ?? ""
    ].join(" ").toLowerCase();

    // نطبع الأرقام داخل الداتا أيضاً (لدعم بيانات قديمة ممكن تكون بأرقام عربية-هندية)
    const haystack = normalizeArabicDigits(haystackRaw);

    return haystack.includes(filterClientText);
  });
}

  if (filterQualityText) {
    rows = rows.filter(o => (o.data.quality || "").toLowerCase().includes(filterQualityText));
  }

  if (filterDateFromVal) {
    rows = rows.filter(o => (o.data.date || "") >= filterDateFromVal);
  }
  if (filterDateToVal) {
    rows = rows.filter(o => (o.data.date || "") <= filterDateToVal);
  }

  solidMainTableBody.innerHTML = "";
  let totalCount = 0;
  let totalQty   = 0;

  // ترتيب حسب التاريخ ثم اسم اللون (الأحدث أولاً)
  rows.sort((a, b) => {
    const da = a.data.date || "";
    const db = b.data.date || "";
    const cmp = db.localeCompare(da);
    if (cmp !== 0) return cmp;
    return (a.data.colorText || "").localeCompare(b.data.colorText || "");
  });

  rows.forEach((o, index) => {
    const d = o.data;
    totalCount++;
    if (d.qtyKg) totalQty += Number(d.qtyKg);

    // تطبيع حالة الطلب مع دعم البيانات القديمة:
    // إذا كان هناك receivedAt نعتبره "تم الاستلام" حتى لو كان status ما زال "تم التشكيل"
    const rawStatus = (d.status || "").trim();
    const hasReceivedFlag = !!d.receivedAt;

    let normalizedStatus = rawStatus;
    if (hasReceivedFlag && rawStatus !== "تم الاستلام") {
      // طلب قديم: تم استلامه فعليًا لكن status لم يتحدث
      normalizedStatus = "تم الاستلام";
    }

    // اختيار لون الشارة حسب الحالة الموحّدة
    let statusClass = "status-pending"; // افتراضي = لم يتم التشكيل
    if (normalizedStatus === "تم التشكيل") {
      statusClass = "status-printed";
    } else if (normalizedStatus === "تم الاستلام") {
      statusClass = "status-received";
    }

    // بناء خلية الحالة + تاريخ الاستلام (إذا متوفر)
    let statusCellHtml = `
      <span class="status-pill ${statusClass}">${normalizedStatus || "—"}</span>
    `;
    if (hasReceivedFlag) {
      statusCellHtml += `<div class="received-date">${d.receivedAt}</div>`;
    }

    // أزرار الإجراءات (باستخدام الحالة الموحّدة normalizedStatus)
    let actionsHtml = `
      <button class="small-btn edit" data-id="${o.id}" data-action="edit">تعديل</button>
      <button class="small-btn delete" data-id="${o.id}" data-action="delete">حذف</button>
    `;

    if (normalizedStatus === "لم يتم التشكيل") {
      // لم يتم التشكيل → زر "تم التشكيل"
      actionsHtml =
        `<button class="small-btn mark-printed" data-id="${o.id}" data-action="mark-printed">تم التشكيل</button>` +
        actionsHtml;

    } else if (normalizedStatus === "تم التشكيل") {
      // تم التشكيل ولم يُستلم بعد → زر "تم الاستلام"
      actionsHtml =
        `<button class="small-btn mark-received" data-id="${o.id}" data-action="mark-received">تم الاستلام</button>` +
        actionsHtml;

    } else if (normalizedStatus === "تم الاستلام") {
      // تم الاستلام (سواء قديم أو جديد) → زر "إلغاء الاستلام"
      actionsHtml =
        `<button class="small-btn unreceive" data-id="${o.id}" data-action="unreceive">إلغاء الاستلام</button>` +
        actionsHtml;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="#">${index + 1}</td>
      <td class="wrap-cell" data-label="اللون">${d.colorText || "—"}</td>
      <td data-label="كود اللون">${d.colorCode || "—"}</td>
      
      <td class="pattern-cell" data-label="الرسمة">${d.pattern || "—"}</td>
      <td class="wrap-cell" data-label="الخامة">${d.quality || "—"}</td>
      <td data-label="الكمية (كغ)">${d.qtyKg ?? "—"}</td>
      <td data-label="تاريخ الطلب">${d.date || "—"}</td>
      <td class="wrap-cell" data-label="لصالح مين">${d.forWhom || "—"}</td>
      <td data-label="حالة الطلب / الاستلام">
        ${statusCellHtml}
      </td>
      <td class="actions-cell" data-label="إجراءات">
        ${actionsHtml}
      </td>
    `;
    solidMainTableBody.appendChild(tr);
  });

  solidTotals.textContent = `عدد الطلبات: ${totalCount} | إجمالي الكمية: ${totalQty || 0} كغ`;

  // تحديث قائمة الخامات للاقتراحات
  updateQualitySuggestionsList();
}

/************ إجراءات على الطلبات (حذف / تغيير حالة / تعديل) ************/

async function deleteOrder(id) {
  const ok = confirm("هل تريد حذف هذا الطلب نهائياً؟");
  if (!ok) return;
  try {
    await db.collection("solid_orders").doc(id).delete();
  } catch (err) {
    console.error(err);
    alert("لم يتم الحذف، تأكد من اتصال الإنترنت أو من صلاحيات Firestore.");
  }
}

async function markPrinted(id) {
  const today = todayISO();
  try {
    await db.collection("solid_orders").doc(id).update({
      status: "تم التشكيل",
      date: today
    });
  } catch (err) {
    console.error(err);
    alert("لم يتم تغيير الحالة إلى تم التشكيل، تأكد من الاتصال أو من صلاحيات Firestore.");
  }
}

async function markReceived(id) {
  const now = new Date().toISOString().split("T")[0];
  try {
    await db.collection("solid_orders").doc(id).update({
      status: "تم الاستلام",
      receivedAt: now
    });
  } catch (err) {
    console.error(err);
    alert("لم يتم وضع تم الاستلام، تأكد من الاتصال أو من صلاحيات Firestore.");
  }
}

async function unreceiveOrder(id) {
  const ok = confirm("هل تريد إلغاء الاستلام لهذا الطلب؟");
  if (!ok) return;
  try {
    await db.collection("solid_orders").doc(id).update({
      status: "تم التشكيل",
      receivedAt: null
    });
  } catch (err) {
    console.error(err);
    alert("لم يتم إلغاء الاستلام، تأكد من الاتصال أو من صلاحيات Firestore.");
  }
}

async function moveLabToPrinted(id) {
  const ok = confirm("سيتم نقل هذا الطلب من جدول المخبريات إلى جدول التشكيلات (تم التشكيل). هل أنت متأكد؟");
  if (!ok) return;
  const today = todayISO();
  try {
    await db.collection("solid_orders").doc(id).update({
      status: "تم التشكيل",
      date: today
    });
  } catch (err) {
    console.error(err);
    alert("لم يتم نقل الطلب للتشكيلات، تأكد من الاتصال أو من صلاحيات Firestore.");
  }
}

/************ فتح الـ Modal للتعديل ************/

function fillModalWithOrder(orderObj) {
  const d = orderObj.data;
  modalColorText.value = d.colorText || "";
  modalColorCode.value = d.colorCode || "";
  modalForWhom.value   = d.forWhom || "";
  modalPattern.value   = d.pattern || "";
  modalQuality.value   = d.quality || "";
  modalStatus.value    = d.status || "";
  modalDate.value      = d.date || todayISO();
  modalQtyKg.value     = d.qtyKg ?? "";
  modalMsg.textContent = "";
  modalMsg.style.color = "";
}

function openEditModal(id) {
  const orderObj = solidOrders.find(o => o.id === id);
  if (!orderObj) return;

  editOrderId = id;
  fillModalWithOrder(orderObj);

  // محاولة فتح الموديل عبر الكائن Modal
  try {
    if (window.Modal && typeof Modal.open === "function") {
      Modal.open();
    } else {
      // في حال لأي سبب Modal غير متاح، نفتح الموديل يدويًا
      const overlay = document.getElementById("editModal");
      if (overlay) {
        overlay.classList.remove("hidden");
      }
    }
  } catch (e) {
    console.error("Error opening modal:", e);
    // فتح يدوي كـ fallback
    const overlay = document.getElementById("editModal");
    if (overlay) {
      overlay.classList.remove("hidden");
    }
  }
}

/************ حفظ التعديل من الـ Modal ************/

async function saveModalEdit() {
  if (!editOrderId) return;

  // الاحتفاظ بالقيم القديمة الخاصة بـ createdAt و receivedAt
  const existingObj = solidOrders.find(o => o.id === editOrderId);
  let existingReceivedAt = null;
  let existingCreatedAt  = null;
  if (existingObj && existingObj.data) {
    if (existingObj.data.receivedAt) existingReceivedAt = existingObj.data.receivedAt;
    if (existingObj.data.createdAt)  existingCreatedAt  = existingObj.data.createdAt;
  }

  // تحويل الأرقام
  modalColorCode.value = normalizeArabicDigits(modalColorCode.value);
  modalQtyKg.value     = normalizeArabicDigits(modalQtyKg.value);

  const qtyStr = modalQtyKg.value.trim();
  const qtyKg  = qtyStr ? Number(qtyStr) : null;

  const data = {
    colorText: modalColorText.value.trim(),
    colorCode: modalColorCode.value.trim(),
    forWhom  : modalForWhom.value.trim(),
    pattern  : modalPattern.value.trim(),
    quality  : modalQuality.value.trim(),
    status   : modalStatus.value,
    date     : modalDate.value,
    qtyKg    : qtyKg,
    receivedAt: existingReceivedAt || null
  };

  if (!data.colorText ||
      !data.forWhom ||
      !data.status ||
      !data.date ||
      data.qtyKg === null) {

    modalMsg.textContent = "يرجى ملء الحقول الأساسية (اللون، لصالح مين، حالة الطلب، التاريخ، الكمية).";
    modalMsg.style.color = "red";
    return;
  }

  try {
    const updateData = { ...data };
    if (existingCreatedAt) {
      updateData.createdAt = existingCreatedAt;
    }
    await db.collection("solid_orders").doc(editOrderId).update(updateData);
    modalMsg.textContent = "تم حفظ التعديلات بنجاح ✅";
    modalMsg.style.color = "green";
    setTimeout(() => {
      Modal.close();
      editOrderId = null;
    }, 400);
  } catch (err) {
    console.error(err);
    modalMsg.textContent = "حدث خطأ أثناء حفظ التعديلات، تأكد من الاتصال أو من صلاحيات Firestore.";
    modalMsg.style.color = "red";
  }
}

if (modalSaveBtn) {
  modalSaveBtn.addEventListener("click", saveModalEdit);
}

/************ أحداث الأزرار داخل الجداول ************/

// جدول المخبريات
if (labTableBody) {
  labTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".small-btn");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (!id || !action) return;

    if (action === "delete") {
      deleteOrder(id);
    } else if (action === "lab-to-printed") {
      moveLabToPrinted(id);
    } else if (action === "edit") {
      openEditModal(id);
    }
  });
}

// جدول التشكيلات
if (solidMainTableBody) {
  solidMainTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".small-btn");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (!id || !action) return;

    if (action === "delete") {
      deleteOrder(id);
    } else if (action === "mark-printed") {
      markPrinted(id);
    } else if (action === "mark-received") {
      markReceived(id);
    } else if (action === "unreceive") {
      unreceiveOrder(id);
    } else if (action === "edit") {
      openEditModal(id);
    }
  });
}

/************ الاستماع للتغييرات من Firestore ************/

db.collection("solid_orders")
  .orderBy("createdAt", "asc")
  .onSnapshot((snapshot) => {
    solidOrders = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    renderTables();
    setupDigitNormalization();
  }, (error) => {
    console.error("Firestore listen error:", error);
    solidMsg.textContent = "مشكلة في الاتصال بقاعدة البيانات (الصلاحيات أو الإنترنت).";
    solidMsg.style.color = "red";
  });

// تفعيل تحويل الأرقام الهندية → عربية لأول مرة
setupDigitNormalization();


/************ تصدير الجداول (صورة / PDF) ************/

async function captureTableCanvas(captureId) {
  const el = document.getElementById(captureId);
  if (!el) throw new Error("عنصر التصدير غير موجود: " + captureId);

  // نسخ العنصر حتى نلتقط الجدول كامل العرض (بدون قص بسبب scroll)
  const clone = el.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.background = "#ffffff";
  clone.style.padding = "16px";
  clone.style.borderRadius = "12px";

  document.body.appendChild(clone);

  // ضبط الـ scroll ليصبح مرئياً بالكامل داخل النسخة
  const scrollDiv = clone.querySelector(".table-scroll");
  if (scrollDiv) {
    scrollDiv.style.overflow = "visible";
    // مهم: بعد الإضافة للـ DOM يصبح scrollWidth متاحاً
    const fullW = scrollDiv.scrollWidth || scrollDiv.offsetWidth;
    scrollDiv.style.width = fullW + "px";
  }

  const canvas = await html2canvas(clone, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true
  });

  document.body.removeChild(clone);
  return canvas;
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function buildExportName(prefix) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${prefix}_${yyyy}-${mm}-${dd}_${hh}${mi}`;
}

async function exportCaptureAsPng(captureId, prefix) {
  try {
    const canvas = await captureTableCanvas(captureId);
    const dataUrl = canvas.toDataURL("image/png");
    downloadDataUrl(dataUrl, buildExportName(prefix) + ".png");
  } catch (e) {
    console.error(e);
    alert("تعذر تصدير الصورة. تأكد من الاتصال بالإنترنت (لتحميل مكتبات التصدير) ثم حاول مرة أخرى.");
  }
}

// تصدير صورة مع إخفاء آخر 3 أعمدة في الجدول داخل منطقة الالتقاط
async function exportCaptureAsPngHideLast3Cols(captureId, prefix) {
  const captureEl = document.getElementById(captureId);
  const tableEl = captureEl ? captureEl.querySelector("table") : null;

  try {
    if (!captureEl || !tableEl) {
      throw new Error("Capture element or table not found");
    }

    // إخفاء آخر 3 أعمدة مؤقتاً
    tableEl.classList.add("export-hide-last3");

    const canvas = await captureTableCanvas(captureId);
    const dataUrl = canvas.toDataURL("image/png");
    downloadDataUrl(dataUrl, buildExportName(prefix) + ".png");
  } catch (e) {
    console.error(e);
    alert("تعذر تصدير الصورة. تأكد من الاتصال بالإنترنت (لتحميل مكتبات التصدير) ثم حاول مرة أخرى.");
  } finally {
    // إعادة إظهار الأعمدة مهما حصل
    if (tableEl) tableEl.classList.remove("export-hide-last3");
  }
}

async function exportCaptureAsPdf(captureId, prefix) {
  try {
    const canvas = await captureTableCanvas(captureId);
    const imgData = canvas.toDataURL("image/png");

    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("jsPDF not loaded");
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;

    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = margin;

    // إذا الصورة أطول من صفحة واحدة: نقسمها صفحات
    let remainingH = imgH;
    let offsetY = 0;

    while (remainingH > 0) {
      pdf.addImage(imgData, "PNG", margin, y - offsetY, imgW, imgH, undefined, "FAST");

      remainingH -= (pageH - margin * 2);
      offsetY += (pageH - margin * 2);

      if (remainingH > 0) {
        pdf.addPage();
      }
    }

    pdf.save(buildExportName(prefix) + ".pdf");
  } catch (e) {
    console.error(e);
    alert("تعذر تصدير PDF. تأكد من الاتصال بالإنترنت (لتحميل مكتبات التصدير) ثم حاول مرة أخرى.");
  }
}

function setupExportButtons() {
  const labPng = document.getElementById("exportLabPng");
  const labPdf = document.getElementById("exportLabPdf");
  const mainPng = document.getElementById("exportMainPng");
  const mainPngHide3 = document.getElementById("exportMainPngHide3");
  const mainPdf = document.getElementById("exportMainPdf");

  if (labPng) labPng.addEventListener("click", () => exportCaptureAsPng("labTableCapture", "lab_table"));
  if (labPdf) labPdf.addEventListener("click", () => exportCaptureAsPdf("labTableCapture", "lab_table"));
  if (mainPng) mainPng.addEventListener("click", () => exportCaptureAsPng("mainTableCapture", "production_table"));
  if (mainPngHide3) mainPngHide3.addEventListener("click", () => exportCaptureAsPngHideLast3Cols("mainTableCapture", "production_table"));
  if (mainPdf) mainPdf.addEventListener("click", () => exportCaptureAsPdf("mainTableCapture", "production_table"));
}

// تفعيل أزرار التصدير
setupExportButtons();

