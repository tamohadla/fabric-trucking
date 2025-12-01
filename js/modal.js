// كائن للتحكم بالمودال Edit Modal
window.Modal = {
  overlay: null,

  init() {
    this.overlay = document.getElementById("editModal");

    // زر ×
    const closeBtn = document.getElementById("modalCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    // زر إلغاء
    const cancelBtn = document.getElementById("modalCancelBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.close());
    }

    // الإغلاق عند الضغط خارج الصندوق
    if (this.overlay) {
      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }
  },

  open() {
    if (!this.overlay) return;
    this.overlay.classList.remove("hidden");
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.add("hidden");
  }
};

// تهيئة المودال عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  if (window.Modal) {
    window.Modal.init();
  }
});
