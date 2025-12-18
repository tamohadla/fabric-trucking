export function normalizeRow(r) {
  return {
    ...r,
    order_date: r.order_date || "",
    designcode: (r.designcode ?? "").toString(),
    mariagenumber: (r.mariagenumber ?? "").toString(),
  };
}

export function applyFiltersAndSort(rows, { statusFilter, sortBy, search }) {
  let out = rows.slice();

  const s = (search || "").trim();
  if (s) {
    const ss = s.toLowerCase();
    out = out.filter(r => {
      const hay = [
        r.designcode, r.mariagenumber, r.rawmaterial, r.printtype, r.groundprep, r.grade, r.notes,
        r.image_key
      ].map(v => (v ?? "").toString().toLowerCase()).join(" | ");
      return hay.includes(ss);
    });
  }

  const st = statusFilter || "all";
  if (st !== "all") out = out.filter(r => (r.status ?? "") === st);

  const sorter = sortBy || "order_date_desc";
  const cmp = {
    order_date_desc: (a,b) => (b.order_date||"").localeCompare(a.order_date||""),
    order_date_asc: (a,b) => (a.order_date||"").localeCompare(b.order_date||""),
    designcode_desc: (a,b) => (b.designcode||"").localeCompare(a.designcode||""),
    designcode_asc: (a,b) => (a.designcode||"").localeCompare(b.designcode||""),
  }[sorter] || ((a,b)=>0);

  out.sort(cmp);
  return out;
}

export function statusBadgeClass(status) {
  if (status === "تم التشكيل") return "done";
  if (status === "تحت التشغيل") return "running";
  if (status === "تم الاستلام") return "received";
  return "pending";
}
