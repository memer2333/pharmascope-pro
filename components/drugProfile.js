/**
 * PharmaScope Pro — Drug Profile Renderer
 * Renders the full clinical profile page with all 5 modules
 */

/**
 * Main profile renderer — orchestrates all sections
 */
function renderDrugProfile(fdaLabel, localData, adverseEvents, interactions) {
  const parsed = parseFDALabel(fdaLabel);
  if (!parsed) return '<div class="error-state">Failed to load drug profile.</div>';

  const drugName = parsed.genericName !== 'Unknown' ? parsed.genericName : parsed.brandName;
  const hasBlackBox = !!(parsed.boxedWarning || (localData && localData.blackBoxWarning));
  const isBeers = !!(localData && localData.beersCriteria);
  const aeData = parseAdverseEvents(adverseEvents);
  const classColor = getClassColor(localData?.therapeuticClass || parsed.pharmClass[0] || '');

  return `
    <div class="drug-profile" id="drug-profile">
      
      ${renderProfileHeader(parsed, localData, classColor, hasBlackBox, isBeers)}
      
      ${hasBlackBox ? renderBlackBoxWarning(parsed.boxedWarning || localData?.blackBoxWarning) : ''}
      ${isBeers ? renderBeersBanner(localData) : ''}

      <div class="profile-tabs-wrapper">
        <nav class="profile-tabs" role="tablist">
          <button class="tab-btn active" onclick="switchTab('general')" data-tab="general" role="tab">
            📋 General
          </button>
          <button class="tab-btn" onclick="switchTab('dosing')" data-tab="dosing" role="tab">
            ⚖️ Dosing
          </button>
          <button class="tab-btn" onclick="switchTab('safety')" data-tab="safety" role="tab">
            🛡 Safety
            ${hasBlackBox ? '<span class="tab-badge warn">BBW</span>' : ''}
          </button>
          <button class="tab-btn" onclick="switchTab('pharmacology')" data-tab="pharmacology" role="tab">
            🔬 ADME
          </button>
          <button class="tab-btn" onclick="switchTab('interactions')" data-tab="interactions" role="tab">
            ⚡ Interactions
          </button>
          <button class="tab-btn" onclick="switchTab('adverse')" data-tab="adverse" role="tab">
            📊 Adverse Events
          </button>
          <button class="tab-btn" onclick="switchTab('calculators')" data-tab="calculators" role="tab">
            🧮 Calculators
          </button>
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
  const therapeuticClass = localData?.therapeuticClass || (parsed.pharmClass[0]) || 'Pharmaceutical Agent';
  return `
    <div class="profile-header" style="--accent: ${classColor}">
      <div class="profile-header-left">
        <div class="drug-class-chip" style="background: ${classColor}20; color: ${classColor}; border: 1px solid ${classColor}40">
          ${getClassIcon(therapeuticClass)} ${therapeuticClass}
        </div>
        <h1 class="profile-brand-name">${escapeHtml(parsed.brandName)}</h1>
        <p class="profile-generic-name">${escapeHtml(parsed.genericName)}</p>
        <div class="profile-meta-row">
          ${parsed.route ? `<span class="profile-meta-tag">💊 ${parsed.route}</span>` : ''}
          ${parsed.dosageForm ? `<span class="profile-meta-tag">📋 ${parsed.dosageForm}</span>` : ''}
          ${parsed.rxcui ? `<span class="profile-meta-tag">🔬 RxCUI: ${parsed.rxcui}</span>` : ''}
          ${isBeers ? `<span class="profile-meta-tag beers-tag">🔶 Beers Criteria</span>` : ''}
          ${hasBlackBox ? `<span class="profile-meta-tag bbw-tag">⚠ Black Box Warning</span>` : ''}
        </div>
      </div>
      <div class="profile-header-right">
        <div class="drug-icon-large" style="color: ${classColor}">${getClassIcon(therapeuticClass)}</div>
        <div class="manufacturer-info">
          <span class="mfr-label">Manufacturer</span>
          <span class="mfr-name">${escapeHtml(parsed.manufacturer)}</span>
        </div>
      </div>
    </div>`;
}

// ─── BLACK BOX WARNING ─────────────────────────────────────────────────────────
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

// ─── BEERS CRITERIA BANNER ─────────────────────────────────────────────────────
function renderBeersBanner(localData) {
  return `
    <div class="beers-banner">
      <div class="beers-header">🔶 AGS Beers Criteria — Potentially Inappropriate in Older Adults (≥65 years)</div>
      <p>${escapeHtml(localData.beersNote || 'Use with caution in geriatric patients. See Beers Criteria guidelines.')}</p>
    </div>`;
}

// ─── TAB 1: GENERAL INFO ───────────────────────────────────────────────────────
function renderGeneralTab(parsed, localData) {
  const moa = localData?.mechanismOfAction || parsed.mechanismOfAction;
  const indications = parsed.indications;
  return `
    <div class="tab-panel active" id="tab-general" role="tabpanel">
      <div class="panel-grid two-col">
        
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">🎯</span> Indications & Usage</h3>
          <div class="card-content">${formatTextToList(indications, 15)}</div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🔬</span> Mechanism of Action</h3>
          <div class="card-content">${moa ? `<p class="moa-text">${highlightKeyTerms(escapeHtml(moa))}</p>` : formatTextToList(parsed.clinicalPharmacology, 8)}</div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">💊</span> Drug Class & Identifiers</h3>
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
          <h3 class="card-title"><span class="card-icon">🤰</span> Pregnancy & Lactation</h3>
          <div class="card-content">
            ${parsed.useInPregnancy ? `<h4>Pregnancy</h4>${formatTextToList(parsed.useInPregnancy, 6)}` : ''}
            ${parsed.useInLactation ? `<h4>Lactation / Breastfeeding</h4>${formatTextToList(parsed.useInLactation, 4)}` : ''}
          </div>
        </div>` : ''}

        ${parsed.storage ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">📦</span> Storage & Handling</h3>
          <div class="card-content">${formatTextToList(parsed.storage, 5)}</div>
        </div>` : ''}
      </div>
    </div>`;
}

// ─── TAB 2: DOSING ─────────────────────────────────────────────────────────────
function renderDosingTab(parsed, localData) {
  return `
    <div class="tab-panel" id="tab-dosing" role="tabpanel">
      <div class="panel-grid">

        ${localData?.adultDosing ? `
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
                    <td>${d.maxDose ? `Max: <strong>${d.maxDose}</strong>` : ''}${d.duration ? ` • ${d.duration}` : ''}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : parsed.dosage ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">👤</span> Dosage & Administration</h3>
          <div class="card-content">${formatTextToList(parsed.dosage, 12)}</div>
        </div>` : ''}

        ${localData?.pediatricDosing ? `
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
                      ${d.ageRange ? `<span class="age-badge">${d.ageRange}</span>` : ''}
                      ${d.maxDose ? `<br>Max: <strong>${d.maxDose}</strong>` : ''}
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : parsed.pediatricUse ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">👶</span> Pediatric Use</h3>
          <div class="card-content">${formatTextToList(parsed.pediatricUse, 8)}</div>
        </div>` : ''}

        ${localData?.renalDosing ? `
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
              💡 <strong>Calculate CrCl</strong> using the <button class="inline-link" onclick="switchTab('calculators')">Calculators Tab →</button>
            </div>
          </div>
        </div>` : ''}

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">👴</span> Geriatric Dosing Considerations</h3>
          <div class="card-content">
            ${localData?.geriatricDosing ? `<p class="geri-text">${highlightKeyTerms(escapeHtml(localData.geriatricDosing))}</p>` : ''}
            ${parsed.geriatricUse ? formatTextToList(parsed.geriatricUse, 6) : ''}
            ${!localData?.geriatricDosing && !parsed.geriatricUse ? '<p class="no-data">No specific geriatric data available.</p>' : ''}
          </div>
        </div>

        ${parsed.overdosage ? `
        <div class="info-card warn-card">
          <h3 class="card-title"><span class="card-icon">🚨</span> Overdosage Management</h3>
          <div class="card-content">${formatTextToList(parsed.overdosage, 8)}</div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 3: SAFETY ─────────────────────────────────────────────────────────────
function renderSafetyTab(parsed, localData) {
  const contraindications = parsed.contraindications || (localData?.contraindications?.join('\n• ') ? '• ' + localData.contraindications.join('\n• ') : null);
  return `
    <div class="tab-panel" id="tab-safety" role="tabpanel">
      <div class="panel-grid">

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🚫</span> Contraindications</h3>
          <div class="card-content">
            ${localData?.contraindications ? `
              <ul class="fda-list">
                ${localData.contraindications.map(c => `<li><span class="hl-warn">${escapeHtml(c)}</span></li>`).join('')}
              </ul>` : formatTextToList(contraindications, 10)}
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">⚠️</span> Warnings & Precautions</h3>
          <div class="card-content">${formatTextToList(parsed.warnings, 12)}</div>
        </div>

        ${parsed.adverseReactions ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🔴</span> Adverse Reactions (Label)</h3>
          <div class="card-content">${formatTextToList(parsed.adverseReactions, 10)}</div>
        </div>` : ''}

        ${localData?.keyInteractions ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">⚡</span> Key Drug Interactions</h3>
          <div class="card-content">
            <ul class="fda-list">
              ${localData.keyInteractions.map(i => `<li>${highlightKeyTerms(escapeHtml(i))}</li>`).join('')}
            </ul>
          </div>
        </div>` : ''}

        ${parsed.useInPregnancy ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🤰</span> Use in Specific Populations</h3>
          <div class="card-content">
            <h4>Pregnancy</h4>${formatTextToList(parsed.useInPregnancy, 5)}
            ${parsed.useInLactation ? `<h4>Lactation</h4>${formatTextToList(parsed.useInLactation, 4)}` : ''}
          </div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 4: PHARMACOLOGY (ADME) ────────────────────────────────────────────────
function renderPharmacologyTab(parsed, localData) {
  const pkExtracted = extractPKParams(parsed.pharmacokinetics || parsed.clinicalPharmacology || '');
  const proteinBinding = localData?.proteinBinding || pkExtracted.proteinBinding;
  const halfLife = localData?.halfLife || pkExtracted.halfLife;
  const vd = localData?.volumeOfDistribution || pkExtracted.volumeOfDistribution;
  const bioavail = localData?.bioavailability;
  const cyp = localData?.cyp450;
  const excretion = localData?.excretion;

  return `
    <div class="tab-panel" id="tab-pharmacology" role="tabpanel">
      <div class="panel-grid">

        ${(proteinBinding || halfLife || vd || bioavail || cyp || excretion) ? `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">📊</span> Pharmacokinetic Parameters</h3>
          <div class="card-content">
            <div class="pk-grid large">
              ${proteinBinding ? `<div class="pk-stat-card"><div class="pk-stat-value">${proteinBinding}</div><div class="pk-stat-label">Protein Binding</div></div>` : ''}
              ${halfLife ? `<div class="pk-stat-card"><div class="pk-stat-value">${halfLife}</div><div class="pk-stat-label">Half-Life (t½)</div></div>` : ''}
              ${vd ? `<div class="pk-stat-card"><div class="pk-stat-value">${vd}</div><div class="pk-stat-label">Volume of Distribution</div></div>` : ''}
              ${bioavail ? `<div class="pk-stat-card"><div class="pk-stat-value">${bioavail}</div><div class="pk-stat-label">Oral Bioavailability</div></div>` : ''}
              ${excretion ? `<div class="pk-stat-card"><div class="pk-stat-value">${excretion.split('—')[0].trim()}</div><div class="pk-stat-label">Primary Excretion</div></div>` : ''}
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
        </div>` : ''}

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🔬</span> Clinical Pharmacology</h3>
          <div class="card-content">${formatTextToList(parsed.clinicalPharmacology, 12)}</div>
        </div>

        ${parsed.pharmacokinetics ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">📈</span> Detailed Pharmacokinetics</h3>
          <div class="card-content">${formatTextToList(parsed.pharmacokinetics, 10)}</div>
        </div>` : ''}

        ${localData ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🔄</span> ADME Summary</h3>
          <div class="card-content">
            <div class="adme-grid">
              <div class="adme-section">
                <div class="adme-label">🟢 Absorption</div>
                <p>${escapeHtml(localData.bioavailability || 'See full prescribing information')}</p>
              </div>
              <div class="adme-section">
                <div class="adme-label">🔵 Distribution</div>
                <p>VD: ${escapeHtml(localData.volumeOfDistribution || 'N/A')} | Protein Binding: ${escapeHtml(localData.proteinBinding || 'N/A')}</p>
              </div>
              <div class="adme-section">
                <div class="adme-label">🟡 Metabolism</div>
                <p>${escapeHtml(localData.cyp450 || 'See prescribing information')}</p>
              </div>
              <div class="adme-section">
                <div class="adme-label">🔴 Excretion</div>
                <p>${escapeHtml(localData.excretion || 'See prescribing information')}</p>
              </div>
            </div>
          </div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 5: INTERACTIONS ───────────────────────────────────────────────────────
function renderInteractionsTab(parsed, localData, interactions) {
  const localInteractionsParsed = localData?.keyInteractions || [];
  const fdaInteractions = parsed.drugInteractions;

  return `
    <div class="tab-panel" id="tab-interactions" role="tabpanel">
      <div class="panel-grid">

        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">🔍</span> Drug Interaction Checker</h3>
          <div class="card-content">
            <div class="interaction-checker">
              <div id="interaction-inputs" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.8rem;">
                <input type="text" class="interaction-input multi-drug-target" placeholder="Drug 1 (e.g., Warfarin)" />
                <input type="text" class="interaction-input multi-drug-target" placeholder="Drug 2 (e.g., Aspirin)" />
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn-secondary" onclick="window.addInteractionField()" style="background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); padding:0.4rem 0.8rem; border-radius:4px; font-weight:600; cursor:pointer;">+ Add Drug</button>
                <button class="btn-primary" onclick="checkInteractions()" style="flex:1;">Check Interactions</button>
              </div>
              <div id="interaction-results" class="interaction-results" style="margin-top: 1rem;"></div>
            </div>
          </div>
        </div>

        ${localInteractionsParsed.length > 0 ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">⚡</span> Clinically Significant Interactions</h3>
          <div class="card-content">
            <ul class="fda-list">
              ${localInteractionsParsed.map(i => `<li>${highlightKeyTerms(escapeHtml(i))}</li>`).join('')}
            </ul>
          </div>
        </div>` : ''}

        ${fdaInteractions ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">📋</span> FDA Label — Drug Interactions</h3>
          <div class="card-content">${formatTextToList(fdaInteractions, 12)}</div>
        </div>` : ''}

        ${(interactions && interactions.length > 0) ? `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">🗄️</span> RxNav Interaction Database</h3>
          <div class="card-content">
            ${interactions.map(interaction => renderInteractionCard(interaction)).join('')}
          </div>
        </div>` : ''}

      </div>
    </div>`;
}

function renderInteractionCard(interaction) {
  return `
    <div class="interaction-item" style="border-left-color: ${interaction.severityColor || '#7f8c8d'}">
      <div class="interaction-header">
        <span class="interaction-drugs">${escapeHtml(interaction.drug1)} ↔ ${escapeHtml(interaction.drug2)}</span>
        <span class="severity-badge" style="background: ${interaction.severityColor}20; color: ${interaction.severityColor}; border: 1px solid ${interaction.severityColor}40">
          ${escapeHtml(interaction.severity || 'Unknown')}
        </span>
      </div>
      <p class="interaction-desc">${escapeHtml(interaction.description)}</p>
    </div>`;
}

// ─── TAB 6: ADVERSE EVENTS ─────────────────────────────────────────────────────
function renderAdverseEventsTab(aeData, parsed) {
  return `
    <div class="tab-panel" id="tab-adverse" role="tabpanel">
      <div class="panel-grid">

        ${aeData && aeData.length > 0 ? `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">📊</span> Top FDA MedWatch Adverse Event Reports</h3>
          <p class="card-subtitle">Spontaneous reports from FDA FAERS database — not necessarily causative.</p>
          <div class="card-content">
            <div class="ae-bars">
              ${aeData.slice(0, 15).map((ae, i) => `
                <div class="ae-bar-row" style="animation-delay: ${i * 50}ms">
                  <span class="ae-name">${escapeHtml(ae.term)}</span>
                  <div class="ae-bar-wrapper">
                    <div class="ae-bar" style="width: ${ae.percent}%; background: ${getAEColor(i)}"></div>
                  </div>
                  <span class="ae-count">${ae.count.toLocaleString()} <small>(${ae.percent}%)</small></span>
                </div>`).join('')}
            </div>
          </div>
        </div>` : `
        <div class="info-card full-width">
          <h3 class="card-title"><span class="card-icon">📊</span> FDA Adverse Events</h3>
          <div class="card-content">
            <div class="no-results"><p>No FAERS data available for this drug. <br>Check the FDA MedWatch portal for the latest pharmacovigilance data.</p></div>
          </div>
        </div>`}

        ${parsed.adverseReactions ? `
        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">📋</span> From FDA Prescribing Label</h3>
          <div class="card-content">${formatTextToList(parsed.adverseReactions, 12)}</div>
        </div>` : ''}

      </div>
    </div>`;
}

// ─── TAB 7: CALCULATORS ────────────────────────────────────────────────────────
function renderCalculatorsTab(localData, drugName) {
  return `
    <div class="tab-panel" id="tab-calculators" role="tabpanel">
      <div class="panel-grid">

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">🫘</span> Creatinine Clearance (CrCl)</h3>
          <p class="card-subtitle">Cockcroft-Gault Equation</p>
          <div class="card-content">
            <div class="calculator" id="crcl-calc">
              <div class="calc-grid">
                <div class="calc-field">
                  <label for="crcl-age">Age (years)</label>
                  <input type="number" id="crcl-age" placeholder="e.g., 65" min="1" max="120" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="crcl-weight">Weight (kg)</label>
                  <input type="number" id="crcl-weight" placeholder="e.g., 70" min="1" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="crcl-scr">Serum Creatinine (mg/dL)</label>
                  <input type="number" id="crcl-scr" placeholder="e.g., 1.2" step="0.01" min="0.1" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="crcl-sex">Sex</label>
                  <select id="crcl-sex" class="calc-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <button class="btn-primary full-width" onclick="runCrClCalculator('${escapeAttr(drugName)}')">
                Calculate CrCl
              </button>
              <div id="crcl-result" class="calc-result"></div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">👶</span> Pediatric Dose Calculator</h3>
          <p class="card-subtitle">mg/kg dosing with maximum dose capping</p>
          <div class="card-content">
            <div class="calculator" id="ped-calc">
              <div class="calc-grid">
                <div class="calc-field">
                  <label for="ped-weight">Patient Weight (kg)</label>
                  <input type="number" id="ped-weight" placeholder="e.g., 25" min="0.5" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="ped-dose">Dose (mg/kg)</label>
                  <input type="number" id="ped-dose" placeholder="e.g., 25" step="0.1" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="ped-maxdose">Max Dose (mg) <span class="optional">optional</span></label>
                  <input type="number" id="ped-maxdose" placeholder="e.g., 500" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="ped-freq">Frequency</label>
                  <select id="ped-freq" class="calc-input">
                    <option value="once daily">Once Daily (q24h)</option>
                    <option value="twice daily">Twice Daily (q12h)</option>
                    <option value="three times daily">Three Times Daily (q8h)</option>
                    <option value="q6h">Every 6h (q6h)</option>
                    <option value="q4h">Every 4h (q4h)</option>
                  </select>
                </div>
              </div>
              <button class="btn-primary full-width" onclick="runPedCalc()">Calculate Dose</button>
              <div id="ped-result" class="calc-result"></div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title"><span class="card-icon">📏</span> Body Parameter Calculators</h3>
          <div class="card-content">
            <div class="calculator">
              <div class="calc-grid">
                <div class="calc-field">
                  <label for="body-weight">Weight (kg)</label>
                  <input type="number" id="body-weight" placeholder="e.g., 80" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="body-height">Height (cm)</label>
                  <input type="number" id="body-height" placeholder="e.g., 175" class="calc-input" />
                </div>
                <div class="calc-field">
                  <label for="body-sex">Sex</label>
                  <select id="body-sex" class="calc-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <button class="btn-primary full-width" onclick="runBodyCalcs()">Calculate</button>
              <div id="body-result" class="calc-result"></div>
            </div>
          </div>
        </div>

      </div>
    </div>`;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function getRenalRowClass(crcl) {
  if (!crcl) return '';
  const c = String(crcl).toLowerCase();
  if (c === 'hd' || c === 'esrd') return 'renal-row-severe';
  if (c.includes('<10') || c.includes('<15')) return 'renal-row-severe';
  if (c.includes('10') || c.includes('15') || c.includes('30')) return 'renal-row-moderate';
  if (c.includes('30') || c.includes('45') || c.includes('60')) return 'renal-row-mild';
  return '';
}

function renderCYPBadges(cyp450text) {
  if (!cyp450text) return '';
  const enzymes = [...cyp450text.matchAll(/CYP\s*(\d[A-Z]\d+(?:\.\d+)?)/gi)].map(m => `CYP${m[1]}`);
  const unique = [...new Set(enzymes)];
  if (unique.length === 0) return '';
  return `<div class="cyp-badges">${unique.map(e => `<span class="cyp-badge">${e}</span>`).join('')}</div>`;
}

function getAEColor(index) {
  const palette = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#2980b9', '#8e44ad', '#16a085', '#d35400', '#c0392b', '#1abc9c'];
  return palette[index % palette.length];
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
