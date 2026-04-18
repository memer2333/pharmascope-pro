/**
 * PharmaScope Pro — Main Application Controller
 */

// ── App State ─────────────────────────────────────────────────
const AppState = {
  currentView: 'home',
  searchResults: [],
  searchQuery: '',
  currentDrug: null,
  currentFDALabel: null,
  currentLocalData: null,
  currentDailyMedLabel: null,
  currentRxCUI: null,
};

// ── DOM References ────────────────────────────────────────────
const DOM = {
  get mainContent() { return document.getElementById('main-content'); },
  get searchInput()  { return document.getElementById('search-input'); },
  get searchBtn()    { return document.getElementById('search-btn'); },
};

// ── Initialisation ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHomePage();

  const inp = DOM.searchInput;
  if (inp) {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(inp.value); });
    inp.addEventListener('input',   e => loadSuggestions(e.target.value));
    inp.addEventListener('blur',    ()  => setTimeout(hideSuggestions, 150));
    inp.addEventListener('focus',   e => { if (e.target.value.length >= 2) loadSuggestions(e.target.value); });
  }
  const btn = DOM.searchBtn;
  if (btn) btn.addEventListener('click', () => performSearch(DOM.searchInput?.value || ''));
});

// ── Search ────────────────────────────────────────────────────
async function performSearch(query) {
  if (!query || query.trim().length < 2) {
    showToast('Please enter at least 2 characters.', 'info');
    return;
  }
  hideSuggestions();
  AppState.searchQuery = query.trim();
  AppState.currentView = 'results';

  DOM.mainContent.innerHTML = `
    <div class="loading-state">
      <div class="loader-ring"></div>
      <div class="loader-text">Searching for <strong>${escapeHtml(query)}</strong>…</div>
    </div>`;

  const results = await searchDrugs(query).catch(() => []);

  if (!results || results.length === 0) {
    DOM.mainContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No results found for “${escapeHtml(query)}”</h3>
        <p>Try a generic name, brand name, or drug class.</p>
        <button class="btn-primary" onclick="renderHomePage()">Back to Home</button>
      </div>`;
    return;
  }

  AppState.searchResults = results;
  window._drugRegistry = results;
  renderResultsPage(results, query);
}

function renderResultsPage(results, query) {
  AppState.currentView = 'results';
  DOM.mainContent.innerHTML = `
    <div class="results-header">
      <span class="results-count"><strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} for “${escapeHtml(query)}”</span>
      <button class="btn-back" onclick="renderHomePage()">🏠 Home</button>
    </div>
    <div class="drug-grid">
      ${renderDrugCards(results, selectDrug)}
    </div>`;
}

// ── Drug Profile ──────────────────────────────────────────────
async function selectDrug(dbResult) {
  if (!dbResult) return;
  const drugName = dbResult.name || 'Unknown';
  const brandName = (dbResult.brandNames && dbResult.brandNames.length > 0)
    ? dbResult.brandNames[0] : drugName;

  showProfileLoading(brandName);

  // Fetch DrugBank local data, adverse events, RxCUI, and DailyMed label in parallel
  const [adverseEvents, rxcui, dailyMedLabel] = await Promise.all([
    getAdverseEvents(drugName).catch(() => null),
    getRxCUI(drugName).catch(() => null),
    getFullDrugLabel(drugName).catch(() => null),
  ]);

  AppState.currentRxCUI = rxcui;

  // RxNorm interaction data (depends on rxcui, so sequential)
  let interactions = [];
  if (rxcui) {
    const interData = await getInteractionsByRxCUI(rxcui).catch(() => null);
    if (interData) interactions = parseInteractionData(interData);
  }

  // Curated local data (drugData.js hardcoded set — highest priority for dosing tables)
  const localData = getDrugLocalData(drugName) || getDrugLocalData(brandName);

  AppState.currentFDALabel    = dbResult;
  AppState.currentLocalData   = localData;
  AppState.currentDailyMedLabel = dailyMedLabel;

  renderProfilePage(dbResult, localData, dailyMedLabel, adverseEvents, interactions, brandName);
}

function handleCardClick(index) {
  try {
    const result = window._drugRegistry && window._drugRegistry[index];
    if (!result) { showToast('Could not load drug data. Please try again.', 'error'); return; }
    selectDrug(result);
  } catch (e) {
    console.error('Card click error', e);
    showToast('Could not load drug data.', 'error');
  }
}

function showProfileLoading(drugName) {
  AppState.currentView = 'profile';
  DOM.mainContent.innerHTML = `
    <div class="profile-section">
      <div class="loading-state">
        <div class="loader-ring"></div>
        <div class="loader-text">Loading <strong>${escapeHtml(drugName)}</strong> profile…</div>
        <div class="loading-steps">
          <div class="loading-step done">DrugBank data loaded</div>
          <div class="loading-step active">Fetching DailyMed prescribing info…</div>
          <div class="loading-step" style="animation-delay:0.5s">Fetching adverse event reports…</div>
          <div class="loading-step" style="animation-delay:1s">Checking RxNav interactions…</div>
          <div class="loading-step" style="animation-delay:1.5s">Compiling clinical profile…</div>
        </div>
      </div>
    </div>`;
}

function renderProfilePage(fdaLabel, localData, dailyMedLabel, adverseEvents, interactions, drugName) {
  const profileHTML = renderDrugProfile(fdaLabel, localData, dailyMedLabel, adverseEvents?.results ? adverseEvents : null, interactions);
  DOM.mainContent.innerHTML = `
    <div class="profile-section">
      <div class="results-header" style="margin-bottom: 1.2rem">
        <span class="results-count">Drug Profile: <strong>${escapeHtml(drugName)}</strong></span>
        <div style="display:flex;gap:.6rem">
          ${AppState.searchResults.length > 0
            ? `<button class="btn-back" onclick="renderResultsPage(AppState.searchResults, AppState.searchQuery)">← Results</button>`
            : ''}
          <button class="btn-back" onclick="renderHomePage()">🏠 Home</button>
        </div>
      </div>
      ${profileHTML}
    </div>`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Tab Switching ─────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
}

// ── Autocomplete ──────────────────────────────────────────────
async function loadSuggestions(query) {
  const suggestions = await getSuggestions(query).catch(() => []);
  const box = document.getElementById('suggestions');
  if (!box) return;
  if (!suggestions || suggestions.length === 0) { hideSuggestions(); return; }

  const seen = new Set();
  const unique = suggestions.filter(s => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });

  box.innerHTML = unique.map(s => `
    <div class="suggestion-item" onclick="performSearch('${escapeAttr(s.name)}')">
      <span>${escapeHtml(s.name)}</span>
      <span class="suggestion-type">${s.type}</span>
    </div>`).join('');
  box.style.display = 'block';
}

function hideSuggestions() {
  const box = document.getElementById('suggestions');
  if (box) box.style.display = 'none';
}

// ── Drug Interaction Checker ──────────────────────────────────
window.addInteractionField = function() {
  const container = document.getElementById('interaction-inputs');
  if (!container) return;
  const count = container.querySelectorAll('.multi-drug-target').length + 1;
  const newField = document.createElement('input');
  newField.type = 'text';
  newField.className = 'interaction-input multi-drug-target';
  newField.placeholder = `Drug ${count} (optional)`;
  container.appendChild(newField);
};

async function checkInteractions() {
  const inputs = document.querySelectorAll('.multi-drug-target');
  const drugNames = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v.length > 0);
  const resultsEl = document.getElementById('interaction-results');

  if (drugNames.length < 2) {
    showToast('Please enter at least two drug names to check interactions.', 'info');
    return;
  }

  if (resultsEl) {
    resultsEl.innerHTML = `<div class="loading-state" style="padding:1.5rem"><div class="loader-ring" style="width:32px;height:32px;border-width:2px"></div><span class="loader-text">Checking DrugBank Database…</span></div>`;
  }

  try {
    const rxcuiList = await Promise.all(
      drugNames.map(name => getRxCUI(name).catch(() => null))
    );
    const validRxCUIs = rxcuiList.filter(Boolean);

    if (validRxCUIs.length < 2) {
      if (resultsEl) resultsEl.innerHTML = `<p class="no-data">Could not find RxCUI identifiers for one or more drugs. Try exact generic names.</p>`;
      return;
    }

    const interData = await getInteractionsBetween(validRxCUIs).catch(() => null);
    const interactions = interData ? parseInteractionData(interData) : [];

    if (!interactions || interactions.length === 0) {
      if (resultsEl) resultsEl.innerHTML = `<div class="result-card success"><p>✅ No significant interactions found between these drugs in the RxNorm database.</p><p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem">Always verify with a clinical pharmacist for complete interaction screening.</p></div>`;
      return;
    }

    if (resultsEl) {
      resultsEl.innerHTML = interactions.map(inter => `
        <div class="interaction-result-card" style="border-left:3px solid ${inter.severityColor}">
          <div class="interaction-header">
            <span class="interaction-drugs">${escapeHtml(inter.drug1)} ↔ ${escapeHtml(inter.drug2)}</span>
            <span class="severity-badge" style="background:${inter.severityColor}20;color:${inter.severityColor};border:1px solid ${inter.severityColor}40">${escapeHtml(inter.severity)}</span>
          </div>
          <p class="interaction-desc">${highlightKeyTerms(escapeHtml(inter.description))}</p>
        </div>`).join('');
    }
  } catch (err) {
    console.error('Interaction check error:', err);
    if (resultsEl) resultsEl.innerHTML = `<p class="no-data">Interaction check failed. Please try again.</p>`;
  }
}

// ── Renal Calculator ──────────────────────────────────────────
function runRenalCalc() {
  const age    = parseFloat(document.getElementById('renal-age')?.value);
  const weight = parseFloat(document.getElementById('renal-weight')?.value);
  const scr    = parseFloat(document.getElementById('renal-scr')?.value);
  const sex    = document.getElementById('renal-sex')?.value || 'male';
  const resultEl = document.getElementById('renal-result');
  if (!resultEl) return;

  const result = calculateCrCl({ age, weight, scr, sex });
  if (result.error) {
    resultEl.innerHTML = `<div class="result-card warning"><p>${result.error}</p></div>`;
    return;
  }

  const drugName = AppState.currentDrug?.name || AppState.currentFDALabel?.name || '';
  const localData = AppState.currentLocalData;
  let renalAdjustment = null;
  if (localData?.renalDosing) {
    renalAdjustment = findRenalAdjustment(localData.renalDosing, result.value);
  }

  const cardClass = result.value >= 60 ? 'success' : result.value >= 30 ? 'warning' : 'danger';
  resultEl.innerHTML = `
    <div class="result-card ${cardClass}">
      <div class="result-value" style="color:${result.color}">${result.value} <small style="font-size:0.9rem;font-weight:400">mL/min</small></div>
      <div class="result-label">Creatinine Clearance (CrCl)</div>
      <span class="result-stage" style="background:${result.color}20;color:${result.color};border:1px solid ${result.color}40;margin-top:0.5rem;display:inline-block">
        ${result.stage.label} — ${result.stage.ckdStage}
      </span>
      <p class="result-note">${result.interpretation}</p>
      ${renalAdjustment ? `
        <div class="result-adjustment">
          <div class="result-adjustment-label">📋 Recommended Dose Adjustment for ${escapeHtml(drugName)}</div>
          <div class="result-adjustment-text">${highlightKeyTerms(escapeHtml(renalAdjustment))}</div>
        </div>` : ''}
      <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.6rem">
        Formula: CrCl = [(140 − age) × weight ${sex === 'female' ? '× 0.85 (female)' : ''}] ÷ (72 × SCr)
      </p>
    </div>`;
}

function findRenalAdjustment(renalDosing, crclValue) {
  for (const entry of renalDosing) {
    const c = String(entry.crcl).toLowerCase().trim();
    if (c === 'any') return entry.adjustment;
    if (c === 'hd' || c === 'esrd') continue;
    if (c.startsWith('≥') || c.startsWith('>=')) {
      const threshold = parseFloat(c.replace(/[^0-9.]/g, ''));
      if (crclValue >= threshold) return entry.adjustment;
    } else if (c.startsWith('>')) {
      const threshold = parseFloat(c.replace(/[^0-9.]/g, ''));
      if (crclValue > threshold) return entry.adjustment;
    } else if (c.startsWith('<')) {
      const threshold = parseFloat(c.replace(/[^0-9.]/g, ''));
      if (crclValue < threshold) return entry.adjustment;
    } else if (c.includes('–') || c.includes('-')) {
      const parts = c.split(/[–-]/).map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
      if (parts.length === 2 && crclValue >= parts[0] && crclValue <= parts[1]) return entry.adjustment;
    }
  }
  if (crclValue < 10) {
    const hd = renalDosing.find(d => d.crcl.toLowerCase().includes('hd'));
    if (hd) return hd.adjustment;
  }
  return null;
}

// ── Pediatric Calculator ──────────────────────────────────────
function runPedCalc() {
  const weightKg  = document.getElementById('ped-weight')?.value;
  const dosePerKg = document.getElementById('ped-dose')?.value;
  const maxDose   = document.getElementById('ped-maxdose')?.value;
  const frequency = document.getElementById('ped-freq')?.value;
  const resultEl  = document.getElementById('ped-result');
  if (!resultEl) return;

  const res = calculatePediatricDose({ weightKg, dosePerKg, maxDose, frequency });
  if (res.error) {
    resultEl.innerHTML = `<div class="result-card warning"><p>${res.error}</p></div>`;
    return;
  }

  const dailyStr = res.dailyDose
    ? `<div style="margin-top:0.4rem;font-size:0.82rem;color:var(--text-secondary)">Daily dose (${escapeHtml(frequency)}): <strong>${res.dailyDose} mg/day</strong></div>`
    : '';

  resultEl.innerHTML = `
    <div class="result-card success">
      <div class="ped-result-main">${res.finalDose} mg <small style="font-size:0.85rem;font-weight:400;color:var(--text-secondary)">per dose</small></div>
      ${res.wasCapped ? `<div class="ped-cap-note">⚠ Dose capped at maximum of ${res.maxDose} mg (calculated: ${res.calculatedDose} mg)</div>` : ''}
      ${dailyStr}
      <p class="result-note">${escapeHtml(res.note)}</p>
      <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.5rem">
        Formula: ${res.weightKg} kg × ${res.dosePerKg} mg/kg = ${res.calculatedDose} mg
      </p>
    </div>`;
}

// ── Body Parameter Calculators ────────────────────────────────
function runBMICalc() {
  const weight = parseFloat(document.getElementById('bmi-weight')?.value);
  const height = parseFloat(document.getElementById('bmi-height')?.value);
  const resultEl = document.getElementById('bmi-result');
  if (!resultEl) return;
  const res = calculateBMI({ weight, height });
  if (res.error) { resultEl.innerHTML = `<div class="result-card warning"><p>${res.error}</p></div>`; return; }
  const cardClass = res.bmi < 18.5 ? 'warning' : res.bmi < 25 ? 'success' : res.bmi < 30 ? 'warning' : 'danger';
  resultEl.innerHTML = `
    <div class="result-card ${cardClass}">
      <div class="result-value" style="color:${res.color}">${res.bmi}</div>
      <div class="result-label">Body Mass Index</div>
      <span class="result-stage" style="background:${res.color}20;color:${res.color};border:1px solid ${res.color}40;margin-top:0.5rem;display:inline-block">${res.category}</span>
      <p class="result-note">${res.interpretation}</p>
    </div>`;
}

function runIBWCalc() {
  const height = parseFloat(document.getElementById('ibw-height')?.value);
  const sex    = document.getElementById('ibw-sex')?.value || 'male';
  const resultEl = document.getElementById('ibw-result');
  if (!resultEl) return;
  const res = calculateIBW({ height, sex });
  if (res.error) { resultEl.innerHTML = `<div class="result-card warning"><p>${res.error}</p></div>`; return; }
  resultEl.innerHTML = `
    <div class="result-card success">
      <div class="result-value" style="color:#27ae60">${res.ibw} <small style="font-size:0.9rem;font-weight:400">kg</small></div>
      <div class="result-label">Ideal Body Weight (Devine Formula)</div>
      <p class="result-note">${escapeHtml(res.note)}</p>
      <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.5rem">Formula: ${sex === 'male' ? '50' : '45.5'} + 2.3 × (height_inches − 60)</p>
    </div>`;
}

// ── Utility ───────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}
// ── Home Page Builder ─────────────────────────────────────────
function buildHomePage() {
  let featured = '';
  try { featured = renderFeaturedDrugs(selectDrug); } catch(e) {}
  return `
    <div class="home-hero">
      <div class="home-hero-content">
        <div class="home-badge">🧬 Clinical Drug Reference</div>
        <h2 class="home-title">PharmaScope <span class="home-title-accent">Pro</span></h2>
        <p class="home-subtitle">Search 10,000+ drugs for dosing, interactions, pharmacokinetics & safety data.</p>
        <div class="home-search-wrap">
          <div class="search-container" style="position:relative;">
            <input
              type="text"
              id="search-input"
              class="search-input"
              placeholder="Search by drug name, brand, or class…"
              oninput="loadSuggestions(this.value)"
              onkeydown="if(event.key==='Enter') performSearch(this.value)"
              autocomplete="off"
            />
            <div id="suggestions-box" class="suggestions-dropdown"></div>
          </div>
          <button class="btn-primary home-search-btn id="search-btn""
            onclick="performSearch(document.getElementById('search-input').value)">
            Search
          </button>
        </div>
        <div class="home-quick-tags">
          <span class="quick-tag" onclick="performSearch('amoxicillin')">Amoxicillin</span>
          <span class="quick-tag" onclick="performSearch('metformin')">Metformin</span>
          <span class="quick-tag" onclick="performSearch('atorvastatin')">Atorvastatin</span>
          <span class="quick-tag" onclick="performSearch('lisinopril')">Lisinopril</span>
          <span class="quick-tag" onclick="performSearch('warfarin')">Warfarin</span>
        </div>
      </div>
    </div>
    ${featured ? `<div class="featured-section"><h3 class="section-heading">Featured Drugs</h3>${featured}</div>` : ''}`;
}

window.addInteractionField = function() {
  const container = document.getElementById('interaction-inputs');
  if (!container) return;
  const count = container.querySelectorAll('input').length + 1;
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'interaction-input multi-drug-target';
  inp.placeholder = `Drug ${count}`;
  container.appendChild(inp);
};
function renderHomePage() {
  AppState.currentView = 'home';
  AppState.currentDrug = null;
  AppState.currentFDALabel = null;
  AppState.currentLocalData = null;
  AppState.currentDailyMedLabel = null;
  DOM.mainContent.innerHTML = buildHomePage();
}
