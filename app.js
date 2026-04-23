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
  updateApiStatus('online');
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
  const drugName  = dbResult.name || 'Unknown';
  const brandName = (dbResult.brandNames && dbResult.brandNames.length > 0)
    ? dbResult.brandNames[0] : drugName;

  // Step 1: Render immediately with DrugBank data (no wait)
  const localData = getDrugLocalData(drugName);
  AppState.currentDrug       = dbResult;
  AppState.currentFDALabel   = dbResult;
  AppState.currentLocalData  = localData;
  AppState.currentDailyMedLabel = null;
  AppState.currentRxCUI      = null;

  const profileHTML = renderDrugProfile(dbResult, localData, null, null, null);
  DOM.mainContent.innerHTML = profileHTML;
  initProfileTabs();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Step 2: Fetch DailyMed + RxNav in background, then refresh sections
  safeApiCall(() => getFullDrugLabel(drugName), null, 6000).then(dailyMedLabel => {
    if (!dailyMedLabel) return;
    AppState.currentDailyMedLabel = dailyMedLabel;
    // Re-render with enriched DailyMed data
    const enriched = renderDrugProfile(dbResult, localData, dailyMedLabel, null, null);
    DOM.mainContent.innerHTML = enriched;
    initProfileTabs();
  }).catch(() => {});
}}

function showProfileLoading(name) {
  DOM.mainContent.innerHTML = `
    <div class="loading-state">
      <div class="loader-ring"></div>
      <div class="loader-text">Loading <strong>${escapeHtml(name)}</strong>...</div>
    </div>`;
}

// -- Suggestions --
async function loadSuggestions(query) {
  if (!query || query.length < 2) { hideSuggestions(); return; }
  const results = await getSuggestions(query).catch(() => []);
  if (!results || results.length === 0) { hideSuggestions(); return; }
  let box = document.getElementById('search-suggestions');
  if (!box) {
    box = document.createElement('div');
    box.id = 'search-suggestions';
    box.className = 'suggestions-dropdown';
    const inp = DOM.searchInput;
    if (inp && inp.parentNode) inp.parentNode.appendChild(box);
  }
  box.innerHTML = results.map(r => `
    <div class="suggestion-item" onclick="performSearch('${escapeAttr(r.name)}')">
      <span class="suggestion-name">${escapeHtml(r.name)}</span>
      <span class="suggestion-type">${escapeHtml(r.type || 'Drug')}</span>
    </div>`).join('');
  box.style.display = 'block';
}

function hideSuggestions() {
  const box = document.getElementById('search-suggestions');
  if (box) box.style.display = 'none';
}

// -- Tabs --
function initProfileTabs() {
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const panel = document.getElementById(`tab-${tabName}`);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

// -- API Status --
function updateApiStatus(status) {
  const dot   = document.getElementById('api-status-dot');
  const label = document.getElementById('api-status-label');
  if (!dot || !label) return;
  if (status === 'online') {
    dot.style.background = '#00d4aa';
    dot.style.boxShadow  = '0 0 8px #00d4aa';
    label.textContent    = 'Online';
  } else if (status === 'offline') {
    dot.style.background = '#e74c3c';
    dot.style.boxShadow  = '0 0 8px #e74c3c';
    label.textContent    = 'Offline';
  } else {
    dot.style.background = '#f39c12';
    dot.style.boxShadow  = '0 0 8px #f39c12';
    label.textContent    = 'Connecting...';
  }
}

// -- Toast --
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}


    // --- Home Page -------
    function renderHomePage() {
  AppState.currentView = 'home';
  
  DOM.mainContent.innerHTML = `
    <div class="home-container">
      <div class="welcome-section">
        <h1>Welcome to PharmaScope Pro</h1>
        <p class="subtitle">Your comprehensive clinical drug reference</p>
      </div>
      
<div class="home-search-section">
          <div class="search-box-wrapper">
            <input
              id="main-search-input"
              class="home-search-input"
              type="text"
              placeholder="Search by drug name, generic name, or drug class..."
              autocomplete="off"
              onkeydown="if(event.key==='Enter') performSearch(this.value)"
            />
            <button class="home-search-btn" onclick="performSearch(document.getElementById('main-search-input').value)">
              &#128269; Search
            </button>
          </div>
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
      
  // Wire up home search input after rendering
  const homeInput = document.getElementById('main-search-input');
  if (homeInput) {
    homeInput.addEventListener('input', e => loadSuggestions(e.target.value));
    homeInput.addEventListener('blur',  () => setTimeout(hideSuggestions, 150));
    homeInput.addEventListener('focus', e => { if (e.target.value.length >= 2) loadSuggestions(e.target.value); });
  }
}
    
