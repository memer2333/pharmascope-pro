/**
 * PharmaScope Pro — NIH RxNav / RxNorm API Service
 * RxNorm: https://rxnav.nlm.nih.gov/RxNormAPIs.html
 * Interaction API: https://rxnav.nlm.nih.gov/InteractionAPIs.html
 */

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';
const RXNAV_INTERACTION_BASE = 'https://rxnav.nlm.nih.gov/REST';

/**
 * Look up RxCUI (RxNorm Concept Unique Identifier) by drug name
 */
async function getRxCUI(drugName) {
  const encoded = encodeURIComponent(drugName.trim());
  const exactUrl = `${RXNORM_BASE}/rxcui.json?name=${encoded}&search=1`;
  try {
    let res = await fetchWithTimeout(exactUrl, 6000);
    if (res.ok) {
      const data = await res.json();
      const idGroup = data.idGroup;
      if (idGroup && idGroup.rxnormId && idGroup.rxnormId.length > 0) {
        return idGroup.rxnormId[0];
      }
    }
    
    // Fallback to approximate matching if exact fails
    const approxUrl = `${RXNORM_BASE}/approximateTerm.json?term=${encoded}&maxEntries=1`;
    res = await fetchWithTimeout(approxUrl, 6000);
    if (!res.ok) return null;
    const approxData = await res.json();
    const candidates = approxData.approximateGroup?.candidate;
    if (candidates && candidates.length > 0) {
      return candidates[0].rxcui;
    }
    return null;
  } catch (err) {
    console.warn('RxCUI lookup failed:', err);
    return null;
  }
}

/**
 * Get drug interactions by RxCUI
 */
async function getInteractionsByRxCUI(rxcui) {
  if (!rxcui) return null;
  const url = `${RXNAV_INTERACTION_BASE}/interaction/interaction.json?rxcui=${rxcui}&sources=ONCHigh`;
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) {
      // fallback: all sources
      return await getInteractionsAllSources(rxcui);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Interaction fetch failed:', err);
    return null;
  }
}

async function getInteractionsAllSources(rxcui) {
  const url = `${RXNAV_INTERACTION_BASE}/interaction/interaction.json?rxcui=${rxcui}`;
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get interactions for a list of RxCUIs (multi-drug checker)
 */
async function getInteractionList(rxcuiList) {
  if (!rxcuiList || rxcuiList.length < 2) return null;
  const rxcuisParam = rxcuiList.join('+');
  const url = `${RXNAV_INTERACTION_BASE}/interaction/list.json?rxcuis=${rxcuisParam}&sources=ONCHigh`;
  try {
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Interaction list fetch failed:', err);
    return null;
  }
}

/**
 * Get all drugs related to an RxCUI (related brands/generics)
 */
async function getRelatedDrugs(rxcui) {
  if (!rxcui) return [];
  const url = `${RXNORM_BASE}/rxcui/${rxcui}/related.json?tty=BN+IN+SBD+SCD`;
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return [];
    const data = await res.json();
    const related = [];
    (data.relatedGroup?.conceptGroup || []).forEach(group => {
      (group.conceptProperties || []).forEach(cp => {
        related.push({ rxcui: cp.rxcui, name: cp.name, tty: group.tty });
      });
    });
    return related;
  } catch {
    return [];
  }
}

/**
 * Search drugs by RxClass (therapeutic class)
 */
async function getDrugsByClass(classId) {
  const url = `${RXNORM_BASE}/rxclass/classMembers.json?classId=${classId}&relaSource=ATC&rela=isa`;
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.drugMemberGroup?.drugMember || []).map(dm => ({
      rxcui: dm.minConcept?.rxcui,
      name: dm.minConcept?.name
    }));
  } catch {
    return [];
  }
}

/**
 * Parse interaction data into clean objects
 */
function parseInteractionData(data) {
  if (!data) return [];
  const interactions = [];
  const fullGroups = data.fullInteractionTypeGroup || [];
  fullGroups.forEach(group => {
    (group.fullInteractionType || []).forEach(interType => {
      const drug1 = interType.minConcept?.[0]?.name || 'Drug A';
      (interType.interactionPair || []).forEach(pair => {
        interactions.push({
          drug1,
          drug2: pair.interactionConcept?.[1]?.minConceptItem?.name || 'Drug B',
          severity: pair.severity || 'Unknown',
          description: pair.description || 'No description available.',
          severityColor: getSeverityColor(pair.severity),
          source: group.sourceDisclaimer || 'RxNav (NIH)'
        });
      });
    });
  });
  return interactions;
}

function getSeverityColor(severity) {
  if (!severity) return '#7f8c8d';
  const s = severity.toLowerCase();
  if (s.includes('high') || s.includes('severe') || s.includes('contraindicated')) return '#e74c3c';
  if (s.includes('moderate')) return '#f39c12';
  if (s.includes('low') || s.includes('minor')) return '#27ae60';
  return '#7f8c8d';
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
