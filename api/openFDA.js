/**
 * PharmaScope Pro — Local DrugBank API Service
 * Fetches from locally generated static JSON files
 */

let searchIndexCache = null;

async function fetchSearchIndex() {
  if (searchIndexCache) return searchIndexCache;
  try {
    const res = await fetch('/data/index.json');
    if (!res.ok) throw new Error('Failed to load search index');
    searchIndexCache = await res.json();
    return searchIndexCache;
  } catch (err) {
    console.warn('Could not load search index:', err);
    return [];
  }
}

/**
 * Search for drugs by name (brand or generic)
 * Returns an array of matching drug objects
 */
async function searchDrugs(query) {
  if (!query || query.trim().length < 2) return [];
  const qStr = query.toLowerCase().trim();
  const index = await fetchSearchIndex();
  
  // Find matches where name starts with query or includes query
  const matches = index.filter(d => d.name.toLowerCase().includes(qStr));
  
  // Sort exact start matches higher
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(qStr);
    const bStarts = b.name.toLowerCase().startsWith(qStr);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.length - b.name.length;
  });

  // Limit to 10 results
  const topMatches = matches.slice(0, 10);
  
  // Fetch full details for the top matches
  const detailedResults = await Promise.all(topMatches.map(async m => {
    return await getDrugLabel(m.id);
  }));
  
  return detailedResults.filter(Boolean); // remove nulls
}

/**
 * Get full drug profile by DB id
 */
async function getDrugLabel(idOrName) {
  let id = idOrName;
  // If it's a name, resolve id from index
  if (!id.startsWith('DB')) {
     const index = await fetchSearchIndex();
     const match = index.find(d => d.name.toLowerCase() === idOrName.toLowerCase());
     if (!match) return null;
     id = match.id;
  }

  try {
    const res = await fetch(`/data/drugs/${id}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Label fetch attempt failed:', err);
    return null;
  }
}

/**
 * Auto-suggest search (for dropdown)
 */
async function getSuggestions(query) {
  if (!query || query.length < 2) return [];
  const qStr = query.toLowerCase().trim();
  const index = await fetchSearchIndex();
  
  const matches = index.filter(d => d.name.toLowerCase().includes(qStr));
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(qStr);
    const bStarts = b.name.toLowerCase().startsWith(qStr);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.length - b.name.length;
  });

  return matches.slice(0, 8).map(m => ({ name: m.name, type: m.type }));
}

// These endpoints are no longer used but kept empty for compatibility with app.js
async function getAdverseEvents(drugName) {
  return null; 
}
async function getDrugRecalls(drugName) {
  return null;
}

/**
 * Offline Drug Interaction Checker
 * Cross-references local DrugBank JSON files
 */
async function checkLocalInteractions(drugNames) {
  if (!drugNames || drugNames.length < 2) return { missing: [], interactions: [] };
  
  // 1. Resolve typed names to Drug IDs using the index
  const index = await fetchSearchIndex();
  const resolved = drugNames.map(name => {
    const q = name.toLowerCase().trim();
    // Try exact name match first
    let match = index.find(d => d.name.toLowerCase() === q);
    // Try partial lookup if exact fails
    if (!match) match = index.find(d => d.name.toLowerCase().includes(q));
    return match ? { name: match.name, id: match.id, original: name } : null;
  });

  const validDrugs = resolved.filter(Boolean);
  const missingDrugs = resolved.map((r, i) => r ? null : drugNames[i]).filter(Boolean);
  
  if (validDrugs.length < 2) return { missing: missingDrugs, interactions: [] };

  // 2. Fetch the JSON profiles locally
  const profiles = await Promise.all(validDrugs.map(async d => {
    try {
      const res = await fetch(`/data/drugs/${d.id}.json`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }));

  const interactionsFound = [];
  const validProfiles = profiles.filter(Boolean);

  // 3. Cross check all pairs (bi-directional check)
  for (let i = 0; i < validProfiles.length; i++) {
    for (let j = i + 1; j < validProfiles.length; j++) {
      const p1 = validProfiles[i];
      const p2 = validProfiles[j];
      
      let matched = false;

      // Check if p1's interactions list contains p2's ID or name
      const p1Match = p1.interactions && p1.interactions.find(inter => inter.id === p2.id || inter.name.toLowerCase() === p2.name.toLowerCase());
      if (p1Match) {
         interactionsFound.push({
           drug1: p1.name,
           drug2: p2.name,
           description: p1Match.description,
           severity: 'Unknown',
           severityColor: '#e67e22',
           source: 'DrugBank Database'
         });
         matched = true;
      }
      
      // Check if p2's list contains p1
      if (!matched) {
        const p2Match = p2.interactions && p2.interactions.find(inter => inter.id === p1.id || inter.name.toLowerCase() === p1.name.toLowerCase());
        if (p2Match) {
           interactionsFound.push({
             drug1: p1.name,
             drug2: p2.name,
             description: p2Match.description,
             severity: 'Unknown',
             severityColor: '#e67e22',
             source: 'DrugBank Database'
           });
        }
      }
    }
  }

  return { missing: missingDrugs, interactions: interactionsFound };
}
