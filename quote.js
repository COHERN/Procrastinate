const COSTS = {
  ink: 0.02,
  labor: 0.67,
  setup: 40,
  screenPrep: 4,
  spoilage: 10
};

function pricePerShirt(qty) {
  if (qty >= 100) return 11;
  if (qty >= 50) return 13;
  return 15;
}

const $ = id => document.getElementById(id);
const money = n => `$${n.toFixed(2)}`;

function calc() {
  let qty = Math.max(24, +$("qty").value || 24);
  let colors = Math.min(4, Math.max(1, +$("colors").value || 1));
  let locations = +$("locations").value;
  let blank = +$("blankCost").value || 0;

  let per = pricePerShirt(qty);
  let total = per * qty;

  let internal =
    blank * qty +
    COSTS.ink * colors * locations * qty +
    COSTS.labor * qty +
    COSTS.setup +
    COSTS.screenPrep * colors * locations +
    COSTS.spoilage;

  let profit = total - internal;
  let margin = (profit / total) * 100;

  $("perShirt").textContent = `${money(per)} / SHIRT`;
  $("total").textContent = `${money(total)} TOTAL`;

  $("jdQty").textContent = qty;
  $("jdGarment").textContent = $("garment").value;
  $("jdGarmentColor").textContent = $("garmentColor").value;
  $("jdInkColors").textContent = $("inkColors").value;
  $("jdColors").textContent = colors;
  $("jdLocation").textContent = locations === 2 ? "FRONT + BACK" : "FRONT";

  $("profit").textContent = money(profit);
  $("marginPct").textContent = `${margin.toFixed(1)}%`;

  $("costs").innerHTML = `
    <li>BLANKS: ${money(blank * qty)}</li>
    <li>INK: ${money(COSTS.ink * colors * locations * qty)}</li>
    <li>PRINT LABOR: ${money(COSTS.labor * qty)}</li>
    <li>SETUP LABOR: ${money(COSTS.setup)}</li>
    <li>SCREEN PREP: ${money(COSTS.screenPrep * colors * locations)}</li>
    <li>SPOILAGE BUFFER: ${money(COSTS.spoilage)}</li>
    <li><strong>TOTAL COST: ${money(internal)}</strong></li>
  `;
}

$("getQuote").onclick = calc;
$("clientView").onchange = e => {
  $("jobDetails").style.display = e.target.checked ? "none" : "block";
  $("internal").style.display = e.target.checked ? "none" : "block";
};

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("change", calc);
});

calc();
