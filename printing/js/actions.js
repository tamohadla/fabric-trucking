// Table actions wiring (delegation)
export function wireTableActions(tbody, onAction) {
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    onAction(action, id, e);
  });
}
