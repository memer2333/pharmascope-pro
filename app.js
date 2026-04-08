/**
 * PharmaScope Pro — Main Application Controller
 * Orchestrates search, data fetching, rendering, and calculators
 */

// ── App State ────────────────────────────────────────────────
const AppState = {
  currentView: 'home',       // 'home' | 'results' | 'profile'
  searchQuery: '',
  searchResults: [],
  currentDrug: null,
  currentFDALabel: null,
  currentLocalData: null,
  currentRxCUI: null,
  suggestTimeout: null,
  isLoading: false
};

// ── DOM References ───────────────────────────────────────────
const DOM = {
  get searchInput() { return document.getElementById('main-search-input'); },
  get searchBtn() { return document.getElementById('main-search-btn'); },
  get suggestionsBox() { return document.getElementById('suggestions'); },
  get mainContent() { return document.getElementById('main-content'); },
  get toastContainer() { return document.getElementById('toast-container'); }
};

// ── Initialize App ───────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    renderHomePage();
    bindSearchEvents();
    updateAPIStatus('live');
  });
}

// ── Search Binding ───────────────────────────────────────────
function bindSearchEvents() {
  const input = DOM.searchInput;
  const btn = DOM.searchBtn;
  if (!input || !btn) return;

  // Submit on Enter
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch(input.value);
    if (e.key === 'Escape') hideSuggestions();
  });

  // Auto-suggest on typing
  input.addEventListener('input', () => {
    clearTimeout(AppState.suggestTimeout);
    const q = input.value.trim();
    if (q.length < 2) { hideSuggestions(); return; }
    AppState.suggestTimeout = setTimeout(() => loadSuggestions(q), 280);
  });

  // Hide suggestions on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) hideSuggestions();
  });

  btn.addEventListener('click', () => performSearch(DOM.searchInput?.value));
}

// ── Home Page ────────────────────────────────────────────────
function renderHomePage() {
  AppState.currentView = 'home';
  DOM.mainContent.innerHTML = `
    <section class="hero">
      <div class="hero-eyebrow">🏥 Clinical Reference Tool</div>
      <h1>
        The <span class="gradient-text">Clinical Drug</span><br>Reference You Trust
      </h1>
      <p class="hero-subtitle">
        Evidence-based drug information for healthcare professionals and students.
        Powered by FDA, NIH DailyMed, and RxNav — all free, all real-time.
      </p>

      <div class="search-wrapper">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="search-input" 
            id="main-search-input"
            placeholder="Search by drug name (e.g., Amoxicillin, Metformin)..."
            autocomplete="off"
            spellcheck="false"
            aria-label="Drug search"
          />
          <button class="search-btn" id="main-search-btn">
            Search
          </button>
        </div>
        <div class="suggestions-dropdown" id="suggestions" style="display:none"></div>
      </div>

      <div class="hero-stats">
        <div class="hero-stat">
          <div class="stat-number">100K+</div>
          <div class="stat-label">Drug Labels</div>
        </div>
        <div class="hero-stat">
          <div class="stat-number">7+M</div>
          <div class="stat-label">Adverse Event Reports</div>
        </div>
        <div class="hero-stat">
          <div class="stat-number">50+</div>
          <div class="stat-label">Curated Drug Profiles</div>
        </div>
        <div class="hero-stat">
          <div class="stat-number">5</div>
          <div class="stat-label">Clinical Modules</div>
        </div>
      </div>

      <div class="feature-pills">
        <span class="feature-pill">📋 Indications & MoA</span>
        <span class="feature-pill">⚖️ Dosing (Adult/Ped/Renal)</span>
        <span class="feature-pill">🛡 Safety & BBW</span>
        <span class="feature-pill">🔬 ADME / CYP450</span>
        <span class="feature-pill">⚡ Drug Interactions</span>
        <span class="feature-pill">📊 Adverse Events</span>
        <span class="feature-pill">🧮 CrCl Calculator</span>
        <span class="feature-pill">👶 Pediatric mg/kg</span>
      </div>
    </section>

    <section class="featured-section">
      ${renderFeaturedDrugs()}
    </section>
  `;

  bindSearchEvents();
}

// ── Search Flow ──────────────────────────────────────────────
async function performSearch(query) {
  if (!query || query.trim().length < 2) {
    showToast('Please enter a drug name to search.', 'info');
    return;
  }
  query = query.trim();
  AppState.searchQuery = query;
  hideSuggestions();

  showResultsLoading(query);

  try {
    const results = await searchDrugs(query);
    AppState.searchResults = results;
    renderResultsPage(results, query);
  } catch (err) {
    console.error(err);
    showToast('Search failed. Check your network connection.', 'error');
    renderResultsPage([], query);
  }
}

function showResultsLoading(query) {
  AppState.currentView = 'results';
  DOM.mainContent.innerHTML = `
    <div class="results-section">
      <div class="results-header">
        <span class="results-count">Searching for <strong>"${escapeHtml(query)}"</strong>…</span>
        <button class="btn-back" onclick="renderHomePage()">← Back</button>
      </div>
      <div class="loading-state">
        <div class="loader-ring"></div>
        <div class="loading-steps">
          <div class="loading-step active">Querying openFDA drug label database…</div>
        </div>
      </div>
    </div>`;
}

function renderResultsPage(results, query) {
  AppState.currentView = 'results';
  DOM.mainContent.innerHTML = `
    <div class="results-section">
      <div class="results-header">
        <span class="results-count">
          Found <strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} for <strong>"${escapeHtml(query)}"</strong>
        </span>
        <button class="btn-back" onclick="renderHomePage()">← New Search</button>
      </div>
      ${renderDrugCards(results, selectDrug)}
    </div>`;
}

// ── Drug Selection & Profile Load ───────────────────────────
async function selectDrug(dbResult) {
  if (!dbResult) return;
  const drugName = dbResult.name || 'Unknown';
  const brandName = (dbResult.brandNames && dbResult.brandNames.length > 0) ? dbResult.brandNames[0] : drugName;
  
  showProfileLoading(brandName);

  // Parallel data fetching
  const [adverseEvents, rxcui] = await Promise.all([
    getAdverseEvents(drugName).catch(() => null),
    getRxCUI(drugName).catch(() => null)
  ]);

  AppState.currentRxCUI = rxcui;
  let interactions = [];
  if (rxcui) {
    const interData = await getInteractionsByRxCUI(rxcui).catch(() => null);
    if (interData) interactions = parseInteractionData(interData);
  }

  const localData = getDrugLocalData(drugName) || getDrugLocalData(brandName);
  AppState.currentFDALabel = dbResult;
  AppState.currentLocalData = localData;

  renderProfilePage(dbResult, localData, adverseEvents, interactions, brandName);
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
          <div class="loading-step done">FDA label data loaded</div>
          <div class="loading-step active">Fetching adverse event reports…</div>
          <div class="loading-step" style="animation-delay:0.5s">Checking RxNav interactions…</div>
          <div class="loading-step" style="animation-delay:1s">Compiling clinical profile…</div>
        </div>
      </div>
    </div>`;
}

function renderProfilePage(fdaLabel, localData, adverseEvents, interactions, drugName) {
  const profileHTML = renderDrugProfile(fdaLabel, localData, adverseEvents?.results ? adverseEvents : null, interactions);
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
  
  // Scroll to top of profile
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Tab Switching ────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
}

// ── Autocomplete ─────────────────────────────────────────────
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
    const result = await checkLocalInteractions(drugNames);
    const { missing: missingDrugs, interactions } = result;

    let htmlContext = '';
    if (missingDrugs.length > 0) {
      htmlContext += `<div class="result-card warning" style="margin-bottom:0.8rem"><p class="result-note">⚠️ Note: Could not identify the following drugs: <strong>${missingDrugs.join(', ')}</strong>. They were excluded from the check.</p></div>`;
    }

    if (!interactions || interactions.length === 0) {
      htmlContext += `
        <div class="result-card success" style="margin-top:0.8rem">
          <div style="font-size:1.6rem;margin-bottom:0.4rem">✅</div>
          <div class="result-label">No significant interactions found</div>
          <p class="result-note">No clinically significant drug-drug interactions found in the local DrugBank database between the identified drugs. Always verify with a comprehensive clinical database.</p>
        </div>`;
    } else {
      htmlContext += `
        <div style="margin-top:0.8rem">
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.8rem">Found ${interactions.length} interaction(s) between the selected drugs:</p>
          ${interactions.map(i => `
            <div class="interaction-item" style="border-left-color: ${i.severityColor}">
              <div class="interaction-header">
                <span class="interaction-drugs">${escapeHtml(i.drug1)} ↔ ${escapeHtml(i.drug2)}</span>
                <span class="severity-badge" style="background:${i.severityColor}20;color:${i.severityColor};border:1px solid ${i.severityColor}40">${escapeHtml(i.severity)}</span>
              </div>
              <p class="interaction-desc">${escapeHtml(i.description)}</p>
              <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.4rem">Source: ${escapeHtml(i.source || 'NIH RxNav')}</p>
            </div>`).join('')}
        </div>`;
    }
    
    resultsEl.innerHTML = htmlContext;
  } catch (err) {
    console.error(err);
    if (resultsEl) resultsEl.innerHTML = `<div class="error-state">Failed to check interactions. Check your network and try again.</div>`;
  }
}

// ── CrCl Calculator ──────────────────────────────────────────
function runCrClCalculator(drugName) {
  const age = document.getElementById('crcl-age')?.value;
  const weight = document.getElementById('crcl-weight')?.value;
  const scr = document.getElementById('crcl-scr')?.value;
  const sex = document.getElementById('crcl-sex')?.value;
  const resultEl = document.getElementById('crcl-result');
  if (!resultEl) return;

  const result = calculateCrCl({ age, weight, scr, sex });
  if (result.error) {
    resultEl.innerHTML = `<div class="result-card warning"><p>${result.error}</p></div>`;
    return;
  }

  // Find renal dosing data for this drug
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
    // Parse ranges like ">60", "30-59", "<15", "≥45"
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
  // Fallback: if CrCl very low, try 'HD'
  if (crclValue < 10) {
    const hd = renalDosing.find(d => d.crcl.toLowerCase().includes('hd'));
    if (hd) return hd.adjustment;
  }
  return null;
}

// ── Pediatric Calculator ──────────────────────────────────────
function runPedCalc() {
  const weightKg = document.getElementById('ped-weight')?.value;
  const dosePerKg = document.getElementById('ped-dose')?.value;
  const maxDose = document.getElementById('ped-maxdose')?.value;
  const frequency = document.getElementById('ped-freq')?.value;
  const resultEl = document.getElementById('ped-result');
  if (!resultEl) return;

  const res = calculatePediatricDose({ weightKg, dosePerKg, maxDose, frequency });
  if (res.error) {
    resultEl.innerHTML = `<div class="result-card warning"><p>${res.error}</p></div>`;
    return;
  }

  const dailyStr = res.dailyDose ? `<div style="margin-top:0.4rem;font-size:0.82rem;color:var(--text-secondary)">Daily dose (${escapeHtml(frequency)}): <strong>${res.dailyDose} mg/day</strong></div>` : '';

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
function runBodyCalcs() {
  const weightKg = parseFloat(document.getElementById('body-weight')?.value);
  const heightCm = parseFloat(document.getElementById('body-height')?.value);
  const sex = document.getElementById('body-sex')?.value;
  const resultEl = document.getElementById('body-result');
  if (!resultEl) return;

  if (!weightKg || !heightCm) {
    resultEl.innerHTML = `<div class="result-card warning"><p>Please enter valid weight and height.</p></div>`;
    return;
  }

  const ibw = calculateIBW({ heightCm, sex });
  const adjbw = weightKg > ibw * 1.2 ? calculateAdjBW({ ibw, actualWeight: weightKg }) : null;
  const bsa = calculateBSA({ heightCm, weightKg });
  const bmi = calculateBMI({ weightKg, heightCm });

  resultEl.innerHTML = `
    <div class="result-card" style="margin-top:0.6rem">
      <div class="body-results-grid">
        <div class="body-result-item">
          <div class="body-result-value">${ibw} kg</div>
          <div class="body-result-label">Ideal Body Wt (IBW)</div>
          <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.15rem">Devine Formula</div>
        </div>
        ${adjbw ? `
        <div class="body-result-item">
          <div class="body-result-value">${adjbw} kg</div>
          <div class="body-result-label">Adjusted BW (AdjBW)</div>
          <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.15rem">IBW + 40% excess</div>
        </div>` : ''}
        <div class="body-result-item">
          <div class="body-result-value">${bsa} m²</div>
          <div class="body-result-label">Body Surface Area</div>
          <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.15rem">Mosteller Formula</div>
        </div>
        <div class="body-result-item">
          <div class="body-result-value">${bmi.value}</div>
          <div class="body-result-label">BMI (kg/m²)</div>
          <div class="bmi-cat" style="color:${bmi.category.color}">${bmi.category.label}</div>
        </div>
      </div>
    </div>`;
}

// ── API Status ────────────────────────────────────────────────
function updateAPIStatus(status) {
  const dot = document.getElementById('api-status-dot');
  const label = document.getElementById('api-status-label');
  if (!dot || !label) return;
  if (status === 'live') {
    dot.style.background = 'var(--success)';
    label.textContent = 'APIs Live';
  } else {
    dot.style.background = 'var(--danger)';
    label.textContent = 'Offline';
  }
}

// ── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = DOM.toastContainer;
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Utilities ─────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
