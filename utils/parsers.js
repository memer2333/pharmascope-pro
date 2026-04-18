/**
 * PharmaScope Pro — Text Parsers
 * Converts raw DrugBank JSON + DailyMed label into structured, readable HTML
 */

/**
 * Smart text → HTML list converter
 */
function formatTextToList(rawText, maxItems = 20) {
  if (!rawText) return '<p class="no-data">No data available.</p>';
  let text = rawText
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ');
  text = text.replace(/<br\s*\/?>/gi, '\n').replace(/<p[^>]*>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ').replace(/<\/li>/gi, '').replace(/<[^>]+>/g, '');
  const sentences = text.split(/\n|(?<=[.!?])\s+(?=[A-Z])|(?=[•\-\*]\s)|\d+\.\s+/)
    .map(s => s.replace(/^[•\-\*]+\s*/, '').trim())
    .filter(s => s.length > 15);
  if (sentences.length === 0) return `<p>${text.trim()}</p>`;
  const limited = sentences.slice(0, maxItems);
  const items = limited.map(s => `<li>${highlightKeyTerms(s)}</li>`).join('');
  const moreNote = sentences.length > maxItems
    ? `<p class="more-note">+${sentences.length - maxItems} additional items in full label</p>` : '';
  return `<ul class="fda-list">${items}</ul>${moreNote}`;
}

/**
 * Highlight clinical key terms
 */
function highlightKeyTerms(text) {
  const terms = [
    ['fatal', 'warn'], ['death', 'warn'], ['serious', 'warn'], ['severe', 'warn'],
    ['contraindicated', 'warn'], ['avoid', 'warn'], ['caution', 'warn'],
    ['monitor', 'info'], ['adjust dose', 'info'], ['dose reduction', 'info'],
    ['renal impairment', 'info'], ['hepatic impairment', 'info'],
    ['recommended', 'good'], ['preferred', 'good'], ['effective', 'good'],
    ['CYP', 'cyp'], ['P450', 'cyp'], ['inhibitor', 'cyp'], ['inducer', 'cyp'],
  ];
  let out = text;
  terms.forEach(([term, cls]) => {
    const regex = new RegExp(`(${term})`, 'gi');
    out = out.replace(regex, `<span class="hl-${cls}">$1</span>`);
  });
  return out;
}

/**
 * Parse adverse events count data from openFDA into sorted list
 */
function parseAdverseEvents(data) {
  if (!data || !data.results) return [];
  return data.results
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(item => ({
      term: toTitleCase(item.term),
      count: item.count,
      percent: null
    }))
    .map((item, _, arr) => {
      const total = arr.reduce((s, e) => s + e.count, 0);
      item.percent = ((item.count / total) * 100).toFixed(1);
      return item;
    });
}

/**
 * Parse DrugBank JSON result + DailyMed label into a unified structured drug profile.
 * Priority: localData (curated) > dailyMedLabel (live FDA) > DrugBank JSON
 *
 * @param {object} result       - DrugBank JSON object (from /data/drugs/*.json)
 * @param {object} dailyMedLabel - Structured label from getFullDrugLabel() in dailymed.js
 */
function parseFDALabel(result, dailyMedLabel) {
  if (!result) return null;

  const dm = dailyMedLabel || {};

  // Helper: pick first truthy value across sources
  const pick = (...vals) => vals.find(v => v && String(v).trim().length > 0) || null;

  // Build a combined pharmacokinetics block from DailyMed sub-sections
  const pkParts = [
    dm.pharmacokinetics,
    dm.absorption  ? `Absorption: ${dm.absorption}`    : null,
    dm.distribution ? `Distribution: ${dm.distribution}` : null,
    dm.metabolism   ? `Metabolism: ${dm.metabolism}`     : null,
    dm.excretion    ? `Excretion: ${dm.excretion}`       : null,
  ].filter(Boolean);
  const combinedPK = pkParts.length > 0 ? pkParts.join('\n\n') : null;

  return {
    // Identity
    brandName:    result.name || 'Unknown',
    genericName:  (result.brandNames && result.brandNames.length > 0)
                    ? result.brandNames[0] : result.name,
    manufacturer: dm._source === 'DailyMed' ? `${dm._labelTitle || 'DailyMed'}` : 'DrugBank Database',
    route:        '',
    dosageForm:   '',
    rxcui:        null,

    // ── Clinical sections ──────────────────────────────────────────────────────
    // Indications: DailyMed > DrugBank
    indications:          pick(dm.indications, result.indication),

    // Dosage: DailyMed is authoritative — this is the key fix for missing dosing
    dosage:               pick(dm.dosage),

    // Warnings: DailyMed
    warnings:             pick(dm.warnings),
    boxedWarning:         pick(dm.boxedWarning),

    // Contraindications: DailyMed
    contraindications:    pick(dm.contraindications),

    // Adverse reactions: DailyMed
    adverseReactions:     pick(dm.adverseReactions),

    // Drug interactions: DailyMed
    drugInteractions:     pick(dm.drugInteractions),

    // Pharmacology: DailyMed MoA > DrugBank MoA
    mechanismOfAction:    pick(dm.mechanismOfAction, result.mechanismOfAction),
    clinicalPharmacology: pick(result.pharmacodynamics, dm.clinicalPharmacology),

    // Full PK block built from DailyMed sub-sections
    pharmacokinetics:     combinedPK,

    // Individual ADME fields (used by PK stat cards)
    absorption:           pick(dm.absorption),
    distribution:         pick(dm.distribution),
    metabolism:           pick(dm.metabolism),
    excretion:            pick(dm.excretion),

    // Special populations: DailyMed
    useInPregnancy:       pick(dm.useInPregnancy),
    useInLactation:       pick(dm.useInLactation),
    pediatricUse:         pick(dm.pediatricUse),
    geriatricUse:         pick(dm.geriatricUse),

    // Overdosage: DailyMed > DrugBank toxicity
    overdosage:           pick(dm.overdosage, result.toxicity),

    // Storage
    storage:              pick(dm.storage),

    // Drug class / groups
    pharmClass:           result.groups || [],

    // Flag so UI can show data source badge
    _dailyMedLoaded:      !!dm._source,
  };
}

function cleanFDAText(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[0];
}

/**
 * Parse DailyMed SPL XML response fields
 */
function parseDailyMedData(spl) {
  if (!spl) return null;
  return {
    setId: spl.setid,
    title: spl.title,
    published: spl.published_date,
    sections: (spl.sections || []).map(sec => ({
      title: sec.title,
      text: sec.text
    }))
  };
}

/**
 * Parse RxNorm interaction data
 */
function parseInteractions(data) {
  if (!data) return [];
  const interactions = [];
  const groups = data.fullInteractionTypeGroup || [];
  groups.forEach(group => {
    (group.fullInteractionType || []).forEach(interType => {
      (interType.interactionPair || []).forEach(pair => {
        interactions.push({
          drug1: pair.interactionConcept?.[0]?.minConceptItem?.name || 'Unknown',
          drug2: pair.interactionConcept?.[1]?.minConceptItem?.name || 'Unknown',
          severity: pair.severity || 'N/A',
          description: pair.description || 'No description available.',
          severityColor: getSeverityColor(pair.severity)
        });
      });
    });
  });
  return interactions;
}

function getSeverityColor(severity) {
  if (!severity) return '#7f8c8d';
  const sev = severity.toLowerCase();
  if (sev.includes('high') || sev.includes('severe')) return '#e74c3c';
  if (sev.includes('moderate')) return '#f39c12';
  if (sev.includes('low') || sev.includes('minor')) return '#27ae60';
  return '#7f8c8d';
}

/**
 * Extract CYP450 pathway table from clinical pharmacology text
 */
function extractCYP450Info(pharmText) {
  if (!pharmText) return null;
  const cypPattern = /CYP\s*(\d[A-Z]\d+(?:\.\d+)?)/gi;
  const found = new Set();
  let match;
  while ((match = cypPattern.exec(pharmText)) !== null) {
    found.add(`CYP${match[1]}`);
  }
  const isSubstrate = /substrate/i.test(pharmText);
  const isInhibitor = /inhibit/i.test(pharmText);
  const isInducer = /induc/i.test(pharmText);
  const enzymes = Array.from(found);
  if (enzymes.length === 0) return null;
  return { enzymes, isSubstrate, isInhibitor, isInducer };
}

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse protein binding / half-life numbers from pharmacokinetics text
 */
function extractPKParams(pkText) {
  if (!pkText) return {};
  const params = {};
  const hlfMatch = pkText.match(/half.?life[:\s]+(?:approximately\s+)?(\d+(?:\.\d+)?(?:–\d+(?:\.\d+)?)?)\s*h/i);
  if (hlfMatch) params.halfLife = hlfMatch[1] + ' hours';
  const pbMatch = pkText.match(/protein.?binding[:\s]+(?:approximately\s+)?(\d+(?:\.\d+)?(?:\s*–\s*\d+(?:\.\d+)?)?)\s*%/i);
  if (pbMatch) params.proteinBinding = pbMatch[1] + '%';
  const vdMatch = pkText.match(/volume of distribution[:\s]+(?:approximately\s+)?(\d+(?:\.\d+)?(?:\s*–\s*\d+(?:\.\d+)?)?)\s*L/i);
  if (vdMatch) params.volumeOfDistribution = vdMatch[1] + ' L';
  return params;
}
