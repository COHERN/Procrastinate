// quote.js
// Procrastinator Prints — v1
// Working view shows internals.
// PRINT hides internals + controls so you can screenshot or print cleanly.

const COSTS = {
  ink: 0.02,      // per color per location per shirt
  labor: 0.67,    // per shirt
  setup: 40,      // per job
  screenPrep: 4,  // per screen per job (screens = colors * locations)
  spoilage: 10    // per job
};

// Client pricing per shirt (locked v1 tiers)
function pricePerShirt(qty) {
  if (qty >= 100) return 11;
  if (qty >= 50) return 13;
  return 15; // 24–49
}

const $ = (id) => document.getElementById(id);
const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

function formatNiceDate(d) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function calc() {
  let qty = Number($("qty").value);
  if (!Number.isFinite(qty)) qty = 24;
  qty = Math.max(24, Math.floor(qty));
  $("qty").value = String(qty);

  let colors = Number($("colors").value);
  if (!Number.isFinite(colors)) colors = 1;
  colors = Math.min(4, Math.max(1, Math.floor(colors)));
  $("colors").value = String(colors);

  const locations = Number($("locations").value) || 1;
  const blank = Number($("blankCost").value) || 0;

  // Dates
  const dateInput = $("dateIssued");
  if (!dateInput.value) {
    dateInput.valueAsDate = new Date();
  }
  const [year, month, day] = dateInput.value.split("-").map(Number);
const issued = new Date(year, month - 1, day);
  const valid = new Date(issued);
  valid.setDate(valid.getDate() + 14);

  $("jdIssued").textContent = formatNiceDate(issued);
  $("validThrough").textContent = formatNiceDate(valid);

  // Client pricing
  const per = pricePerShirt(qty);
  const total = per * qty;

  // Internal costs
  const screens = colors * locations;
  const internal =
    (blank * qty) +
    (COSTS.ink * colors * locations * qty) +
    (COSTS.labor * qty) +
    COSTS.setup +
    (COSTS.screenPrep * screens) +
    COSTS.spoilage;

  const profit = total - internal;
  const marginPct = total > 0 ? (profit / total) * 100 : 0;

  // Render price
  $("perShirt").textContent = `${money(per)} / SHIRT`;
  $("total").textContent = `${money(total)} TOTAL`;

  // Render job details (client safe)
  $("jdQty").textContent = String(qty);
  $("jdGarment").textContent = $("garment").selectedOptions[0].text;
  $("jdGarmentColor").textContent = $("garmentColor").value.trim() || "—";
  $("jdInkColors").textContent = $("inkColors").value.trim() || "—";
  $("jdColors").textContent = String(colors);
  $("jdLocation").textContent = (locations === 2) ? "FRONT + BACK" : "FRONT";

  // Render internal
  $("profit").textContent = money(profit);
  $("marginPct").textContent = `${marginPct.toFixed(1)}%`;

  $("costs").innerHTML = `
    <li>BLANKS: ${money(blank * qty)}</li>
    <li>INK: ${money(COSTS.ink * colors * locations * qty)}</li>
    <li>PRINT LABOR: ${money(COSTS.labor * qty)}</li>
    <li>SETUP LABOR: ${money(COSTS.setup)}</li>
    <li>SCREEN PREP: ${money(COSTS.screenPrep * screens)}</li>
    <li>SPOILAGE BUFFER: ${money(COSTS.spoilage)}</li>
    <li><strong>TOTAL COST: ${money(internal)}</strong></li>
  `;
}

function enterPrintMode() {
  // Ensure latest numbers before print
  calc();

  document.body.classList.add("printing");

  // Let styles apply, then print
  window.setTimeout(() => {
    window.print();
    // Restore working view after dialog closes
    document.body.classList.remove("printing");
  }, 50);
}

document.addEventListener("DOMContentLoaded", () => {
  $("getQuote").addEventListener("click", calc);
  $("printBtn").addEventListener("click", enterPrintMode);

  // Live updates while editing
  document.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("change", calc);
    el.addEventListener("input", calc);
  });

  calc();
});
