/**
 * PharmaScope Pro — DrugBank Local Search API
 * Searches the local DrugBank index and loads full drug data
 */

let drugIndex = null;

/**
 * Load the drug index from data/index.json
 */
async function loadDrugIndex() {
  if (drugIndex) return drugIndex;
  try {
    const res = await fetch('data/index.json');
    if (!res.ok) throw new Error('Failed to load drug index');
    drugIndex = await res.json();
    return drugIndex;
  } catch (err) {
    console.error('Drug index load error:', err);
    return [];
  }
}

/**
 * Search drugs by name
 */
async function searchDrugs(query) {
  if (!query || query.trim().length < 2) return [];
  const index = await loadDrugIndex();
  const q = query.toLowerCase().trim();
  const matches = index.filter(drug => drug.name.toLowerCase().includes(q));
  const results = [];
  for (const match of matches.slice(0, 50)) {
    try {
      const res = await fetch(`data/drugs/${match.id}.json`);
      if (res.ok) results.push(await res.json());
    } catch (err) {
      console.warn(`Failed to load drug ${match.id}`);
    }
  }
  return results;
}

/**
 * Get autocomplete suggestions
 */
async function getSuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  const index = await loadDrugIndex();
  const q = query.toLowerCase().trim();
  return index
    .filter(drug => drug.name.toLowerCase().includes(q))
    .slice(0, 10)
    .map(drug => ({ name: drug.name, type: drug.type || 'Drug' }));
}

/**
 * Select a suggestion
 */
function selectSuggestion(drugName) {
  performSearch(drugName);
  hideSuggestions();
}
