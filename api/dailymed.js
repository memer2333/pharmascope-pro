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
 * Get drug ADME / pharmacokinetics sections from DailyMed
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
