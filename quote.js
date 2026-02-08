// ---- LOCKED SHOP ECONOMICS (CODE ONLY)
const COSTS = {
  blank: 4.01,            // Bella 3001 baseline
  inkPerColor: 0.02,
  laborPerShirt: 0.67,
  setup: 40,
  screenPrep: 4,
  spoilage: 10,
};

// Bella-based pricing table (24+)
function pricePerShirt(qty) {
  if (qty >= 100) return 11;
  if (qty >= 50) return 13;
  if (qty >= 25) return 15;
  return 15;
}

// ---- ELEMENTS
const el = id => document.getElementById(id);

const inputs = [
  "qty","garment","garmentColor","inkColors","colors","locations"
];

inputs.forEach(id => el(id).addEventListener("input", calc));
el("clientView").addEventListener("change", toggleClientView);

function money(n) {
  return `$${n.toFixed(2)}`;
}

function calc() {
  let qty = Math.max(24, Number(el("qty").value));
  el("qty").value = qty;

  let colors = Math.min(4, Math.max(1, Number(el("colors").value)));
  el("colors").value = colors;

  let locations = Number(el("locations").value);
  let screens = colors * locations;

  let per = pricePerShirt(qty);
  let total = per * qty;

  // internal cost
  let blankCost = COSTS.blank * qty;
  let ink = COSTS.inkPerColor * colors * locations * qty;
  let labor = COSTS.laborPerShirt * qty;
  let screenPrep = COSTS.screenPrep * screens;

  let internal =
    blankCost + ink + labor +
    COSTS.setup + screenPrep + COSTS.spoilage;

  let margin = total - internal;
  let marginPct = (margin / total) * 100;

  el("perShirt").textContent = `${money(per)} / SHIRT`;
  el("total").textContent = `${money(total)} TOTAL`;

  el("screens").textContent = screens;
  el("marginPct").textContent = `${marginPct.toFixed(1)}%`;
  el("marginDollar").textContent = money(margin);

  el("costs").innerHTML = `
    <li>Blanks: ${money(blankCost)}</li>
    <li>Ink: ${money(ink)}</li>
    <li>Print labor: ${money(labor)}</li>
    <li>Setup labor: ${money(COSTS.setup)}</li>
    <li>Screen prep & reclaim: ${money(screenPrep)}</li>
    <li>Spoilage buffer: ${money(COSTS.spoilage)}</li>
    <li><strong>Total internal cost: ${money(internal)}</strong></li>
  `;
}

function toggleClientView() {
  el("internal").style.display =
    el("clientView").checked ? "none" : "block";
}

calc();
