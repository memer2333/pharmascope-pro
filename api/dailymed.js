/**
 * PharmaScope Pro — NIH DailyMed API Service
 * Docs: https://dailymed.nlm.nih.gov/dailymed/app-support-web-services.cfm
 * Base URL: https://dailymed.nlm.nih.gov/dailymed/services/v2
 */

const DAILYMED_BASE = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';

/**
 * Search DailyMed for a drug SPL (Structured Product Labeling)
 */
async function searchDailyMed(drugName) {
  const encoded = encodeURIComponent(drugName.trim());
  const url = `${DAILYMED_BASE}/spls.json?drug_name=${encoded}&pagesize=5`;
  try {
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.warn('DailyMed search failed:', err);
    return null;
  }
}

/**
 * Get SPL details by setId
 */
async function getSPLById(setId) {
  if (!setId) return null;
  const url = `${DAILYMED_BASE}/spls/${setId}.json`;
  try {
    const res = await fetchWithTimeout(url, 8000);
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
    if (!results || results.length === 0) return null;

    // Prefer a result whose title closely matches the drug name
    const nameLower = drugName.toLowerCase();
    const best = results.find(r =>
      (r.title || '').toLowerCase().includes(nameLower)
    ) || results[0];

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
    const text = (section.text || '').trim();
    if (!text) return;

    // Dosage & Administration
    if (title.includes('dosage and administration') || title === 'dosage & administration') {
      label.dosage = label.dosage ? label.dosage + '\n' + text : text;
    }
    // Boxed Warning
    else if (title.includes('boxed warning') || title.includes('black box') || title.includes('warning\nboxed')) {
      label.boxedWarning = text;
    }
    // Warnings & Precautions
    else if (title.includes('warnings and precautions') || title === 'warnings') {
      label.warnings = label.warnings ? label.warnings + '\n' + text : text;
    }
    // Contraindications
    else if (title.includes('contraindication')) {
      label.contraindications = text;
    }
    // Adverse Reactions
    else if (title.includes('adverse reaction') || title.includes('adverse effect')) {
      label.adverseReactions = label.adverseReactions ? label.adverseReactions + '\n' + text : text;
    }
    // Drug Interactions
    else if (title.includes('drug interaction')) {
      label.drugInteractions = label.drugInteractions ? label.drugInteractions + '\n' + text : text;
    }
    // Clinical Pharmacology (parent section — keep as fallback)
    else if (title === 'clinical pharmacology') {
      label.clinicalPharmacology = text;
    }
    // Mechanism of Action
    else if (title.includes('mechanism of action')) {
      label.mechanismOfAction = text;
    }
    // Pharmacokinetics (full section)
    else if (title === 'pharmacokinetics' || title.includes('pharmacokinetic')) {
      label.pharmacokinetics = label.pharmacokinetics ? label.pharmacokinetics + '\n' + text : text;
    }
    // Absorption sub-section
    else if (title === 'absorption') {
      label.absorption = text;
    }
    // Distribution sub-section
    else if (title === 'distribution') {
      label.distribution = text;
    }
    // Metabolism sub-section
    else if (title === 'metabolism') {
      label.metabolism = text;
    }
    // Excretion / Elimination sub-section
    else if (title === 'excretion' || title === 'elimination') {
      label.excretion = text;
    }
    // Pregnancy
    else if (title.includes('pregnancy') || title.includes('use in pregnancy')) {
      label.useInPregnancy = text;
    }
    // Lactation / Nursing
    else if (title.includes('lactation') || title.includes('nursing') || title.includes('breast')) {
      label.useInLactation = text;
    }
    // Pediatric Use
    else if (title.includes('pediatric')) {
      label.pediatricUse = label.pediatricUse ? label.pediatricUse + '\n' + text : text;
    }
    // Geriatric Use
    else if (title.includes('geriatric')) {
      label.geriatricUse = text;
    }
    // Overdosage
    else if (title.includes('overdos')) {
      label.overdosage = text;
    }
    // Indications & Usage
    else if (title.includes('indication') || title.includes('usage')) {
      label.indications = label.indications ? label.indications + '\n' + text : text;
    }
    // Storage
    else if (title.includes('storage') || title.includes('how supplied')) {
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
    absorption: null,
    distribution: null,
    metabolism: null,
    excretion: null,
    pharmacokinetics: null,
    clinicalPharmacology: null
  };
  sections.forEach(section => {
    const title = (section.title || '').toLowerCase();
    const text = section.text || '';
    if (title.includes('absorption')) adme.absorption = text;
    else if (title.includes('distribution')) adme.distribution = text;
    else if (title.includes('metabolism')) adme.metabolism = text;
    else if (title.includes('excretion') || title.includes('elimination')) adme.excretion = text;
    else if (title.includes('pharmacokinetics') || title.includes('pk')) adme.pharmacokinetics = text;
    else if (title.includes('clinical pharmacology')) adme.clinicalPharmacology = text;
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
  } catch {
    return null;
  }
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
  } catch {
    return [];
  }
}

async function fetchWithTimeout(url, ms = 8000) {
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
