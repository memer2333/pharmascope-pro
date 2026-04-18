/**
 * PharmaScope Pro — Drug Profile Renderer
 * Renders the full clinical profile page with all 5 modules.
 * DailyMed real-time label data is merged via parseFDALabel(fdaLabel, dailyMedLabel).
 */

/**
 * Main profile renderer — orchestrates all sections.
 * @param {object} fdaLabel       DrugBank JSON object
 * @param {object} localData      Curated local data (drugData.js) — highest priority for dosing tables
 * @param {object} dailyMedLabel  Live DailyMed SPL label from getFullDrugLabel()
 * @param {object} adverseEvents  openFDA adverse event counts
 * @param {Array}  interactions   RxNorm interaction list
 */
function renderDrugProfile(fdaLabel, localData, dailyMedLabel, adverseEvents, interactions) {
  // Merge DrugBank + DailyMed into one parsed object
  const parsed = parseFDALabel(fdaLabel, dailyMedLabel);
  if (!parsed) return '<div class="error-state">Failed to load drug profile.</div>';

  const drugName   = parsed.genericName !== 'Unknown' ? parsed.genericName : parsed.brandName;
  const hasBlackBox = !!(parsed.boxedWarning || localData?.blackBoxWarning);
  const isBeers     = !!(localData?.beersCriteria);
  const aeData      = parseAdverseEvents(adverseEvents);
  const classColor  = getClassColor(localData?.therapeuticClass || parsed.pharmClass[0] || '');

  return `
    <div class="drug-profile" id="drug-profile">

      ${renderProfileHeader(parsed, localData, classColor, hasBlackBox, isBeers)}

      ${hasBlackBox ? renderBlackBoxWarning(parsed.boxedWarning || localData?.blackBoxWarning) : ''}
      ${isBeers     ? renderBeersBanner(localData) : ''}

      <div class="profile-tabs-wrapper">
        <nav class="profile-tabs" role="tablist">
          <button class="tab-btn active" onclick="switchTab('general')"      data-tab="general"      role="tab">📋 General</button>
          <button class="tab-btn"        onclick="switchTab('dosing')"       data-tab="dosing"       role="tab">⚖️ Dosing</button>
          <button class="tab-btn"        onclick="switchTab('safety')"       data-tab="safety"       role="tab">
            🛡 Safety${hasBlackBox ? '<span class="tab-badge warn">BBW</span>' : ''}
          </button>
          <button class="tab-btn"        onclick="switchTab('pharmacology')" data-tab="pharmacology" role="tab">🔬 ADME</button>
          <button class="tab-btn"        onclick="switchTab('interactions')" data-tab="interactions" role="tab">⚡ Interactions</button>
          <button class="tab-btn"        onclick="switchTab('adverse')"      data-tab="adverse"      role="tab">📊 Adverse Events</button>
          <button class="tab-btn"        onclick="switchTab('calculators')"  data-tab="calculators"  role="tab">🧮 Calculators</button>
        </nav>

        <div class="tab-panels">
          ${renderGeneralTab(parsed, localData)}
          ${renderDosingTab(parsed, localData)}
          ${renderSafetyTab(parsed, localData)}
          ${renderPharmacologyTab(parsed, localData)}
          ${renderInteractionsTab(parsed, localData, interactions)}
          ${renderAdverseEventsTab(aeData, parsed)}
          ${renderCalculatorsTab(localData, drugName)}
        </div>
      </div>
    </div>`;
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function renderProfileHeader(parsed, localData, classColor, hasBlackBox, isBeers) {
  const therapeuticClass = localData?.therapeuticClass || parsed.pharmClass[0] || 'Pharmaceutical Agent';
  const sourceTag = parsed._dailyMedLoaded
    ? `<span class="profile-meta-tag dm-tag" title="Dosing & safety data sourced from NIH DailyMed">📡 DailyMed Live</span>`
    : '';
  return `
    <div class="profile-header" style="--accent: ${classColor}">
      <div class="profile-header-left">
        <div class="drug-class-chip" style="background:${classColor}20;color:${classColor};border:1px solid ${classColor}40">
          ${getClassIcon(therapeuticClass)} ${therapeuticClass}
        </div>
        <h1 class="profile-brand-name">${escapeHtml(parsed.brandName)}</h1>
        <p class="profile-generic-name">${escapeHtml(parsed.genericName)}</p>
        <div class="profile-meta-row">
          ${parsed.route      ? `<span class="profile-meta-tag">💊 ${parsed.route}</span>`              : ''}
          ${parsed.dosageForm ? `<span class="profile-meta-tag">📋 ${parsed.dosageForm}</span>`         : ''}
          ${parsed.rxcui      ? `<span class="profile-meta-tag">🔬 RxCUI: ${parsed.rxcui}</span>`      : ''}
          ${isBeers           ? `<span class="profile-meta-tag beers-tag">🔶 Beers Criteria</span>`    : ''}
          ${hasBlackBox       ? `<span class="profile-meta-tag bbw-tag">⚠ Black Box Warning</span>`   : ''}
          ${sourceTag}
        </div>
      </div>
      <div class="profile-header-right">
        <div class="drug-icon-large" style="color:${classColor}">${getClassIcon(therapeuticClass)}</div>
        <div class="manufacturer-info">
          <span class="mfr-label">Data Source</span>
          <span class="mfr-name">${escapeHtml(parsed.manufacturer)}</span>
        </div>
      </div>
    </div>`;
}

// ─── BLACK BOX WARNING ────────────────────────────────────────────────────────
function renderBlackBoxWarning(warningText) {
  const text = warningText || 'See prescribing information for complete black box warning details.';
  return `
    <div class="black-box-warning" id="bbw-banner">
      <div class="bbw-header">
        <span class="bbw-icon">⚠</span>
        <span class="bbw-title">BLACK BOX WARNING — FDA</span>
        <span class="bbw-icon">⚠</span>
      </div>
      <div class="bbw-text">${formatTextToList(text, 8)}</div>
    </div>`;
}

// ─── BEERS BANNER ─────────────────────────────────────────────────────────────
function renderBeersBanner(localData) {
  return `
    <div class="beers-banner">
      <div class="beers-header">🔶 AGS Beers Criteria — Potentially Inappropriate in Older Adults (≥65 years)</div>
      <p>${escapeHtml(localData.beersNote || 'Use with caution in geriatric patients. See Beers Criteria guidelines.')}</p>
    </div>`;
}

// ─── TAB 1: GENERAL ───────────────────────────────────────────────────────────
function renderGeneralTab(parsed, localData) {
  const moa         = localData?.mechanismOfAction || parsed.mechanismOfAction;
  const indications = parsed.indications;
  return `
    <div class="tab-panel active" id="tab-general" role="tabpanel">
      <div class="panel-grid two-col">

        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">🎯</span> Indications &amp; Usage</h3>
          <div class="card-content">${formatTextToList(indications, 15)}</div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🔬</span> Mechanism of Action</h3>
          <div class="card-content">
            ${moa
              ? `<p class="moa-text">${highlightKeyTerms(escapeHtml(moa))}</p>`
              : formatTextToList(parsed.clinicalPharmacology, 8)}
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">💊</span> Drug Class &amp; Identifiers</h3>
          <div class="card-content">
            ${localData ? `
              <div class="pk-grid">
                <div class="pk-item"><span class="pk-label">Generic Name</span><span class="pk-value">${escapeHtml(localData.genericName)}</span></div>
                <div class="pk-item"><span class="pk-label">Brand Names</span><span class="pk-value">${(localData.brandNames || []).join(', ')}</span></div>
                <div class="pk-item"><span class="pk-label">Therapeutic Class</span><span class="pk-value">${escapeHtml(localData.therapeuticClass)}</span></div>
                <div class="pk-item"><span class="pk-label">Route</span><span class="pk-value">${escapeHtml(parsed.route || 'N/A')}</span></div>
                <div class="pk-item"><span class="pk-label">Dosage Form</span><span class="pk-value">${escapeHtml(parsed.dosageForm || 'N/A')}</span></div>
                ${parsed.rxcui ? `<div class="pk-item"><span class="pk-label">RxCUI</span><span class="pk-value">${parsed.rxcui}</span></div>` : ''}
              </div>` : '<p class="no-data">Identifier data not available in local database.</p>'}
          </div>
        </div>

        ${parsed.useInPregnancy || parsed.useInLactation ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🤰</span> Pregnancy &amp; Lactation</h3>
          <div class="card-content">
            ${parsed.useInPregnancy  ? `<h4>Pregnancy</h4>${formatTextToList(parsed.useInPregnancy, 6)}`             : ''}
            ${parsed.useInLactation  ? `<h4>Lactation / Breastfeeding</h4>${formatTextToList(parsed.useInLactation, 4)}` : ''}
          </div>
        </div>` : ''}

        ${parsed.storage ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">📦</span> Storage &amp; Handling</h3>
          <div class="card-content">${formatTextToList(parsed.storage, 5)}</div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 2: DOSING ────────────────────────────────────────────────────────────
function renderDosingTab(parsed, localData) {
  // Priority for adult dosing:
  //   1. localData.adultDosing  (curated structured table — 16 drugs)
  //   2. parsed.dosage          (DailyMed "Dosage & Administration" section — all other drugs)
  const hasCuratedAdult    = !!(localData?.adultDosing?.length);
  const hasCuratedPediatric = !!(localData?.pediatricDosing?.length);
  const hasCuratedRenal    = !!(localData?.renalDosing?.length);
  const hasDailyMedDosing  = !!(parsed.dosage);
  const hasDailyMedPed     = !!(parsed.pediatricUse);
  const hasDailyMedGeri    = !!(parsed.geriatricUse);
  const noDosingAtAll      = !hasCuratedAdult && !hasDailyMedDosing;

  return `
    <div class="tab-panel" id="tab-dosing" role="tabpanel">
      <div class="panel-grid">

        ${noDosingAtAll ? `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">👤</span> Dosage &amp; Administration</h3>
          <div class="card-content">
            <p class="no-data">Dosing information not available from DailyMed for this drug. Consult official prescribing information or a clinical pharmacist.</p>
          </div>
        </div>` : ''}

        ${hasCuratedAdult ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">👤</span> Standard Adult Dosing</h3>
          <div class="card-content">
            <table class="dosing-table">
              <thead><tr><th>Indication</th><th>Dose</th><th>Details</th></tr></thead>
              <tbody>
                ${localData.adultDosing.map(d => `
                  <tr>
                    <td class="indication-cell">${escapeHtml(d.indication)}</td>
                    <td class="dose-cell">${escapeHtml(d.dose)}</td>
                    <td>${d.maxDose ? `Max: <strong>${escapeHtml(d.maxDose)}</strong>` : ''}${d.duration ? ` • ${escapeHtml(d.duration)}` : ''}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : hasDailyMedDosing ? `
        <div class="info-card full-width">
          <h3 class="card-title">
            <span class="card-icon">👤</span> Dosage &amp; Administration
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">${formatTextToList(parsed.dosage, 20)}</div>
        </div>` : ''}

        ${hasCuratedPediatric ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">👶</span> Pediatric Dosing</h3>
          <div class="card-content">
            <table class="dosing-table">
              <thead><tr><th>Indication</th><th>Dose (mg/kg)</th><th>Age / Max Dose</th></tr></thead>
              <tbody>
                ${localData.pediatricDosing.map(d => `
                  <tr>
                    <td class="indication-cell">${escapeHtml(d.indication)}</td>
                    <td class="dose-cell">${escapeHtml(d.dose)}</td>
                    <td>
                      ${d.ageRange ? `<span class="age-badge">${escapeHtml(d.ageRange)}</span>` : ''}
                      ${d.maxDose  ? `<br>Max: <strong>${escapeHtml(d.maxDose)}</strong>` : ''}
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : hasDailyMedPed ? `
        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">👶</span> Pediatric Use
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">${formatTextToList(parsed.pediatricUse, 10)}</div>
        </div>` : ''}

        ${hasCuratedRenal ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🫘</span> Renal Dose Adjustments (CrCl-based)</h3>
          <div class="card-content">
            <div class="renal-table-wrapper">
              <table class="dosing-table renal-table">
                <thead><tr><th>CrCl (mL/min)</th><th>Recommended Adjustment</th></tr></thead>
                <tbody>
                  ${localData.renalDosing.map(r => `
                    <tr class="${getRenalRowClass(r.crcl)}">
                      <td class="crcl-cell">${escapeHtml(r.crcl)}</td>
                      <td>${highlightKeyTerms(escapeHtml(r.adjustment))}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div class="renal-calc-prompt">
              💡 <strong>Calculate CrCl</strong> using the
              <button class="inline-link" onclick="switchTab('calculators')">Calculators Tab →</button>
            </div>
          </div>
        </div>` : ''}

        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">👴</span> Geriatric Dosing Considerations
            ${!localData?.geriatricDosing && hasDailyMedGeri ? '<span class="source-badge dm-badge">📡 DailyMed</span>' : ''}
          </h3>
          <div class="card-content">
            ${localData?.geriatricDosing
              ? `<p class="geri-text">${highlightKeyTerms(escapeHtml(localData.geriatricDosing))}</p>`
              : hasDailyMedGeri
                ? formatTextToList(parsed.geriatricUse, 8)
                : '<p class="no-data">No specific geriatric dosing data available.</p>'}
          </div>
        </div>

        ${parsed.overdosage ? `
        <div class="info-card warn-card">
          <h3 class="card-title"><span class="card-icon">🚨</span> Overdosage Management</h3>
          <div class="card-content">${formatTextToList(parsed.overdosage, 10)}</div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 3: SAFETY ────────────────────────────────────────────────────────────
function renderSafetyTab(parsed, localData) {
  const contraindicationText = parsed.contraindications
    || (localData?.contraindications ? '• ' + localData.contraindications.join('\n• ') : null);

  return `
    <div class="tab-panel" id="tab-safety" role="tabpanel">
      <div class="panel-grid">

        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">🚫</span> Contraindications
            ${parsed.contraindications && !localData?.contraindications ? '<span class="source-badge dm-badge">📡 DailyMed</span>' : ''}
          </h3>
          <div class="card-content">
            ${localData?.contraindications ? `
              <ul class="fda-list">
                ${localData.contraindications.map(c => `<li><span class="hl-warn">${escapeHtml(c)}</span></li>`).join('')}
              </ul>` : formatTextToList(contraindicationText, 12)}
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">⚠️</span> Warnings &amp; Precautions
            ${parsed.warnings ? '<span class="source-badge dm-badge">📡 DailyMed</span>' : ''}
          </h3>
          <div class="card-content">${formatTextToList(parsed.warnings, 15)}</div>
        </div>

        ${parsed.adverseReactions ? `
        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">🔴</span> Adverse Reactions (Label)
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">${formatTextToList(parsed.adverseReactions, 12)}</div>
        </div>` : ''}

        ${localData?.keyInteractions ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">⚡</span> Key Drug Interactions</h3>
          <div class="card-content">
            <ul class="fda-list">
              ${localData.keyInteractions.map(i => `<li>${highlightKeyTerms(escapeHtml(i))}</li>`).join('')}
            </ul>
          </div>
        </div>` : parsed.drugInteractions ? `
        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">⚡</span> Drug Interactions
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">${formatTextToList(parsed.drugInteractions, 12)}</div>
        </div>` : ''}

        ${parsed.useInPregnancy ? `
        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">🤰</span> Use in Specific Populations
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">
            <h4>Pregnancy</h4>${formatTextToList(parsed.useInPregnancy, 6)}
            ${parsed.useInLactation ? `<h4>Lactation</h4>${formatTextToList(parsed.useInLactation, 4)}` : ''}
          </div>
        </div>` : ''}

        ${localData?.blackBoxWarning ? `
        <div class="info-card warn-card">
          <h3 class="card-title"><span class="card-icon">⬛</span> Black Box Warning</h3>
          <div class="card-content"><p class="geri-text">${highlightKeyTerms(escapeHtml(localData.blackBoxWarning))}</p></div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 4: PHARMACOLOGY / ADME ───────────────────────────────────────────────
function renderPharmacologyTab(parsed, localData) {
  // PK params: curated local > extracted from DailyMed PK text
  const pkExtracted    = extractPKParams(parsed.pharmacokinetics || parsed.clinicalPharmacology || '');
  const proteinBinding = localData?.proteinBinding || pkExtracted.proteinBinding;
  const halfLife       = localData?.halfLife        || pkExtracted.halfLife;
  const vd             = localData?.volumeOfDistribution || pkExtracted.volumeOfDistribution;
  const bioavail       = localData?.bioavailability;
  const cyp            = localData?.cyp450;
  const excretion      = localData?.excretion       || parsed.excretion;

  // ADME text blocks: curated local > DailyMed parsed
  const absorptionText  = localData?.bioavailability || parsed.absorption;
  const distributionText = (localData?.volumeOfDistribution || vd)
    ? `VD: ${escapeHtml(localData?.volumeOfDistribution || vd)} | Protein Binding: ${escapeHtml(localData?.proteinBinding || proteinBinding || 'N/A')}`
    : parsed.distribution ? parsed.distribution : null;
  const metabolismText  = localData?.cyp450 || parsed.metabolism;
  const excretionText   = localData?.excretion || parsed.excretion;

  const hasADME = absorptionText || distributionText || metabolismText || excretionText;
  const hasPKCards = proteinBinding || halfLife || vd || bioavail || cyp || excretion;

  return `
    <div class="tab-panel" id="tab-pharmacology" role="tabpanel">
      <div class="panel-grid">

        ${hasPKCards ? `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">📊</span> Pharmacokinetic Parameters</h3>
          <div class="card-content">
            <div class="pk-grid large">
              ${proteinBinding ? `<div class="pk-stat-card"><div class="pk-stat-value">${escapeHtml(proteinBinding)}</div><div class="pk-stat-label">Protein Binding</div></div>` : ''}
              ${halfLife       ? `<div class="pk-stat-card"><div class="pk-stat-value">${escapeHtml(halfLife)}</div><div class="pk-stat-label">Half-Life (t½)</div></div>` : ''}
              ${vd             ? `<div class="pk-stat-card"><div class="pk-stat-value">${escapeHtml(vd)}</div><div class="pk-stat-label">Volume of Distribution</div></div>` : ''}
              ${bioavail       ? `<div class="pk-stat-card"><div class="pk-stat-value">${escapeHtml(bioavail)}</div><div class="pk-stat-label">Oral Bioavailability</div></div>` : ''}
              ${excretion      ? `<div class="pk-stat-card"><div class="pk-stat-value">${escapeHtml(excretion.split('—')[0].trim())}</div><div class="pk-stat-label">Primary Excretion</div></div>` : ''}
            </div>
          </div>
        </div>` : ''}

        ${cyp ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🧪</span> CYP450 Metabolism</h3>
          <div class="card-content">
            <div class="cyp-info">
              ${renderCYPBadges(cyp)}
              <p class="cyp-description">${highlightKeyTerms(escapeHtml(cyp))}</p>
            </div>
          </div>
        </div>` : parsed.metabolism ? `
        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">🧪</span> Metabolism
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">${formatTextToList(parsed.metabolism, 8)}</div>
        </div>` : ''}

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🔬</span> Clinical Pharmacology</h3>
          <div class="card-content">${formatTextToList(parsed.clinicalPharmacology, 12)}</div>
        </div>

        ${parsed.pharmacokinetics ? `
        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">📈</span> Detailed Pharmacokinetics
            ${parsed._dailyMedLoaded ? '<span class="source-badge dm-badge">📡 DailyMed</span>' : ''}
          </h3>
          <div class="card-content">${formatTextToList(parsed.pharmacokinetics, 15)}</div>
        </div>` : ''}

        ${hasADME ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🔄</span> ADME Summary</h3>
          <div class="card-content">
            <div class="adme-grid">
              <div class="adme-section">
                <div class="adme-label">🟢 Absorption</div>
                <p>${escapeHtml(absorptionText || 'See full prescribing information')}</p>
              </div>
              <div class="adme-section">
                <div class="adme-label">🔵 Distribution</div>
                <p>${distributionText ? escapeHtml(distributionText) : 'See full prescribing information'}</p>
              </div>
              <div class="adme-section">
                <div class="adme-label">🟡 Metabolism</div>
                <p>${escapeHtml(metabolismText || 'See prescribing information')}</p>
              </div>
              <div class="adme-section">
                <div class="adme-label">🔴 Excretion</div>
                <p>${escapeHtml(excretionText || 'See prescribing information')}</p>
              </div>
            </div>
          </div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 5: INTERACTIONS ──────────────────────────────────────────────────────
function renderInteractionsTab(parsed, localData, interactions) {
  const localInteractions = localData?.keyInteractions || [];
  const fdaInteractions   = parsed.drugInteractions;

  return `
    <div class="tab-panel" id="tab-interactions" role="tabpanel">
      <div class="panel-grid">

        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">🔍</span> Drug Interaction Checker</h3>
          <div class="card-content">
            <div class="interaction-checker">
              <div id="interaction-inputs" style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:0.8rem;">
                <input type="text" class="interaction-input multi-drug-target" placeholder="Drug 1 (e.g., Warfarin)" />
                <input type="text" class="interaction-input multi-drug-target" placeholder="Drug 2 (e.g., Aspirin)" />
              </div>
              <div style="display:flex;gap:0.5rem;">
                <button class="btn-secondary" onclick="window.addInteractionField()" style="background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);padding:0.4rem 0.8rem;border-radius:4px;font-weight:600;cursor:pointer;">+ Add Drug</button>
                <button class="btn-primary" onclick="checkInteractions()" style="flex:1;">Check Interactions</button>
              </div>
              <div id="interaction-results" class="interaction-results" style="margin-top:1rem;"></div>
            </div>
          </div>
        </div>

        ${localInteractions.length > 0 ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">⚡</span> Key Drug Interactions (Curated)</h3>
          <div class="card-content">
            <ul class="fda-list">
              ${localInteractions.map(i => `<li>${highlightKeyTerms(escapeHtml(i))}</li>`).join('')}
            </ul>
          </div>
        </div>` : fdaInteractions ? `
        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">⚡</span> Drug Interactions (Label)
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">${formatTextToList(fdaInteractions, 15)}</div>
        </div>` : ''}

        ${interactions && interactions.length > 0 ? `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">🔗</span> RxNorm Interaction Database</h3>
          <div class="card-content">
            ${interactions.map(inter => `
              <div class="interaction-result-card" style="border-left:3px solid ${inter.severityColor};padding:0.8rem;margin-bottom:0.6rem;background:var(--bg-secondary);border-radius:4px;">
                <div class="interaction-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                  <span style="font-weight:600;">${escapeHtml(inter.drug1)} ↔ ${escapeHtml(inter.drug2)}</span>
                  <span style="background:${inter.severityColor}20;color:${inter.severityColor};border:1px solid ${inter.severityColor}40;padding:0.1rem 0.5rem;border-radius:99px;font-size:0.75rem;font-weight:600;">${escapeHtml(inter.severity)}</span>
                </div>
                <p style="font-size:0.85rem;color:var(--text-secondary);">${highlightKeyTerms(escapeHtml(inter.description))}</p>
              </div>`).join('')}
          </div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 6: ADVERSE EVENTS ────────────────────────────────────────────────────
function renderAdverseEventsTab(aeData, parsed) {
  return `
    <div class="tab-panel" id="tab-adverse" role="tabpanel">
      <div class="panel-grid">

        ${aeData && aeData.length > 0 ? `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">📊</span> Top Reported Adverse Events (openFDA FAERS)</h3>
          <div class="card-content">
            <div class="ae-list">
              ${aeData.map((ae, i) => `
                <div class="ae-item">
                  <span class="ae-rank">${i + 1}</span>
                  <span class="ae-term">${escapeHtml(ae.term)}</span>
                  <div class="ae-bar-wrap">
                    <div class="ae-bar" style="width:${ae.percent}%"></div>
                  </div>
                  <span class="ae-pct">${ae.percent}%</span>
                  <span class="ae-count">(${ae.count.toLocaleString()})</span>
                </div>`).join('')}
            </div>
            <p class="ae-footnote">Source: FDA Adverse Event Reporting System (FAERS). Frequency does not imply causation.</p>
          </div>
        </div>` : `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">📊</span> Adverse Event Reports</h3>
          <div class="card-content"><p class="no-data">No adverse event data available from openFDA FAERS for this drug.</p></div>
        </div>`}

        ${parsed.adverseReactions ? `
        <div class="info-card full-width">
          <h3 class="card-title">
            <span class="card-icon">🔴</span> Adverse Reactions from Prescribing Label
            <span class="source-badge dm-badge">📡 DailyMed</span>
          </h3>
          <div class="card-content">${formatTextToList(parsed.adverseReactions, 20)}</div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 7: CALCULATORS ───────────────────────────────────────────────────────
function renderCalculatorsTab(localData, drugName) {
  return `
    <div class="tab-panel" id="tab-calculators" role="tabpanel">
      <div class="panel-grid">

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🫘</span> Creatinine Clearance (Cockcroft-Gault)</h3>
          <div class="card-content">
            <div class="calc-form">
              <div class="calc-row">
                <label>Age (years)</label>
                <input type="number" id="renal-age" placeholder="e.g. 65" min="1" max="120" />
              </div>
              <div class="calc-row">
                <label>Weight (kg)</label>
                <input type="number" id="renal-weight" placeholder="e.g. 70" min="1" max="300" />
              </div>
              <div class="calc-row">
                <label>Serum Creatinine (mg/dL)</label>
                <input type="number" id="renal-scr" placeholder="e.g. 1.2" step="0.1" min="0.1" max="20" />
              </div>
              <div class="calc-row">
                <label>Sex</label>
                <select id="renal-sex">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <button class="btn-primary calc-btn" onclick="runRenalCalc()">Calculate CrCl</button>
            </div>
            <div id="renal-result" class="calc-result"></div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">👶</span> Pediatric Dose Calculator (mg/kg)</h3>
          <div class="card-content">
            <div class="calc-form">
              <div class="calc-row">
                <label>Weight (kg)</label>
                <input type="number" id="ped-weight" placeholder="e.g. 20" min="0.5" max="150" />
              </div>
              <div class="calc-row">
                <label>Dose (mg/kg)</label>
                <input type="number" id="ped-dose" placeholder="e.g. 25" step="0.1" min="0.01" max="500" />
              </div>
              <div class="calc-row">
                <label>Max Single Dose (mg) — optional</label>
                <input type="number" id="ped-maxdose" placeholder="e.g. 500" min="1" max="5000" />
              </div>
              <div class="calc-row">
                <label>Frequency</label>
                <select id="ped-freq">
                  <option value="once daily">Once daily (QD)</option>
                  <option value="twice daily">Twice daily (BID)</option>
                  <option value="three times daily">Three times daily (TID)</option>
                  <option value="four times daily">Four times daily (QID)</option>
                  <option value="every 8 hours">Every 8 hours (Q8H)</option>
                  <option value="every 6 hours">Every 6 hours (Q6H)</option>
                </select>
              </div>
              <button class="btn-primary calc-btn" onclick="runPedCalc()">Calculate Dose</button>
            </div>
            <div id="ped-result" class="calc-result"></div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">⚖️</span> BMI Calculator</h3>
          <div class="card-content">
            <div class="calc-form">
              <div class="calc-row">
                <label>Weight (kg)</label>
                <input type="number" id="bmi-weight" placeholder="e.g. 70" min="1" max="500" />
              </div>
              <div class="calc-row">
                <label>Height (cm)</label>
                <input type="number" id="bmi-height" placeholder="e.g. 170" min="50" max="250" />
              </div>
              <button class="btn-primary calc-btn" onclick="runBMICalc()">Calculate BMI</button>
            </div>
            <div id="bmi-result" class="calc-result"></div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">📏</span> Ideal Body Weight (Devine)</h3>
          <div class="card-content">
            <div class="calc-form">
              <div class="calc-row">
                <label>Height (cm)</label>
                <input type="number" id="ibw-height" placeholder="e.g. 170" min="50" max="250" />
              </div>
              <div class="calc-row">
                <label>Sex</label>
                <select id="ibw-sex">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <button class="btn-primary calc-btn" onclick="runIBWCalc()">Calculate IBW</button>
            </div>
            <div id="ibw-result" class="calc-result"></div>
          </div>
        </div>

      </div>
    </div>`;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getRenalRowClass(crcl) {
  const c = String(crcl).toLowerCase();
  if (c.includes('hd') || c.includes('esrd') || c === '<10' || c === '<15') return 'renal-danger';
  if (c.includes('<30') || c.includes('10-') || c.includes('10–')) return 'renal-warn';
  return '';
}

function getClassColor(cls) {
  const c = (cls || '').toLowerCase();
  if (c.includes('antibiotic') || c.includes('antimicrobial') || c.includes('antifungal') || c.includes('antiviral')) return '#e74c3c';
  if (c.includes('antihypertensive') || c.includes('ace') || c.includes('arb') || c.includes('calcium channel') || c.includes('beta')) return '#3498db';
  if (c.includes('anticoagulant') || c.includes('antiplatelet') || c.includes('thrombolytic')) return '#e67e22';
  if (c.includes('antidiabetic') || c.includes('insulin') || c.includes('biguanide') || c.includes('glp')) return '#27ae60';
  if (c.includes('statin') || c.includes('antilipemic') || c.includes('hmg')) return '#9b59b6';
  if (c.includes('antidepressant') || c.includes('ssri') || c.includes('snri') || c.includes('anxiolytic')) return '#1abc9c';
  if (c.includes('analgesic') || c.includes('opioid') || c.includes('nsaid')) return '#e74c3c';
  if (c.includes('steroid') || c.includes('corticosteroid') || c.includes('immunosuppressant')) return '#f39c12';
  if (c.includes('diuretic')) return '#16a085';
  if (c.includes('antipsychotic') || c.includes('neuroleptic')) return '#8e44ad';
  if (c.includes('thyroid')) return '#2ecc71';
  if (c.includes('respiratory') || c.includes('bronchod')) return '#5dade2';
  return '#7f8c8d';
}

function getClassIcon(cls) {
  const c = (cls || '').toLowerCase();
  if (c.includes('antibiotic') || c.includes('antimicrobial') || c.includes('antifungal') || c.includes('antiviral')) return '🦠';
  if (c.includes('antihypertensive') || c.includes('ace') || c.includes('arb') || c.includes('calcium') || c.includes('beta')) return '❤️';
  if (c.includes('anticoagulant') || c.includes('antiplatelet')) return '🩸';
  if (c.includes('antidiabetic') || c.includes('insulin') || c.includes('biguanide')) return '💉';
  if (c.includes('statin') || c.includes('antilipemic')) return '🫀';
  if (c.includes('antidepressant') || c.includes('ssri') || c.includes('snri') || c.includes('anxiolytic')) return '🧠';
  if (c.includes('analgesic') || c.includes('opioid') || c.includes('nsaid')) return '💊';
  if (c.includes('steroid') || c.includes('corticosteroid')) return '⚗️';
  if (c.includes('diuretic')) return '💧';
  if (c.includes('thyroid')) return '🦋';
  if (c.includes('respiratory') || c.includes('bronchod')) return '🫁';
  return '💊';
}

function renderCYPBadges(cypText) {
  const enzymes = [];
  const matches = (cypText || '').matchAll(/CYP\s*(\d[A-Z]\d+(?:\.\d+)?)/gi);
  for (const m of matches) enzymes.push(`CYP${m[1].toUpperCase()}`);
  const unique = [...new Set(enzymes)];
  if (unique.length === 0) return '';
  return `<div class="cyp-badges">${unique.map(e => `<span class="cyp-badge">${e}</span>`).join('')}</div>`;
}
