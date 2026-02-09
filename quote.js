// Procrastinator Prints — Quote Calculator v1
// Working view shows internals.
// PRINT hides internals + controls so you can screenshot or print cleanly.

// Locked internal cost assumptions
const COSTS = {
  ink: 0.02,      // per color per location per shirt
  labor: 0.67,    // per shirt
  setup: 40,      // per job
  screenPrep: 4,  // per screen per job (screens = colors * locations)
  spoilage: 10    // per job
};

// Locked client upcharges (confirmed)
const UPCHARGE = {
  extraColorPerShirt: 2.00,     // each color beyond 1
  extraLocationPerShirt: 2.00   // each location beyond 1
};

// Base client pricing per shirt (locked tiers)
function basePricePerShirt(qty) {
  if (qty >= 100) return 11;
  if (qty >= 50) return 13;
  return 15; // 24–49
}

const $ = (id) => document.getElementById(id);
const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

function formatNiceDate(d) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getLocationCount() {
  const sel = $("printLocation");
  const opt = sel.selectedOptions[0];
  const locs = Number(opt?.dataset?.locs);
  return Number.isFinite(locs) && locs > 0 ? locs : 1;
}

function calc() {
  // Quantity
  let qty = Number($("qty").value);
  if (!Number.isFinite(qty)) qty = 24;
  qty = Math.max(24, Math.floor(qty));
  $("qty").value = String(qty);

  // Colors (1–4)
  let colors = Number($("colors").value);
  if (!Number.isFinite(colors)) colors = 1;
  colors = Math.min(4, Math.max(1, Math.floor(colors)));
  $("colors").value = String(colors);

  // Locations from dropdown (1 or 2)
  const locationCount = getLocationCount();

  // Blank cost / shirt (internal)
  const blank = Number($("blankCost").value) || 0;

  // Date handling (FIXED: no timezone day-shift)
  const dateInput = $("dateIssued");
  if (!dateInput.value) {
    dateInput.valueAsDate = new Date();
  }
  const [year, month, day] = dateInput.value.split("-").map(Number);
  const issued = new Date(year, month - 1, day); // local time date
  const valid = new Date(issued);
  valid.setDate(valid.getDate() + 14);

  $("jdIssued").textContent = formatNiceDate(issued);
  $("validThrough").textContent = formatNiceDate(valid);

  // Client pricing (base + upcharges)
  const base = basePricePerShirt(qty);

  const extraColors = Math.max(0, colors - 1);
  const extraLocations = Math.max(0, locationCount - 1);

  const per =
    base +
    (extraColors * UPCHARGE.extraColorPerShirt) +
    (extraLocations * UPCHARGE.extraLocationPerShirt);

  const total = per * qty;

  // Internal screens + costs
  const screens = colors * locationCount;

  const internal =
    (blank * qty) +
    (COSTS.ink * colors * locationCount * qty) +
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
  $("jdLocation").textContent = $("printLocation").selectedOptions[0].text;

  // Render internal
  $("profit").textContent = money(profit);
  $("marginPct").textContent = `${marginPct.toFixed(1)}%`;

  $("costs").innerHTML = `
    <li>BLANKS: ${money(blank * qty)}</li>
    <li>INK: ${money(COSTS.ink * colors * locationCount * qty)}</li>
    <li>PRINT LABOR: ${money(COSTS.labor * qty)}</li>
    <li>SETUP LABOR: ${money(COSTS.setup)}</li>
    <li>SCREEN PREP: ${money(COSTS.screenPrep * screens)}</li>
    <li>SPOILAGE BUFFER: ${money(COSTS.spoilage)}</li>
    <li><strong>TOTAL COST: ${money(internal)}</strong></li>
  `;
}

function doPrint() {
  // Always recalc before printing
  calc();

  // Enter print-safe view (hides internals + controls)
  document.body.classList.add("printing");

  // Let CSS apply, then open print dialog
  window.setTimeout(() => {
    window.print();
    // Restore after print dialog closes
    document.body.classList.remove("printing");
  }, 50);
}

document.addEventListener("DOMContentLoaded", () => {
  // Live updates while editing
  document.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("change", calc);
    el.addEventListener("input", calc);
  });

  $("printBtn").addEventListener("click", doPrint);

  calc();
});
