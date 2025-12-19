function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function applyFiltersAndSort(rows, { statusFilter, sortField, searchInput }) {
  let out = [...(rows || [])];

  const st = statusFilter?.value || "all";
  if (st !== "all") out = out.filter(r => (r.status || "") === st);

  const q = (searchInput?.value || "").trim().toLowerCase();
  if (q) {
    out = out.filter(r => {
      const hay = [
        r.designcode, r.mariagenumber, r.rawmaterial, r.printtype, r.groundprep, r.image_key
      ].map(x => String(x ?? "")).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  const sf = sortField?.value || "date_desc";
  const byDate = (a) => new Date(a.date || "1970-01-01").getTime();
  if (sf === "date_desc") out.sort((a,b)=>byDate(b)-byDate(a));
  if (sf === "date_asc") out.sort((a,b)=>byDate(a)-byDate(b));
  if (sf === "design_asc") out.sort((a,b)=>String(a.designcode??"").localeCompare(String(b.designcode??"")));
  if (sf === "design_desc") out.sort((a,b)=>String(b.designcode??"").localeCompare(String(a.designcode??"")));
  return out;
}

export function renderPrintedTable(rows, tbody, totalsEl) {
  tbody.innerHTML = "";
  let totalQty = 0;

  rows.forEach((row, idx) => {
    const qty = Number(row.qtykg || 0);
    if (Number.isFinite(qty)) totalQty += qty;

    const imgUrl = row.imageurl || "";
    const imgHtml = imgUrl
      ? `<img class="printed-table-img" src="${escapeHtml(imgUrl)}" alt="img" />`
      : `<span style="color:#9ca3af;">—</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${imgHtml}</td>
      <td>${escapeHtml(row.designcode ?? "")}</td>
      <td>${escapeHtml(row.screenscount ?? "")}</td>
      <td>${escapeHtml(row.mariagenumber ?? "")}</td>
      <td>${escapeHtml(row.printtype ?? "")}</td>
      <td>${escapeHtml(row.groundprep ?? "")}</td>
      <td>${escapeHtml(row.rawmaterial ?? "")}</td>
<td>${escapeHtml(row.qtykg ?? "")}</td>
      <td>${escapeHtml(row.date ?? "")}</td>
      <td>${escapeHtml(row.status ?? "")}</td>
      <td>${escapeHtml(row.notes ?? "")}</td>
      <td class="actions">
        <button class="btn small" data-action="edit" data-id="${row.id}">تعديل</button>
        <button class="btn small" data-action="duplicate" data-id="${row.id}">تكرار</button>
        <button class="btn small danger" data-action="delete" data-id="${row.id}">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (totalsEl) {
    totalsEl.textContent = `عدد الطلبات: ${rows.length} — إجمالي الكمية (كغ): ${Math.round(totalQty*100)/100}`;
  }
}
