// quote.js
// Procrastinator Prints — Quote Calculator (Internal v1)
// Predictable rules. Easy to edit constants and pricing table.

const PRICING = {
  "12-24": { simple: 18, standard: 20, complex: 22 },
  "25-49": { simple: 15, standard: 17, complex: 19 },
  "50-99": { simple: 13, standard: 15, complex: 17 },
  "100+":  { simple: 11, standard: 13, complex: 15 },
};

// Locked internal cost rules
const COST = {
  blank: 4.01,                   // Bella 3001
  inkPerColorPerLocation: 0.02,  // per shirt
  printLaborPerShirt: 0.67,      // per shirt
  setupLaborPerJob: 40,          // per job
  screenPrepPerScreen: 4,        // per screen per job (film/emulsion/chemicals included)
  spoilageBufferPerJob: 10,      // per job
};

const DEFAULT_FROM_BUNDLE = {
  simple:   { colors: 1, locations: 1 },
  // Standard = "2 colors OR front+back (1 color each)"
  // Default: 2 colors, 1 location (predictable). Override if needed.
  standard: { colors: 2, locations: 1 },
  // Complex = "3+ colors OR multi-location"
  // Default: 3 colors, 1 location (predictable). Override if needed.
  complex:  { colors: 3, locations: 1 },
};

// ---- DOM
const el = {
  qty: document.getElementById("qty"),
  bundle: document.getElementById("bundle"),
  autoFromBundle: document.getElementById("autoFromBundle"),
  colors: document.getElementById("colors"),
  locations: document.getElementById("locations"),
  resetBtn: document.getElementById("resetBtn"),
  warning: document.getElementById("warning"),

  toggleInternal: document.getElementById("toggleInternal"),
  internalPanel: document.getElementById("internalPanel"),

  clientPerShirt: document.getElementById("clientPerShirt"),
  clientTotal: document.getElementById("clientTotal"),

  screens: document.getElementById("screens"),
  internalTotal: document.getElementById("internalTotal"),
  internalPerShirt: document.getElementById("internalPerShirt"),
  marginDollars: document.getElementById("marginDollars"),
  marginPercent: document.getElementById("marginPercent"),
  costLines: document.getElementById("costLines"),
};

// ---- Helpers
function money(n) {
  const v = Math.abs(n) < 0.0005 ? 0 : n;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function percent(n) {
  if (!isFinite(n)) return "—";
  return (n * 100).toFixed(1) + "%";
}

function clampInt(value, min) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, n);
}

function getQtyTier(qty) {
  if (qty >= 100) return "100+";
  if (qty >= 50) return "50-99";
  if (qty >= 25) return "25-49";
  return "12-24";
}

function getClientPricePerShirt(qty, bundleKey) {
  const tier = getQtyTier(qty);
  return PRICING[tier][bundleKey];
}

function applyBundleDefaults(bundleKey) {
  const def = DEFAULT_FROM_BUNDLE[bundleKey];
  el.colors.value = String(def.colors);
  el.locations.value = String(def.locations);
}

function setWarning(msg) {
  if (!msg) {
    el.warning.hidden = true;
    el.warning.textContent = "";
    return;
  }
  el.warning.hidden = false;
  el.warning.textContent = msg;
}

function buildCostLines(lines) {
  el.costLines.innerHTML = "";
  for (const line of lines) {
    const li = document.createElement("li");
    li.innerHTML = line;
    el.costLines.appendChild(li);
  }
}

// ---- Core calc
function calculate() {
  const qtyInput = clampInt(el.qty.value, 1);
  const bundleKey = el.bundle.value;

  // Enforce min 12 for the pricing table
  const qty = Math.max(12, qtyInput);

  // If auto-fill enabled, keep internal params aligned to bundle
  if (el.autoFromBundle.checked) {
    applyBundleDefaults(bundleKey);
  }

  const colors = clampInt(el.colors.value, 1);
  const locationsRaw = clampInt(el.locations.value, 1);
  const locations = Math.min(2, Math.max(1, locationsRaw));

  // Client pricing
  const clientPer = getClientPricePerShirt(qty, bundleKey);
  const clientTotal = clientPer * qty;

  // Internal cost components
  const screens = colors * locations;

  const blanks = COST.blank * qty;
  const ink = COST.inkPerColorPerLocation * colors * locations * qty;
  const printLabor = COST.printLaborPerShirt * qty;
  const setupLabor = COST.setupLaborPerJob;
  const screenPrep = COST.screenPrepPerScreen * screens;
  const spoilage = COST.spoilageBufferPerJob;

  const internalTotal = blanks + ink + printLabor + setupLabor + screenPrep + spoilage;

  const margin = clientTotal - internalTotal;
  const marginPct = clientTotal > 0 ? margin / clientTotal : NaN;

  // Warnings
  if (qtyInput < 12) {
    setWarning(`Pricing tiers start at 12. Quote calculated using quantity = 12 (you entered ${qtyInput}).`);
  } else {
    setWarning("");
  }

  // Render
  el.clientPerShirt.textContent = money(clientPer);
  el.clientTotal.textContent = money(clientTotal);

  el.screens.textContent = String(screens);
  el.internalTotal.textContent = money(internalTotal);
  el.internalPerShirt.textContent = money(internalTotal / qty);

  el.marginDollars.textContent = money(margin);
  el.marginPercent.textContent = percent(marginPct);

  buildCostLines([
    `<strong>Blanks</strong>: ${money(COST.blank)} × ${qty} = ${money(blanks)}`,
    `<strong>Ink</strong>: ${money(COST.inkPerColorPerLocation)} × colors (${colors}) × locations (${locations}) × ${qty} = ${money(ink)}`,
    `<strong>Print labor</strong>: ${money(COST.printLaborPerShirt)} × ${qty} = ${money(printLabor)}`,
    `<strong>Setup labor</strong>: ${money(setupLabor)}`,
    `<strong>Screen prep & reclaim</strong>: ${money(COST.screenPrepPerScreen)} × screens (${screens}) = ${money(screenPrep)}`,
    `<strong>Spoilage buffer</strong>: ${money(spoilage)}`,
    `<strong>Total internal cost</strong>: ${money(internalTotal)}`,
  ]);
}

// ---- Internal panel toggle (no auth, just convenience)
function syncInternalVisibility() {
  const show = el.toggleInternal.checked;
  el.internalPanel.style.display = show ? "block" : "none";
  localStorage.setItem("pp_show_internal", show ? "1" : "0");
}

function init() {
  const saved = localStorage.getItem("pp_show_internal");
  if (saved === "0") el.toggleInternal.checked = false;
  syncInternalVisibility();

  applyBundleDefaults(el.bundle.value);
  calculate();

  el.qty.addEventListener("input", calculate);
  el.bundle.addEventListener("change", calculate);

  el.autoFromBundle.addEventListener("change", calculate);
  el.colors.addEventListener("input", () => {
    if (!el.autoFromBundle.checked) calculate();
  });
  el.locations.addEventListener("change", () => {
    if (!el.autoFromBundle.checked) calculate();
  });

  el.toggleInternal.addEventListener("change", syncInternalVisibility);

  el.resetBtn.addEventListener("click", () => {
    el.qty.value = "12";
    el.bundle.value = "simple";
    el.autoFromBundle.checked = true;
    applyBundleDefaults("simple");
    el.toggleInternal.checked = true;
    syncInternalVisibility();
    calculate();
  });
}

init();
