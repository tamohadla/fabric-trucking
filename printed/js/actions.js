import { CrudService } from "./crudService.js";
import { ImageService } from "./imageService.js";

export function bindRowActions({ onEdit, onDuplicate, onViewImage, refresh }) {
  return async function handleAction(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    const payload = btn.dataset.payload ? JSON.parse(btn.dataset.payload) : null;

    if (action === "view") return onViewImage(payload?.imageurl || payload?.image_url || payload?.image);

    if (action === "edit") return onEdit(payload);

    if (action === "dup") return onDuplicate(payload);

    if (action === "del") {
      if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;
      // do not delete image unless last reference
      try {
        if (payload?.image_key && payload?.image_path) {
          const c = await CrudService.countByImageKey(payload.image_key);
          if (c <= 1) {
            try { await ImageService.remove(payload.image_path); } catch {}
          }
        }
      } catch {}
      await CrudService.remove(id);
      await refresh();
    }
  };
}
