// ===== Supabase config (replace with your real values) =====
const SUPABASE_URL = "https://umrczwoxjhxwvrezocrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcmN6d294amh4d3ZyZXpvY3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODA0MTUsImV4cCI6MjA3OTU1NjQxNX0.88PDM2h93rhGhOxVRDa5q3rismemqJJEpmBdwWmfgVQ";


const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const cardsContainer = document.getElementById("cards-container");

  const modal = document.getElementById("modal-overlay");
  const phInput = document.getElementById("ph-name-input");
  const saveBtn = document.getElementById("ph-save-btn");
  const cancelBtn = document.getElementById("ph-cancel-btn");

  const addPrintHouseCard = document.getElementById("add-print-house-card");
  const allArtworksCard = document.getElementById("all-artworks-card");

  // open modal
  addPrintHouseCard.onclick = () => {
    phInput.value = "";
    modal.style.display = "flex";
    phInput.focus();
  };

  // cancel modal
  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  // save new print house
  saveBtn.onclick = async () => {
    const name = phInput.value.trim();
    if (!name) {
      alert("رجاءً أدخل اسم المصبغة");
      return;
    }

    const { error } = await client
      .from("print_houses")
      .insert({ name });

    if (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ المصبغة");
      return;
    }

    modal.style.display = "none";
    await loadPrintHouses();
  };

  // go to all artworks page
  allArtworksCard.onclick = () => {
    window.location.href = "all-artworks.html";
  };

  // load print houses from DB and render cards
  async function loadPrintHouses() {
    // remove existing dynamic cards
    [...cardsContainer.querySelectorAll(".print-house-card")].forEach(el => el.remove());

    const { data, error } = await client
      .from("print_houses")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    data.forEach(ph => {
      const card = document.createElement("div");
      card.className = "card print-house-card";
      card.textContent = ph.name;
      card.onclick = () => {
        window.location.href = `print-house.html?id=${ph.id}`;
      };
      cardsContainer.appendChild(card);
    });
  }

  loadPrintHouses();
});
