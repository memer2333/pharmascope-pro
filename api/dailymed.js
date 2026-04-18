/**
 * PharmaScope Pro — NIH DailyMed API Service
 * Docs: https://dailymed.nlm.nih.gov/dailymed/app-support-web-services.cfm
 * Base URL: https://dailymed.nlm.nih.gov/dailymed/services/v2
 */

const DAILYMED_BASE = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';

/**
 * Search DailyMed for a drug SPL.
 * Tries multiple name variants (original, lowercase, uppercase, first word)
 * to handle generics like meropenem, vancomycin, piperacillin, etc.
 */
async function searchDailyMed(drugName) {
  const base = drugName.trim();
  const variants = [
    base,
    base.toLowerCase(),
    base.toUpperCase(),
    base.charAt(0).toUpperCase() + base.slice(1).toLowerCase(),
    base.split(' ')[0],
  ];
  for (const name of [...new Set(variants)]) {
    const encoded = encodeURIComponent(name);
    const url = `${DAILYMED_BASE}/spls.json?drug_name=${encoded}&pagesize=10`;
    try {
      const res = await fetchWithTimeout(url, 10000);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.data && data.data.length > 0) return data.data;
    } catch (err) {
      console.warn(`DailyMed search variant failed (${name}):`, err);
    }
  }
  return null;
}

/**
 * Pick the best matching SPL result.
 * Priority: exact title match > starts with > contains > first result.
 */
function pickBestResult(results, drugName) {
  if (!results || results.length === 0) return null;
  const name = drugName.toLowerCase().trim();
  const exact    = results.find(r => (r.title || '').toLowerCase() === name);
  if (exact) return exact;
  const starts   = results.find(r => (r.title || '').toLowerCase().startsWith(name));
  if (starts) return starts;
  const contains = results.find(r => (r.title || '').toLowerCase().includes(name));
  if (contains) return contains;
  return results[0];
}

/**
 * Get SPL details by setId.
 */
async function getSPLById(setId) {
  if (!setId) return null;
  const url = `${DAILYMED_BASE}/spls/${setId}.json`;
  try {
    const res = await fetchWithTimeout(url, 10000);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('DailyMed SPL fetch failed:', err);
    return null;
  }
}

/**
 * Get the full drug label from DailyMed including dosing, warnings,
 * PK, contraindications, pregnancy, pediatric, geriatric sections.
 * Returns a structured object ready to merge into parsedLabel.
 */
async function getFullDrugLabel(drugName) {
  if (!drugName) return null;
  try {
    const results = await searchDailyMed(drugName);
    if (!results || results.length === 0) {
      console.warn('DailyMed: no results for', drugName);
      return null;
    }
    const best  = pickBestResult(results, drugName);
    const setId = best.setid;
    if (!setId) return null;
    const spl = await getSPLById(setId);
    if (!spl || !spl.data) return null;
    return extractAllSections(spl.data, best.title || drugName);
  } catch (err) {
    console.warn('DailyMed getFullDrugLabel failed:', err);
    return null;
  }
}

/**
 * Extract ALL clinical sections from an SPL data object.
 * Maps section titles to structured fields used by parseFDALabel.
 */
function extractAllSections(splData, labelTitle) {
  if (!splData) return null;
  const sections = splData.sections || [];
  const label = {
    _source: 'DailyMed',
    _labelTitle: labelTitle,
    dosage: null,
    warnings: null,
    boxedWarning: null,
    contraindications: null,
    adverseReactions: null,
    drugInteractions: null,
    clinicalPharmacology: null,
    pharmacokinetics: null,
    absorption: null,
    distribution: null,
    metabolism: null,
    excretion: null,
    useInPregnancy: null,
    useInLactation: null,
    pediatricUse: null,
    geriatricUse: null,
    overdosage: null,
    indications: null,
    storage: null,
    mechanismOfAction: null,
  };

  sections.forEach(section => {
    const title = (section.title || '').toLowerCase().trim();
    const text  = (section.text  || '').trim();
    if (!text) return;

    if (title.includes('dosage and administration') || title.includes('dosage & administration') || title === 'dosage') {
      label.dosage = label.dosage ? label.dosage + '\n' + text : text;
    } else if (title.includes('boxed warning') || title.includes('black box') || title.includes('warnings: boxed')) {
      label.boxedWarning = text;
    } else if (title.includes('warnings and precautions') || title === 'warnings') {
      label.warnings = label.warnings ? label.warnings + '\n' + text : text;
    } else if (title.includes('contraindication')) {
      label.contraindications = text;
    } else if (title.includes('adverse reaction') || title.includes('adverse effect')) {
      label.adverseReactions = label.adverseReactions ? label.adverseReactions + '\n' + text : text;
    } else if (title.includes('drug interaction')) {
      label.drugInteractions = label.drugInteractions ? label.drugInteractions + '\n' + text : text;
    } else if (title === 'clinical pharmacology') {
      label.clinicalPharmacology = text;
    } else if (title.includes('mechanism of action')) {
      label.mechanismOfAction = text;
    } else if (title === 'pharmacokinetics' || (title.includes('pharmacokinetic') && !title.includes('clinical'))) {
      label.pharmacokinetics = label.pharmacokinetics ? label.pharmacokinetics + '\n' + text : text;
    } else if (title === 'absorption') {
      label.absorption = text;
    } else if (title === 'distribution') {
      label.distribution = text;
    } else if (title === 'metabolism') {
      label.metabolism = text;
    } else if (title === 'excretion' || title === 'elimination') {
      label.excretion = text;
    } else if (title.includes('pregnancy') || title.includes('use in pregnancy')) {
      label.useInPregnancy = text;
    } else if (title.includes('lactation') || title.includes('nursing') || title.includes('breast')) {
      label.useInLactation = text;
    } else if (title.includes('pediatric')) {
      label.pediatricUse = label.pediatricUse ? label.pediatricUse + '\n' + text : text;
    } else if (title.includes('geriatric')) {
      label.geriatricUse = text;
    } else if (title.includes('overdos')) {
      label.overdosage = text;
    } else if (title.includes('indication') || title === 'indications and usage' || title === 'indications & usage') {
      label.indications = label.indications ? label.indications + '\n' + text : text;
    } else if (title.includes('storage') || title.includes('how supplied')) {
      label.storage = text;
    }
  });

  return label;
}

/**
 * Get drug ADME / pharmacokinetics sections from DailyMed (legacy helper)
 */
async function getDrugADME(drugName) {
  const results = await searchDailyMed(drugName);
  if (!results || results.length === 0) return null;
  const setId = results[0].setid;
  if (!setId) return null;
  const spl = await getSPLById(setId);
  if (!spl || !spl.data) return null;
  return extractADMEFromSPL(spl.data);
}

/**
 * Extract ADME sections from SPL data
 */
function extractADMEFromSPL(splData) {
  if (!splData) return null;
  const sections = splData.sections || [];
  const adme = {
    absorption: null, distribution: null, metabolism: null,
    excretion: null, pharmacokinetics: null, clinicalPharmacology: null
  };
  sections.forEach(section => {
    const title = (section.title || '').toLowerCase();
    const text  = section.text || '';
    if      (title.includes('absorption'))                                adme.absorption = text;
    else if (title.includes('distribution'))                              adme.distribution = text;
    else if (title.includes('metabolism'))                                adme.metabolism = text;
    else if (title.includes('excretion') || title.includes('elimination')) adme.excretion = text;
    else if (title.includes('pharmacokinetics') || title.includes('pk'))  adme.pharmacokinetics = text;
    else if (title.includes('clinical pharmacology'))                     adme.clinicalPharmacology = text;
  });
  return adme;
}

/**
 * Search DailyMed for NDC (National Drug Code)
 */
async function getDrugByNDC(ndc) {
  const url = `${DAILYMED_BASE}/ndc/${ndc}.json`;
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/**
 * Get all NDCs for a drug
 */
async function getNDCsForDrug(drugName) {
  const encoded = encodeURIComponent(drugName.trim());
  const url = `${DAILYMED_BASE}/ndcs.json?drug_name=${encoded}&pagesize=10`;
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

async function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
