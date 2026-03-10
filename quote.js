// Procrastinator Prints — Quote Calculator v3
// Working view shows internals.
// PRINT hides internals + controls so you can screenshot or print cleanly.

// ── Internal cost assumptions (adjust as needed) ──────────────────────────
const COSTS = {
ink:        0.08,   // per color per location per shirt
labor:      1.25,   // per shirt
setup:      35.00,  // flat per job
screenPrep: 4.00,   // per screen per job (screens = colors × locations)
spoilage:   10.00   // flat per job
};

// ── Pricing rules ──────────────────────────────────────────────────────────
const PRICING = {
minQty:          12,
maxQty:          72,
maxColors:        4,
targetMargin:  0.45,   // 45% — price auto-calculated from cost + this margin
ceilPerShirt:  25.00,  // never quote above this per shirt
extraColor:     2.00,  // per shirt per extra color beyond 1
extraLocation:  1.50,  // per shirt per extra location beyond 1
};

// ── Helpers ────────────────────────────────────────────────────────────────
const $     = (id) => document.getElementById(id);
const money = (n)  => `$${(Number(n) || 0).toFixed(2)}`;

function formatNiceDate(d) {
return d.toLocaleDateString(undefined, { year: “numeric”, month: “short”, day: “numeric” });
}

function getLocationCount() {
const sel = $(“printLocation”);
const opt = sel.selectedOptions[0];
const locs = Number(opt?.dataset?.locs);
return Number.isFinite(locs) && locs > 0 ? locs : 1;
}

// ── Next tier upsell suggestion ────────────────────────────────────────────
function upsellMessage(qty, per, blank, colors, locationCount) {
const tiers = [12, 24, 36, 48, 72];
const nextQty = tiers.find(t => t > qty);
if (!nextQty || nextQty > PRICING.maxQty) return “”;

// Calculate next tier price
const nextInternal = calcInternal(nextQty, blank, colors, locationCount);
const nextCostPerShirt = nextInternal / nextQty;
const nextBase = nextCostPerShirt / (1 - PRICING.targetMargin);
const extraColors    = Math.max(0, colors - 1);
const extraLocations = Math.max(0, locationCount - 1);
const nextPer = Math.min(
PRICING.ceilPerShirt,
nextBase +
(extraColors    * PRICING.extraColor) +
(extraLocations * PRICING.extraLocation)
);

const saving = (per - nextPer).toFixed(2);
if (saving <= 0) return “”;

const extraShirts = nextQty - qty;
const extraCost   = (nextPer * nextQty - per * qty).toFixed(2);
return `Add ${extraShirts} more shirts (${nextQty} total) and save $${saving}/shirt — only $${extraCost} more.`;
}

// ── Internal cost calculation ──────────────────────────────────────────────
function calcInternal(qty, blank, colors, locationCount) {
const screens = colors * locationCount;
return (
(blank             * qty) +
(COSTS.ink * colors * locationCount * qty) +
(COSTS.labor       * qty) +
COSTS.setup +
(COSTS.screenPrep  * screens) +
COSTS.spoilage
);
}

// ── Main calc ──────────────────────────────────────────────────────────────
function calc() {

// Quantity — clamp to min/max
let qty = Number($(“qty”).value);
if (!Number.isFinite(qty) || qty < PRICING.minQty) qty = PRICING.minQty;
qty = Math.min(PRICING.maxQty, Math.floor(qty));
$(“qty”).value = String(qty);

// Qty warning
const qtyWarning = $(“qtyWarning”);
if (qtyWarning) {
const raw = Number($(“qty”).value);
if (raw < PRICING.minQty) {
qtyWarning.textContent = `Minimum order is ${PRICING.minQty} shirts.`;
qtyWarning.style.display = “block”;
} else if (raw > PRICING.maxQty) {
qtyWarning.textContent = `Maximum order is ${PRICING.maxQty} shirts. Contact us for larger orders.`;
qtyWarning.style.display = “block”;
} else {
qtyWarning.style.display = “none”;
}
}

// Colors — clamp 1–4
let colors = Number($(“colors”).value);
if (!Number.isFinite(colors)) colors = 1;
colors = Math.min(PRICING.maxColors, Math.max(1, Math.floor(colors)));
$(“colors”).value = String(colors);

// Locations
const locationCount = getLocationCount();

// Blank cost
const blank = Number($(“blankCost”).value) || 0;

// Dates
const dateInput = $(“dateIssued”);
if (!dateInput.value) dateInput.valueAsDate = new Date();
const [year, month, day] = dateInput.value.split(”-”).map(Number);
const issued = new Date(year, month - 1, day);
const valid  = new Date(issued);
valid.setDate(valid.getDate() + 14);

$(“jdIssued”).textContent    = formatNiceDate(issued);
$(“validThrough”).textContent = formatNiceDate(valid);

// ── Pricing ──
const internal       = calcInternal(qty, blank, colors, locationCount);
const costPerShirt   = internal / qty;
const marginBase     = costPerShirt / (1 - PRICING.targetMargin); // 45% margin floor

const extraColors    = Math.max(0, colors - 1);
const extraLocations = Math.max(0, locationCount - 1);

const per = Math.min(
PRICING.ceilPerShirt,
marginBase +
(extraColors    * PRICING.extraColor) +
(extraLocations * PRICING.extraLocation)
);

const total   = per * qty;
const profit  = total - internal;
const marginPct = total > 0 ? (profit / total) * 100 : 0;

// ── Render price ──
$(“perShirt”).textContent = `${money(per)} / SHIRT`;
$(“total”).textContent    = `${money(total)} TOTAL`;

// ── Render job details (client-safe) ──
$(“jdQty”).textContent          = String(qty);
$(“jdGarment”).textContent      = $(“garment”).selectedOptions[0].text;
$(“jdGarmentColor”).textContent = $(“garmentColor”).value.trim() || “—”;
$(“jdInkColors”).textContent    = $(“inkColors”).value.trim() || “—”;
$(“jdColors”).textContent       = String(colors);
$(“jdLocation”).textContent     = $(“printLocation”).selectedOptions[0].text;

// ── Render internal ──
$(“profit”).textContent    = money(profit);
$(“marginPct”).textContent = `${marginPct.toFixed(1)}%`;

$(“costs”).innerHTML = `<li>BLANKS: ${money(blank * qty)}</li> <li>INK: ${money(COSTS.ink * colors * locationCount * qty)}</li> <li>PRINT LABOR: ${money(COSTS.labor * qty)}</li> <li>SETUP LABOR: ${money(COSTS.setup)}</li> <li>SCREEN PREP: ${money(COSTS.screenPrep * colors * locationCount)}</li> <li>SPOILAGE BUFFER: ${money(COSTS.spoilage)}</li> <li><strong>TOTAL COST: ${money(internal)}</strong></li>`;

// ── Upsell callout ──
const upsellEl = $(“upsell”);
if (upsellEl) {
const msg = upsellMessage(qty, per, blank, colors, locationCount);
upsellEl.textContent    = msg;
upsellEl.style.display  = msg ? “block” : “none”;
}

// ── Update terms min/max dynamically ──
const termsMin = $(“termsMin”);
if (termsMin) {
termsMin.textContent = `Screen printing has a minimum of ${PRICING.minQty} pieces and a maximum of ${PRICING.maxQty} pieces per order. For larger orders please contact us for contractor pricing.`;
}
}

// ── Print ──────────────────────────────────────────────────────────────────
function doPrint() {
calc();
document.body.classList.add(“printing”);
window.setTimeout(() => {
window.print();
document.body.classList.remove(“printing”);
}, 50);
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener(“DOMContentLoaded”, () => {
document.querySelectorAll(“input, select”).forEach(el => {
el.addEventListener(“change”, calc);
el.addEventListener(“input”,  calc);
});
$(“printBtn”).addEventListener(“click”, doPrint);
calc();
});