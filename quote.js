// LOCKED SHOP ECONOMICS
const COSTS = {
  ink: 0.02,
  labor: 0.67,
  setup: 40,
  screenPrep: 4,
  spoilage: 10
};

// Client pricing (Bella baseline)
function pricePerShirt(qty) {
  if (qty >= 100) return 11;
  if (qty >= 50) return 13;
  return 15;
}

const $ = id => document.getElementById(id);
const money = n => `$${n.toFixed(2)}`;

function calc() {
  const qty = Math.max(24, +$("qty").value || 24);
  const colors = Math.min(4, Math.max(1, +$("colors").value || 1));
  const locations = +$("locations").value;
  const blank = +$("blankCost").value || 0;

  // Dates
  const dateInput = $("dateIssued");
  if (!dateInput.value) {
    dateInput.valueAsDate = new Date();
  }

  const issued = new Date(dateInput.value);
  const valid = new Date(issued);
  valid.setDate(valid.getDate() + 14);
  $("validThrough").textContent = valid.toLocaleDateString();

  // Pricing
  const per = pricePerShirt(qty);
  const total = per * qty;

  const internal =
    blank * qty +
    COSTS.ink * colors * locations * qty +
    COSTS.labor * qty +
    COSTS.setup +
    COSTS.screenPrep * colors * locations +
    COSTS.spoilage;

  const profit = total - internal;
  const margin = (profit / total) * 100;

  // Render
  $("perShirt").textContent = `${money(per)} / SHIRT`;
  $("total").textContent = `${money(total)} TOTAL`;

  $("jdQty").textContent = qty;
  $("jdGarment").textContent = $("garment").selectedOptions[0].text;
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

// Toggle hides everything INTERNAL
$("clientView").onchange = e => {
  const hide = e.target.checked;
  $("jobDetails").style.display = hide ? "none" : "block";
  $("internal").style.display = hide ? "none" : "block";
  document.querySelector(".internalDivider").style.display = hide ? "none" : "block";
};

$("getQuote").onclick = calc;
document.querySelectorAll("input, select").forEach(el =>
  el.addEventListener("change", calc)
);

calc();
