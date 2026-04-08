/**
 * PharmaScope Pro — Drug Card Component
 * Renders search result cards from openFDA data
 */

// Registry: stores raw FDA results by index for safe click handling
window._drugRegistry = [];

/**
 * Render a list of drug search result cards
 * @param {Array} results - Array of openFDA label results
 * @param {Function} onSelect - Callback when a card is clicked
 */
function renderDrugCards(results, onSelect) {
  if (!results || results.length === 0) {
    return `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>No drugs found</h3>
        <p>Try a different spelling or search by generic name (e.g., "acetaminophen" instead of "Tylenol")</p>
      </div>`;
  }

  // Store results in global registry for safe access
  window._drugRegistry = results;

  const cards = results.map((result, index) => {
    const info = extractCardInfo(result);
    return createDrugCard(info, index, onSelect);
  });

  return `<div class="drug-cards-grid">${cards.join('')}</div>`;
}

function extractCardInfo(result) {
  // DrugBank data mapping
  const indicationRaw = result.indication || '';
  const indication = indicationRaw.replace(/<[^>]+>/g, '').substring(0, 160).trim();

  return {
    brandName: result.name,
    genericName: result.brandNames && result.brandNames.length > 0 ? result.brandNames[0] : '',
    manufacturer: '',
    route: '',
    dosageForm: '',
    pharmClass: result.groups && result.groups.length > 0 ? result.groups[0] : 'Drug',
    rxcui: null,
    indication: indication ? indication + (indicationRaw.length > 160 ? '...' : '') : null,
    hasBlackBox: false,
    rawResult: result
  };
}

/**
 * Create a single drug card HTML element
 */
function createDrugCard(info, index, onSelect) {
  const localData = getDrugLocalData(info.genericName || info.brandName);
  const therapeuticClass = localData?.therapeuticClass || info.pharmClass || 'Pharmaceutical Agent';
  const classColor = getClassColor(therapeuticClass);
  const delay = index * 60;

  return `
    <div class="drug-card" 
         style="animation-delay: ${delay}ms"
         onclick="handleCardClick(${index})" 
         data-drug-name="${escapeAttr(info.brandName)}"
         role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')this.click()">
      
      <div class="drug-card-header">
        <div class="drug-class-badge" style="background: ${classColor}20; color: ${classColor}; border-color: ${classColor}40">
          ${getClassIcon(therapeuticClass)} ${therapeuticClass}
        </div>
        ${info.hasBlackBox ? '<div class="black-box-badge">⚠ BBW</div>' : ''}
      </div>

      <div class="drug-card-body">
        <h3 class="drug-card-brandname">${escapeHtml(info.brandName)}</h3>
        ${info.genericName ? `<p class="drug-card-genericname">${escapeHtml(info.genericName)}</p>` : ''}
        
        <div class="drug-card-meta">
          ${info.route ? `<span class="meta-tag">💊 ${escapeHtml(info.route)}</span>` : ''}
          ${info.dosageForm ? `<span class="meta-tag">📋 ${escapeHtml(info.dosageForm)}</span>` : ''}
          ${info.rxcui ? `<span class="meta-tag">🔬 RxCUI: ${info.rxcui}</span>` : ''}
        </div>

        ${info.indication ? `
          <div class="drug-card-indication">
            <span class="indication-label">Indications:</span>
            <p>${escapeHtml(info.indication)}</p>
          </div>` : ''}
      </div>

      <div class="drug-card-footer">
        <span class="manufacturer-name">🏭 ${escapeHtml(info.manufacturer)}</span>
        <button class="view-profile-btn">View Profile →</button>
      </div>
    </div>`;
}

/**
 * Render featured/popular drug pills for the homepage
 */
function renderFeaturedDrugs(onSelect) {
  const featured = [
    { name: 'Amoxicillin', icon: '💊', class: 'Antibiotic' },
    { name: 'Metformin', icon: '🩺', class: 'Antidiabetic' },
    { name: 'Lisinopril', icon: '❤️', class: 'ACE Inhibitor' },
    { name: 'Atorvastatin', icon: '🔬', class: 'Statin' },
    { name: 'Metoprolol', icon: '💓', class: 'Beta Blocker' },
    { name: 'Azithromycin', icon: '🦠', class: 'Macrolide' },
    { name: 'Omeprazole', icon: '🫃', class: 'PPI' },
    { name: 'Warfarin', icon: '🩸', class: 'Anticoagulant' },
    { name: 'Gabapentin', icon: '🧠', class: 'Anticonvulsant' },
    { name: 'Sertraline', icon: '🧘', class: 'SSRI' },
    { name: 'Levothyroxine', icon: '🦋', class: 'Thyroid Hormone' },
    { name: 'Furosemide', icon: '💧', class: 'Loop Diuretic' },
  ];

  return `
    <div class="featured-drugs">
      <h3 class="featured-title">Common Medications</h3>
      <div class="featured-pills">
        ${featured.map(d => `
          <button class="featured-pill" onclick="performSearch('${d.name}')">
            <span class="pill-icon">${d.icon}</span>
            <span class="pill-name">${d.name}</span>
            <span class="pill-class">${d.class}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

// Helper: assign colors by therapeutic class
function getClassColor(cls) {
  if (!cls) return '#00d4aa';
  const c = cls.toLowerCase();
  if (c.includes('antibiotic') || c.includes('antimicrobial')) return '#00d4aa';
  if (c.includes('anticoagulant') || c.includes('antiplatelet')) return '#e74c3c';
  if (c.includes('antihypertensive') || c.includes('ace') || c.includes('beta')) return '#3498db';
  if (c.includes('antidiabetic') || c.includes('insulin') || c.includes('biguanide')) return '#2ecc71';
  if (c.includes('statin') || c.includes('lipid')) return '#9b59b6';
  if (c.includes('ssri') || c.includes('antidepressant') || c.includes('neuro')) return '#e91e63';
  if (c.includes('analgesic') || c.includes('opioid') || c.includes('nsaid')) return '#ff5722';
  if (c.includes('proton pump') || c.includes('ppi') || c.includes('gi')) return '#ff9800';
  if (c.includes('steroid') || c.includes('corticosteroid')) return '#795548';
  if (c.includes('thyroid')) return '#00bcd4';
  if (c.includes('antifungal')) return '#8bc34a';
  if (c.includes('antiviral')) return '#607d8b';
  if (c.includes('calcium channel') || c.includes('dihydropyridine')) return '#f06292';
  if (c.includes('diuretic')) return '#26c6da';
  return '#00d4aa';
}

function getClassIcon(cls) {
  if (!cls) return '💊';
  const c = cls.toLowerCase();
  if (c.includes('antibiotic')) return '🦠';
  if (c.includes('anticoagulant') || c.includes('antiplatelet')) return '🩸';
  if (c.includes('antihypertensive') || c.includes('ace') || c.includes('beta')) return '❤️';
  if (c.includes('antidiabetic') || c.includes('biguanide')) return '🩺';
  if (c.includes('statin')) return '🔬';
  if (c.includes('ssri') || c.includes('antidepressant')) return '🧠';
  if (c.includes('analgesic') || c.includes('opioid')) return '💊';
  if (c.includes('ppi') || c.includes('gi')) return '🫃';
  if (c.includes('thyroid')) return '🦋';
  if (c.includes('diuretic')) return '💧';
  if (c.includes('bronch') || c.includes('respiratory')) return '🫁';
  return '💊';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
