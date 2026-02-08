// quote.js — Procrastinator Prints Quote Tool (internal)
// Locks shop economics in code. Job details editable in UI.
// Enforces: min qty 24, max colors 4, screens = colors * locations.

// ---- LOCKED SHOP ECONOMICS (CODE ONLY)
const COSTS = {
  inkPerColorPerLocationPerShirt: 0.02,
  printLaborPerShirt: 0.67,
  setupLaborPerJob: 40,
  screenPrepPerScreenPerJob: 4,
  spoilageBufferPerJob: 10,
};

// Bella-based client pricing table (24+ minimum)
function clientPricePerShirt(qty) {
  // You can tweak these later, but this is the working baseline.
  if (qty >= 100) return 11;
  if (qty >= 50) return 13;
  if (qty >= 25) return 15;
  return 15; // 24 falls here
}

function money(n) {
  const x = Number(n) || 0;
  return `$${x.toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // Inputs
  const qtyEl = $("qty");
  const blankCostEl = $("blankCost");
  const colorsEl = $("colors");
  const locationsEl = $("locations");

  // Outputs
  const perShirtEl = $("perShirt");
  const totalEl = $("total");

  const screensEl = $("screens");
  const marginPctEl = $("marginPct");
  const marginDollarEl = $("marginDollar");
  const costsEl = $("costs");

  const getQuoteBtn = $("getQuote");

  // Client view toggle
  const clientViewEl = $("clientView");
  const internalSectionEl = $("internal");

  function toggleClientView() {
    internalSectionEl.style.display = clientViewEl.checked ? "none" : "block";
  }

  function sanitize() {
    // Min qty 24
    let qty = Number(qtyEl.value);
    if (!Number.isFinite(qty)) qty = 24;
    qty = Math.max(24, Math.floor(qty));
    qtyEl.value = String(qty);

    // Colors 1–4
    let colors = Number(colorsEl.value);
    if (!Number.isFinite(colors)) colors = 1;
    colors = Math.max(1, Math.min(4, Math.floor(colors)));
    colorsEl.value = String(colors);

    // Locations: 1 or 2
    let locations = Number(locationsEl.value);
    if (!Number.isFinite(locations)) locations = 1;
    locations = locations === 2 ? 2 : 1;

    // Blank cost per shirt (editable)
    let blankUnit = Number(blankCostEl.value);
    if (!Number.isFinite(blankUnit)) blankUnit = 0;
    blankUnit = Math.max(0, blankUnit);
    blankCostEl.value = blankUnit.toFixed(2);

    return { qty, colors, locations, blankUnit };
  }

  function calc() {
    const { qty, colors, locations, blankUnit } = sanitize();

    const screens = colors * locations;

    // Client pricing
    const per = clientPricePerShirt(qty);
    const clientTotal = per * qty;

    // Internal cost math
    const blanksTotal = blankUnit * qty;
    const inkTotal = COSTS.inkPerColorPerLocationPerShirt * colors * locations * qty;
    const printLaborTotal = COSTS.printLaborPerShirt * qty;
    const setupLabor = COSTS.setupLaborPerJob;
    const screenPrepTotal = COSTS.screenPrepPerScreenPerJob * screens;
    const spoilage = COSTS.spoilageBufferPerJob;

    const internalTotal =
      blanksTotal +
      inkTotal +
      printLaborTotal +
      setupLabor +
      screenPrepTotal +
      spoilage;

    const margin = clientTotal - internalTotal;
    const marginPct = clientTotal > 0 ? (margin / clientTotal) * 100 : 0;

    // Render
    perShirtEl.textContent = `${money(per)} / SHIRT`;
    totalEl.textContent = `${money(clientTotal)} TOTAL`;

    screensEl.textContent = String(screens);
    marginPctEl.textContent = `${marginPct.toFixed(1)}%`;
    marginDollarEl.textContent = money(margin);

    costsEl.innerHTML = `
      <li>BLANKS: ${money(blankUnit)} × ${qty} = ${money(blanksTotal)}</li>
      <li>INK: ${money(inkTotal)}</li>
      <li>PRINT LABOR: ${money(printLaborTotal)}</li>
      <li>SETUP LABOR: ${money(setupLabor)}</li>
      <li>SCREEN PREP & RECLAIM: ${money(screenPrepTotal)}</li>
      <li>SPOILAGE BUFFER: ${money(spoilage)}</li>
      <li><strong>TOTAL INTERNAL COST: ${money(internalTotal)}</strong></li>
    `;
  }

  // Button triggers calc
  getQuoteBtn.addEventListener("click", calc);

  // Live update on changes (still keep button for “submit” feel)
  [qtyEl, blankCostEl, colorsEl, locationsEl].forEach((node) => {
    node.addEventListener("input", calc);
    node.addEventListener("change", calc);
  });

  clientViewEl.addEventListener("change", toggleClientView);

  // First run
  toggleClientView();
  calc();
});
