/**
 * Updated: Timeout handling for API calls
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
    safeApiCall(() => getAdverseEvents(drugName), null, 6000),
        safeApiCall(() => getRxCUI(drugName), null, 6000),
        safeApiCall(() => getFullDrugLabel(drugName), null, 6000),
