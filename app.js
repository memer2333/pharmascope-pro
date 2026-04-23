// PharmaScope Pro - Main Application Controller

// App State
var AppState = {
  currentView: 'home',
  searchResults: [],
  searchQuery: '',
  currentDrug: null
};

// DOM References
var DOM = {
  get mainContent() { return document.getElementById('main-content'); },
  get searchInput()  { return document.getElementById('search-input'); },
  get searchBtn()    { return document.getElementById('search-btn'); }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  updateApiStatus('online');
  renderHomePage();
  var inp = DOM.searchInput;
  if (inp) {
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') performSearch(inp.value); });
    inp.addEventListener('input',   function(e) { loadSuggestions(e.target.value); });
    inp.addEventListener('blur',    function()  { setTimeout(hideSuggestions, 150); });
    inp.addEventListener('focus',   function(e) { if (e.target.value.length >= 2) loadSuggestions(e.target.value); });
  }
  var btn = DOM.searchBtn;
  if (btn) btn.addEventListener('click', function() { performSearch(DOM.searchInput ? DOM.searchInput.value : ''); });
});

// Search
async function performSearch(query) {
  if (!query || query.trim().length < 2) {
    showToast('Please enter at least 2 characters.', 'info');
    return;
  }
  hideSuggestions();
  AppState.searchQuery = query.trim();
  var mc = DOM.mainContent;
  if (!mc) return;
  mc.innerHTML = '<div class="loading-state"><p>Searching for <strong>' + escapeHtml(query) + '</strong>...</p></div>';
  var results = [];
  try { results = await searchDrugs(query) || []; } catch(e) { results = []; }
  if (!results || results.length === 0) {
    mc.innerHTML = '<div class="empty-state"><p>No results found for "' + escapeHtml(query) + '".</p><button onclick="renderHomePage()">Back to Home</button></div>';
    return;
  }
  AppState.searchResults = results;
  window._drugRegistry = results;
  renderResultsPage(results, query);
}

function renderResultsPage(results, query) {
  var mc = DOM.mainContent;
  if (!mc) return;
  mc.innerHTML = '<div class="results-header"><span><strong>' + results.length + '</strong> result' + (results.length !== 1 ? 's' : '') + ' for "' + escapeHtml(query) + '"</span> <button onclick="renderHomePage()">Home</button></div>' + renderDrugCards(results, selectDrug);
}

// Drug Profile
function selectDrug(dbResult) {
  if (!dbResult) { showToast('No drug data available', 'error'); return; }
  var mc = DOM.mainContent;
  if (!mc) { showToast('Page error - please refresh', 'error'); return; }
  try {
    var localData = getDrugLocalData(dbResult.name || '');
    var profileHTML = renderDrugProfile(dbResult, localData, null, null, null);
    mc.innerHTML = profileHTML;
    initProfileTabs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Fetch DailyMed in background
    if (typeof getFullDrugLabel === 'function') {
      getFullDrugLabel(dbResult.name || '').then(function(label) {
        if (!label) return;
        try {
          var enriched = renderDrugProfile(dbResult, localData, label, null, null);
          var mc2 = DOM.mainContent;
          if (mc2) { mc2.innerHTML = enriched; initProfileTabs(); }
        } catch(e2) {}
      }).catch(function() {});
    }
  } catch(err) {
    mc.innerHTML = '<div class="error-state"><h2>' + escapeHtml(dbResult.name || 'Drug') + '</h2><p>Error loading profile: ' + escapeHtml(String(err)) + '</p><button onclick="history.back()||renderHomePage()">Back</button></div>';
  }
}

// Suggestions
async function loadSuggestions(query) {
  if (!query || query.length < 2) { hideSuggestions(); return; }
  var results = [];
  try { results = await getSuggestions(query) || []; } catch(e) { return; }
  if (!results.length) { hideSuggestions(); return; }
  var box = document.getElementById('search-suggestions');
  if (!box) {
    box = document.createElement('div');
    box.id = 'search-suggestions';
    box.className = 'suggestions-dropdown';
    var inp = DOM.searchInput;
    if (inp && inp.parentNode) inp.parentNode.appendChild(box);
    else return;
  }
  box.innerHTML = results.map(function(r) {
    return '<div class="suggestion-item" onclick="performSearch(\'' + escapeAttr(r.name) + '\')"><span>' + escapeHtml(r.name) + '</span></div>';
  }).join('');
  box.style.display = 'block';
}

function hideSuggestions() {
  var box = document.getElementById('search-suggestions');
  if (box) box.style.display = 'none';
}

// Tabs
function initProfileTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(tab) {
    tab.addEventListener('click', function() { switchTab(tab.getAttribute('data-tab')); });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  var btn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
  var panel = document.getElementById('tab-' + tabName);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

// API Status
function updateApiStatus(status) {
  var dot = document.getElementById('api-status-dot');
  var label = document.getElementById('api-status-label');
  if (!dot || !label) return;
  if (status === 'online') {
    dot.style.background = '#00d4aa';
    dot.style.boxShadow = '0 0 8px #00d4aa';
    label.textContent = 'Online';
  } else {
    dot.style.background = '#e74c3c';
    label.textContent = 'Offline';
  }
}

// Toast
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 300); }, 3000);
}

// Home Page
function renderHomePage() {
  AppState.currentView = 'home';
  var mc = DOM.mainContent;
  if (!mc) return;
  mc.innerHTML = '<div class="home-container">' +
    '<div class="welcome-section"><h1>Welcome to PharmaScope Pro</h1><p class="subtitle">Your comprehensive clinical drug reference</p></div>' +
    '<div class="home-search-section"><div class="search-box-wrapper">' +
    '<input id="main-search-input" class="home-search-input" type="text" placeholder="Search by drug name, generic name, or drug class..." autocomplete="off" />' +
    '<button class="home-search-btn" id="home-search-btn">Search</button>' +
    '</div></div>' +
    '<div class="features-grid">' +
    '<div class="feature-card"><div class="feature-icon">&#128138;</div><h3>Drug Information</h3><p>Access comprehensive drug details from FDA and DailyMed</p></div>' +
    '<div class="feature-card"><div class="feature-icon">&#9888;</div><h3>Adverse Events</h3><p>Review reported adverse reactions and safety data</p></div>' +
    '<div class="feature-card"><div class="feature-icon">&#128300;</div><h3>Clinical Data</h3><p>Explore RxCUI codes and drug classifications</p></div>' +
    '<div class="feature-card"><div class="feature-icon">&#10024;</div><h3>AI Assistant</h3><p>Get instant answers with our Gemini-powered chatbot</p></div>' +
    '</div></div>';
  var homeInput = document.getElementById('main-search-input');
  var homeBtn   = document.getElementById('home-search-btn');
  if (homeInput) {
    homeInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') performSearch(homeInput.value); });
    homeInput.addEventListener('input',   function(e) { loadSuggestions(e.target.value); });
    homeInput.addEventListener('blur',    function()  { setTimeout(hideSuggestions, 150); });
    homeInput.addEventListener('focus',   function(e) { if (e.target.value.length >= 2) loadSuggestions(e.target.value); });
  }
  if (homeBtn) homeBtn.addEventListener('click', function() { var i = document.getElementById('main-search-input'); if (i) performSearch(i.value); });
}
