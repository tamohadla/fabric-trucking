// ===== Supabase config (same as other pages) =====
const SUPABASE_URL = "https://umrczwoxjhxwvrezocrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcmN6d294amh4d3ZyZXpvY3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODA0MTUsImV4cCI6MjA3OTU1NjQxNX0.88PDM2h93rhGhOxVRDa5q3rismemqJJEpmBdwWmfgVQ";


const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const DONE_STATUS = "تم الاستلام";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-all");
  const container = document.getElementById("all-requests-container");
  let allItems = [];

  searchInput.addEventListener("input", () => render());

  async function loadAll() {
    const { data, error } = await client
      .from("artworks_studio")
      .select("*, print_houses(name)")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    allItems = data || [];
    render();
  }

  function render() {
    container.innerHTML = "";
    const term = (searchInput.value || "").toLowerCase();

    let items = [...allItems];
    if (term) {
      items = items.filter(r =>
        (r.design_name || "").toLowerCase().includes(term) ||
        (r.for_customer || "").toLowerCase().includes(term) ||
        ((r.print_houses && r.print_houses.name) || "").toLowerCase().includes(term)
      );
    }

    if (!items.length) {
      const div = document.createElement("div");
      div.textContent = "لا توجد رسومات.";
      div.style.fontSize = "13px";
      div.style.color = "#666";
      container.appendChild(div);
      return;
    }

    items.forEach(r => {
      const card = document.createElement("div");
      card.className = "request-card";

      const titleRow = document.createElement("div");
      titleRow.className = "request-title";

      const leftSpan = document.createElement("span");
      leftSpan.textContent = r.design_name || "-";

      const statusSpan = document.createElement("span");
      const isDone = r.status === DONE_STATUS;
      statusSpan.className = "request-status " + (isDone ? "status-done" : "status-pending");
      statusSpan.textContent = r.status || "لم يتم الاستلام بعد";

      titleRow.appendChild(leftSpan);
      titleRow.appendChild(statusSpan);

      const bodyRow = document.createElement("div");
      bodyRow.className = "request-body";

      const img = document.createElement("img");
      img.className = "request-image";
      img.src = r.design_image_url || "";
      img.alt = r.design_name || "";

      const info = document.createElement("div");
      info.className = "request-info";
      info.innerHTML = `
        <div>المطبعة: ${(r.print_houses && r.print_houses.name) || "-"}</div>
        <div>العميل: ${r.for_customer || "-"}</div>
        <div>القماش: ${r.fabric_type || "-"}</div>
        <div>تاريخ: ${r.sent_date || "-"}</div>
      `;

      bodyRow.appendChild(img);
      bodyRow.appendChild(info);

      card.appendChild(titleRow);
      card.appendChild(bodyRow);
      container.appendChild(card);
    });
  }

  loadAll();
});
