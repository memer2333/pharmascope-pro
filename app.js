/**
 * Fixed: Restored complete file - ready for deployment * PharmaScope Pro — Main Application Controller
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
450

    // --- Home Page -------
    function renderHomePage() {
  AppState.currentView = 'home';
  
  DOM.mainContent.innerHTML = `
    <div class="home-container">
      <div class="welcome-section">
        <h1>Welcome to PharmaScope Pro</h1>
        <p class="subtitle">Your comprehensive clinical drug reference</p>
      </div>
      
      <div class="search-prompt">
        <div class="search-icon">🔍</div>
        <h2>Search for Drugs</h2>
        <p>Use the Quick Search button above to find detailed information about any medication</p>
      </div>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">💊</div>
          <h3>Drug Information</h3>
          <p>Access comprehensive drug details from FDA and DailyMed</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">⚠️</div>
          <h3>Adverse Events</h3>
          <p>Review reported adverse reactions and safety data</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔬</div>
          <h3>Clinical Data</h3>
          <p>Explore RxCUI codes and drug classifications</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">✨</div>
          <h3>AI Assistant</h3>
          <p>Get instant answers with our Gemini-powered chatbot</p>
        </div>
      </div>
    </div>
  `;
}
    
