// ===== Supabase config (replace with your real values) =====
const SUPABASE_URL = "https://umrczwoxjhxwvrezocrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcmN6d294amh4d3ZyZXpvY3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODA0MTUsImV4cCI6MjA3OTU1NjQxNX0.88PDM2h93rhGhOxVRDa5q3rismemqJJEpmBdwWmfgVQ";

const STORAGE_BUCKET = "artworks"; // change to your bucket name



const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_STATUS = "لم يتم الاستلام بعد";
const DONE_STATUS = "تم الاستلام";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const printHouseId = params.get("id");

  if (!printHouseId) {
    alert("لا يوجد معرّف مصبغة في الرابط.");
    window.location.href = "index.html";
    return;
  }

  // عناصر الصفحة
  const titleEl = document.getElementById("print-house-name");
  const imageFileInput = document.getElementById("design_image_file");
  const imagePreview = document.getElementById("image-preview");
  const sentDateInput = document.getElementById("sent_date");
  const saveBtn = document.getElementById("save-request-btn");
  const statusEl = document.getElementById("save-status");
  const requestsContainer = document.getElementById("requests-container");
  const statusFilter = document.getElementById("status-filter");
  const searchInput = document.getElementById("search-input");
  const imageModal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");

  let allRequests = [];
  let editingId = null;

  // تاريخ افتراضي = اليوم
  if (sentDateInput) {
    const today = new Date().toISOString().slice(0, 10);
    sentDateInput.value = today;
  }

  // معاينة الصورة قبل الرفع
  if (imageFileInput && imagePreview) {
    imageFileInput.addEventListener("change", () => {
      const file = imageFileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.src = "";
        imagePreview.style.display = "none";
      }
    });
  }

  // إغلاق مودال الصورة
  imageModal.addEventListener("click", () => {
    imageModal.style.display = "none";
    modalImage.src = "";
  });

  // زر حفظ الطلب
  saveBtn.addEventListener("click", async () => {
    clearStatus();

    if (!navigator.onLine) {
      showStatus("لا يوجد اتصال بالانترنت", "error");
      return;
    }

    const isEditing = !!editingId;

    const designName = document.getElementById("design_name").value.trim();
    const fabricType = document.getElementById("fabric_type").value.trim();
    const forCustomer = document.getElementById("for_customer").value.trim();
    const printType = document.getElementById("print_type").value.trim();
    const notes = document.getElementById("notes").value.trim();
    const sentDate = sentDateInput.value || null;

    // الحقول الأساسية
    const payload = {
      print_house_id: Number(printHouseId),
      design_name: designName || null,
      fabric_type: fabricType || null,
      for_customer: forCustomer || null,
      print_type: printType || null,
      notes: notes || null,
      sent_date: sentDate
    };

    // في حالة إضافة جديدة نضع الحالة الافتراضية
    if (!isEditing) {
      payload.status = DEFAULT_STATUS;
    }

    try {
      // رفع الصورة إن وجدت
      const file = imageFileInput.files[0];
      if (file) {
        const resizedBlob = await resizeImageToMax(file, 900);
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}_${printHouseId}.${ext}`;
        const filePath = `artworks/${fileName}`;

        const { error: uploadError } = await client.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, resizedBlob, { upsert: true });

        if (uploadError) {
          console.error(uploadError);
          showStatus("خطأ في رفع الصورة", "error");
          return;
        }

        const { data: publicUrlData } = client.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        payload.design_image_url = publicUrlData.publicUrl;
        payload.design_image_path = filePath;
      }

      let error;
      if (isEditing) {
        // تحديث الطلب
        const { error: updError } = await client
          .from("artworks_studio")
          .update(payload)
          .eq("id", editingId);
        error = updError;
      } else {
        // إضافة طلب جديد
        const { error: insError } = await client
          .from("artworks_studio")
          .insert(payload);
        error = insError;
      }

      if (error) {
        console.error(error);
        showStatus("حدث خطأ في حفظ الطلب (قاعدة البيانات)", "error");
        return;
      }

      showStatus("تم حفظ الطلب", "ok");
      resetForm();
      await loadRequests();
    } catch (e) {
      console.error(e);
      showStatus("حدث خطأ غير متوقع", "error");
    }
  });

  // تغيير الفلاتر
  statusFilter.addEventListener("change", () => renderRequests());
  searchInput.addEventListener("input", () => renderRequests());

  // دوال مساعدة للرسالة تحت زر الحفظ
  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "status-message " + (type || "info");
  }

  function clearStatus() {
    statusEl.textContent = "";
    statusEl.className = "status-message";
  }

  function resetForm() {
    editingId = null;
    document.getElementById("design_name").value = "";
    document.getElementById("fabric_type").value = "";
    document.getElementById("for_customer").value = "";
    document.getElementById("print_type").value = "";
    document.getElementById("notes").value = "";
    if (sentDateInput) {
      sentDateInput.value = new Date().toISOString().slice(0, 10);
    }
    imageFileInput.value = "";
    imagePreview.src = "";
    imagePreview.style.display = "none";
  }

  // تصغير الصورة لأقصى بُعد = maxSize (مثلاً 900px)
  function resizeImageToMax(file, maxSize) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width <= maxSize && height <= maxSize) {
            // لا حاجة للتصغير
            return resolve(file);
          }
          const canvas = document.createElement("canvas");
          if (width > height) {
            canvas.width = maxSize;
            canvas.height = Math.round((height * maxSize) / width);
          } else {
            canvas.height = maxSize;
            canvas.width = Math.round((width * maxSize) / height);
          }
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }
              resolve(blob);
            },
            "image/jpeg",
            0.9
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // تحميل اسم المطبعة
  async function loadPrintHouse() {
    const { data, error } = await client
      .from("print_houses")
      .select("*")
      .eq("id", printHouseId)
      .single();

    if (error) {
      console.error(error);
      return;
    }
    titleEl.textContent = data.name;
  }

  // تحميل الطلبات لهذه المطبعة
  async function loadRequests() {
    const { data, error } = await client
      .from("artworks_studio")
      .select("*")
      .eq("print_house_id", printHouseId)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    allRequests = data || [];
    renderRequests();
  }

  // رسم الكروت مع الفلترة والبحث
  function renderRequests() {
    requestsContainer.innerHTML = "";
    let items = [...allRequests];

    const statusVal = statusFilter.value;
    const searchVal = (searchInput.value || "").toLowerCase();

    // فلتر الحالة
    if (statusVal === "pending") {
      items = items.filter(r => r.status !== DONE_STATUS);
    } else if (statusVal === "done") {
      items = items.filter(r => r.status === DONE_STATUS);
    }

    // فلتر البحث
    if (searchVal) {
      items = items.filter(r =>
        (r.design_name || "").toLowerCase().includes(searchVal) ||
        (r.for_customer || "").toLowerCase().includes(searchVal)
      );
    }

    if (!items.length) {
      const empty = document.createElement("div");
      empty.textContent = "لا توجد طلبات حتى الآن.";
      empty.style.fontSize = "13px";
      empty.style.color = "#666";
      requestsContainer.appendChild(empty);
      return;
    }

    items.forEach(r => {
      const card = document.createElement("div");
      card.className = "request-card";

      // صورة الطلب (على اليمين في RTL)
      const img = document.createElement("img");
      img.className = "request-image";
      img.src = r.design_image_url || "";
      img.alt = r.design_name || "";
      img.addEventListener("click", () => {
        if (r.design_image_url) {
          modalImage.src = r.design_image_url;
          imageModal.style.display = "flex";
        }
      });

      // معلومات الطلب (على اليسار)
      const info = document.createElement("div");
      info.className = "request-info";

      // 1) اسم الرسمة
      const titleLine = document.createElement("div");
      titleLine.className = "request-line title-line";
      titleLine.textContent = r.design_name || "-";
      info.appendChild(titleLine);

      // 2) نوع القماش
      const fabricLine = document.createElement("div");
      fabricLine.className = "request-line";
      fabricLine.textContent = "نوع القماش: " + (r.fabric_type || "-");
      info.appendChild(fabricLine);

      // 3) العميل
      const customerLine = document.createElement("div");
      customerLine.className = "request-line";
      customerLine.textContent = "العميل: " + (r.for_customer || "-");
      info.appendChild(customerLine);

      // 4) نوع الطباعة
      const printLine = document.createElement("div");
      printLine.className = "request-line";
      printLine.textContent = "نوع الطباعة: " + (r.print_type || "-");
      info.appendChild(printLine);

      // 5) تاريخ الطلب
      const dateLine = document.createElement("div");
      dateLine.className = "request-line";
      dateLine.textContent = "تاريخ الطلب: " + (r.sent_date || "-");
      info.appendChild(dateLine);

      // 6) الملاحظات (إن وجدت)
      if (r.notes) {
        const notesLine = document.createElement("div");
        notesLine.className = "request-line";
        notesLine.textContent = "ملاحظات: " + r.notes;
        info.appendChild(notesLine);
      }

      // 7) حالة الطلب (آخر شيء قبل الأزرار)
      const statusSpan = document.createElement("span");
      const isDone = r.status === DONE_STATUS;
      statusSpan.className = "status-pill " + (isDone ? "status-done" : "status-pending");
      statusSpan.textContent = r.status || DEFAULT_STATUS;

      const statusContainer = document.createElement("div");
      statusContainer.className = "status-line";
      statusContainer.appendChild(statusSpan);
      info.appendChild(statusContainer);

      // 8) أزرار الإجراءات (سطر أفقي)
      const actionsRow = document.createElement("div");
      actionsRow.className = "request-actions-row";

      const editBtn = document.createElement("button");
      editBtn.textContent = "تعديل الطلب";
      editBtn.addEventListener("click", () => fillFormForEdit(r));

      const toggleBtn = document.createElement("button");
      const isDone2 = r.status === DONE_STATUS;
      toggleBtn.className = "btn-toggle" + (isDone2 ? " done" : "");
      toggleBtn.textContent = isDone2 ? "إلغاء الاستلام" : "تم الاستلام";
      toggleBtn.addEventListener("click", () => toggleStatus(r));

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "حذف الطلب";
      deleteBtn.addEventListener("click", () => deleteRequest(r));

      actionsRow.appendChild(editBtn);
      actionsRow.appendChild(toggleBtn);
      actionsRow.appendChild(deleteBtn);

      info.appendChild(actionsRow);

      // ترتيب محتويات الكرت: الصورة أولاً (يمين)، ثم المعلومات (يسار)
      card.appendChild(img);
      card.appendChild(info);

      requestsContainer.appendChild(card);
    });
  }

  // ملء الفورم عند تعديل طلب
  function fillFormForEdit(r) {
    editingId = r.id;
    document.getElementById("design_name").value = r.design_name || "";
    document.getElementById("fabric_type").value = r.fabric_type || "";
    document.getElementById("for_customer").value = r.for_customer || "";
    document.getElementById("print_type").value = r.print_type || "";
    document.getElementById("notes").value = r.notes || "";
    document.getElementById("sent_date").value =
      r.sent_date || new Date().toISOString().slice(0, 10);

    if (r.design_image_url) {
      imagePreview.src = r.design_image_url;
      imagePreview.style.display = "block";
    } else {
      imagePreview.src = "";
      imagePreview.style.display = "none";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // تغيير حالة الطلب (تم الاستلام / إلغاء الاستلام)
  async function toggleStatus(r) {
    if (!navigator.onLine) {
      alert("لا يوجد اتصال بالانترنت");
      return;
    }

    const newStatus = (r.status === DONE_STATUS) ? DEFAULT_STATUS : DONE_STATUS;
    const { error } = await client
      .from("artworks_studio")
      .update({ status: newStatus })
      .eq("id", r.id);

    if (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحديث حالة الطلب");
      return;
    }

    r.status = newStatus;
    const idx = allRequests.findIndex(x => x.id === r.id);
    if (idx >= 0) {
      allRequests[idx].status = newStatus;
    }
    renderRequests();
  }

  // حذف الطلب + محاولة حذف الصورة من الـ Storage
  async function deleteRequest(r) {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

    if (!navigator.onLine) {
      alert("لا يوجد اتصال بالانترنت");
      return;
    }

    try {
      // حذف الصورة من Storage إن وجد مسار
      if (r.design_image_path) {
        const { error: storageError } = await client.storage
          .from(STORAGE_BUCKET)
          .remove([r.design_image_path]);
        if (storageError) {
          console.error(storageError);
          alert("تم حذف الطلب لكن حدث خطأ في حذف الصورة من التخزين");
        }
      }

      const { error } = await client
        .from("artworks_studio")
        .delete()
        .eq("id", r.id);

      if (error) {
        console.error(error);
        alert("حدث خطأ أثناء حذف الطلب");
        return;
      }

      allRequests = allRequests.filter(x => x.id !== r.id);
      renderRequests();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ غير متوقع أثناء الحذف");
    }
  }

  // تحميل البيانات الأولية
  loadPrintHouse();
  loadRequests();
});
