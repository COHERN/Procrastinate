// Procrastinator Prints — Quote Calculator v6

// ── Internal cost assumptions ──────────────────────────────────────────────
const COSTS = {
  ink:        0.08,
  labor:      1.25,
  setup:      35.00,
  screenPrep: 4.00,
  spoilage:   10.00
};

// ── Pricing rules ──────────────────────────────────────────────────────────
const PRICING = {
  minQty:         12,
  maxQty:         72,
  maxColors:       4,
  targetMargin: 0.45,
  ceilPerShirt: 30.00,  // raised from $25
  extraColor:    2.00,
  extraLocation: 1.50,
};

// ── Helpers ────────────────────────────────────────────────────────────────
const $     = (id) => document.getElementById(id);
const money = (n)  => `$${(Number(n) || 0).toFixed(2)}`;

function formatNiceDate(d) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getLocationCount() {
  const sel = $("printLocation");
  const opt = sel.selectedOptions[0];
  const locs = Number(opt?.dataset?.locs);
  return Number.isFinite(locs) && locs > 0 ? locs : 1;
}

// ── Internal cost calculation ──────────────────────────────────────────────
function calcInternal(qty, blank, colors, locationCount) {
  const screens = colors * locationCount;
  return (
    (blank * qty) +
    (COSTS.ink * colors * locationCount * qty) +
    (COSTS.labor * qty) +
    COSTS.setup +
    (COSTS.screenPrep * screens) +
    COSTS.spoilage
  );
}

// ── Next tier upsell suggestion ────────────────────────────────────────────
function upsellMessage(qty, per, blank, colors, locationCount) {
  const tiers = [12, 24, 36, 48, 72];
  const nextQty = tiers.find(t => t > qty);
  if (!nextQty || nextQty > PRICING.maxQty) return "";

  const nextInternal     = calcInternal(nextQty, blank, colors, locationCount);
  const nextCostPerShirt = nextInternal / nextQty;
  const nextBase         = nextCostPerShirt / (1 - PRICING.targetMargin);
  const extraColors      = Math.max(0, colors - 1);
  const extraLocations   = Math.max(0, locationCount - 1);

  const nextPer = Math.min(
    PRICING.ceilPerShirt,
    nextBase +
    (extraColors    * PRICING.extraColor) +
    (extraLocations * PRICING.extraLocation)
  );

  const saving = Number((per - nextPer).toFixed(2));
  if (saving <= 0) return "";

  const extraShirts = nextQty - qty;
  const extraCost   = ((nextPer * nextQty) - (per * qty)).toFixed(2);
  return `Add ${extraShirts} more shirts (${nextQty} total) and save $${saving.toFixed(2)}/shirt — only $${extraCost} more.`;
}

// ── Main calc ──────────────────────────────────────────────────────────────
function calc() {

  // Quantity — only clamp and write back when field is not focused
  let qty = Number($("qty").value);
  if (!Number.isFinite(qty) || qty < 1) qty = PRICING.minQty;
  qty = Math.min(PRICING.maxQty, Math.max(PRICING.minQty, Math.floor(qty)));
  if (document.activeElement !== $("qty")) {
    $("qty").value = String(qty);
  }

  // Qty warning
  const qtyWarning = $("qtyWarning");
  if (qtyWarning) {
    if (qty >= PRICING.maxQty) {
      qtyWarning.textContent = `Maximum order is ${PRICING.maxQty} shirts. Contact us for larger orders.`;
      qtyWarning.style.display = "block";
    } else {
      qtyWarning.style.display = "none";
    }
  }

  // Colors
  const colors = Number($("colors").value) || 1;

  // Locations
  const locationCount = getLocationCount();

  // Blank cost
  const blank = Number($("blankCost").value) || 0;

  // Dates
  const dateInput = $("dateIssued");
  if (!dateInput.value) dateInput.valueAsDate = new Date();
  const [year, month, day] = dateInput.value.split("-").map(Number);
  const issued = new Date(year, month - 1, day);
  const valid  = new Date(issued);
  valid.setDate(valid.getDate() + 14);

  $("jdIssued").textContent     = formatNiceDate(issued);
  $("validThrough").textContent = formatNiceDate(valid);

  // ── Pricing ──
  const internal     = calcInternal(qty, blank, colors, locationCount);
  const costPerShirt = internal / qty;
  const marginBase   = costPerShirt / (1 - PRICING.targetMargin);

  const extraColors    = Math.max(0, colors - 1);
  const extraLocations = Math.max(0, locationCount - 1);

  const per = Math.min(
    PRICING.ceilPerShirt,
    marginBase +
    (extraColors    * PRICING.extraColor) +
    (extraLocations * PRICING.extraLocation)
  );

  const total     = per * qty;
  const profit    = total - internal;
  const marginPct = total > 0 ? (profit / total) * 100 : 0;

  // ── Render price ──
  $("perShirt").textContent = `${money(per)} / SHIRT`;
  $("total").textContent    = `${money(total)} TOTAL`;

  // ── Render job details ──
  $("jdQuoteNumber").textContent  = $("quoteNumber").value.trim() || "—";
  $("jdClientName").textContent   = $("clientName").value.trim()  || "—";
  $("jdJobName").textContent      = $("jobName").value.trim()     || "—";
  $("jdQty").textContent          = String(qty);
  $("jdGarment").textContent      = $("garment").selectedOptions[0].text;
  $("jdGarmentColor").textContent = $("garmentColor").value.trim() || "—";
  $("jdInkColors").textContent    = $("inkColors").value.trim()   || "—";
  $("jdLocation").textContent     = $("printLocation").selectedOptions[0].text;

  // ── Notes ──
  const notesVal     = $("notes").value.trim();
  const notesDisplay = $("notesDisplay");
  if (notesDisplay) {
    if (notesVal) {
      $("jdNotes").textContent   = notesVal;
      notesDisplay.style.display = "block";
    } else {
      notesDisplay.style.display = "none";
    }
  }

  // ── Internal ──
  $("profit").textContent    = money(profit);
  $("marginPct").textContent = `${marginPct.toFixed(1)}%`;

  $("costs").innerHTML = `
    <li>BLANKS: ${money(blank * qty)}</li>
    <li>INK: ${money(COSTS.ink * colors * locationCount * qty)}</li>
    <li>PRINT LABOR: ${money(COSTS.labor * qty)}</li>
    <li>SETUP LABOR: ${money(COSTS.setup)}</li>
    <li>SCREEN PREP: ${money(COSTS.screenPrep * colors * locationCount)}</li>
    <li>SPOILAGE BUFFER: ${money(COSTS.spoilage)}</li>
    <li><strong>TOTAL COST: ${money(internal)}</strong></li>
  `;

  // ── Upsell ──
  const upsellEl = $("upsell");
  if (upsellEl) {
    const msg = upsellMessage(qty, per, blank, colors, locationCount);
    upsellEl.textContent   = msg;
    upsellEl.style.display = msg ? "block" : "none";
  }

  // ── Terms ──
  const termsMin = $("termsMin");
  if (termsMin) {
    termsMin.textContent = `Screen printing has a minimum of ${PRICING.minQty} pieces and a maximum of ${PRICING.maxQty} pieces per order. For larger orders please contact us for contractor pricing.`;
  }
}

// ── Copy to clipboard ──────────────────────────────────────────────────────
function copyQuote() {
  const num    = $("quoteNumber").value.trim() || "PRO-???";
  const client = $("clientName").value.trim()  || "—";
  const job    = $("jobName").value.trim()      || "—";
  const qty    = $("qty").value;
  const per    = $("perShirt").textContent;
  const total  = $("total").textContent;
  const date   = $("jdIssued").textContent;
  const valid  = $("validThrough").textContent;

  const text =
    `${num} | ${client} | ${job} | ${date}\n` +
    `${qty} shirts | ${per} | ${total} | Valid through ${valid}`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = $("copyBtn");
    btn.textContent = "COPIED ✓";
    setTimeout(() => btn.textContent = "COPY", 2000);
  }).catch(() => {
    alert("Copy failed — try a different browser.");
  });
}

// ── Print ──────────────────────────────────────────────────────────────────
function doPrint() {
  calc();
  document.body.classList.add("printing");
  window.setTimeout(() => {
    window.print();
    document.body.classList.remove("printing");
  }, 50);
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("change", calc);
    el.addEventListener("input",  calc);
  });

  $("calcBtn").addEventListener("click", calc);
  $("copyBtn").addEventListener("click", copyQuote);
  $("printBtn").addEventListener("click", doPrint);

  calc();
});
