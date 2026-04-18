const fs = require('fs');
const path = require('path');
const sax = require('sax');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// Update SOURCE_XML to the path of your local DrugBank full-database XML file.
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_XML = path.join('C:', 'Users', 'senth', 'Downloads', 'drugbank.xml', 'drugbank.xml');
const DATA_DIR = path.join(__dirname, '..', 'data');
const DRUGS_DIR = path.join(DATA_DIR, 'drugs');

// Ensure output directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DRUGS_DIR)) fs.mkdirSync(DRUGS_DIR, { recursive: true });

if (!fs.existsSync(SOURCE_XML)) {
  console.error(`Error: Could not find DrugBank XML at ${SOURCE_XML}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: initialise a blank drug object with every field we capture
// ─────────────────────────────────────────────────────────────────────────────
function newDrug() {
  return {
    id: null,
    name: '',
    description: '',
    indication: '',
    toxicity: '',
    mechanismOfAction: '',
    pharmacodynamics: '',

    // ── Pharmacokinetics ──────────────────────────────────────────────────
    absorption: '',
    halfLife: '',
    proteinBinding: '',
    routeOfElimination: '',
    volumeOfDistribution: '',
    clearance: '',

    // ── Dosing ────────────────────────────────────────────────────────────
    dosages: [],          // [{ form, route, strength }]

    // ── Classification ────────────────────────────────────────────────────
    atcCodes: [],         // ['A01BC02', ...]
    categories: [],       // [{ name, meshId }]
    synonyms: [],

    // ── Identifiers ───────────────────────────────────────────────────────
    cas: '',
    unii: '',

    // ── Interactions ──────────────────────────────────────────────────────
    interactions: [],     // [{ id, name, description }]
    foodInteractions: [], // ['Avoid grapefruit juice', ...]

    // ── Brand / regulatory ────────────────────────────────────────────────
    brandNames: [],
    groups: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deduplication helper
// ─────────────────────────────────────────────────────────────────────────────
function dedup(arr) {
  return [...new Set(arr.map(s => (typeof s === 'string' ? s.trim() : s)).filter(Boolean))];
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser
// ─────────────────────────────────────────────────────────────────────────────
const parseDrugBank = () => {
  return new Promise((resolve, reject) => {
    console.log('Starting DrugBank XML parse...');
    const stream = fs.createReadStream(SOURCE_XML, 'utf8');
    const saxStream = sax.createStream(true, { trim: true, normalize: true });

    let currentDrug        = null;
    let currentInteraction = null;
    let currentDosage      = null;
    let currentCategory    = null;
    let nodePath           = [];

    const indexData    = [];
    let processedCount = 0;

    // ── Error ────────────────────────────────────────────────────────────
    saxStream.on('error', (e) => {
      console.error('SAX Parser Error:', e);
      reject(e);
    });

    // ── Open tag ─────────────────────────────────────────────────────────
    saxStream.on('opentag', (node) => {
      nodePath.push(node.name);

      // Top-level <drug> element → start a new drug record
      if (node.name === 'drug' && nodePath.length === 2) {
        currentDrug = newDrug();
        return;
      }

      if (!currentDrug) return;

      if (node.name === 'drug-interaction' && nodePath.length === 4) {
        currentInteraction = { id: '', name: '', description: '' };

      } else if (node.name === 'dosage' && nodePath.length === 4) {
        currentDosage = { form: '', route: '', strength: '' };

      } else if (node.name === 'category' && nodePath.length === 4) {
        currentCategory = { name: '', meshId: '' };

      } else if (node.name === 'atc-code' && node.attributes && node.attributes.code) {
        // ATC code is stored in the `code` attribute: <atc-code code="A01BC02">
        currentDrug.atcCodes.push(node.attributes.code.trim());
      }
    });

    // ── Text content ─────────────────────────────────────────────────────
    saxStream.on('text', (text) => {
      if (!currentDrug || !text.trim()) return;

      const p = nodePath.join('.');

      // ── Core identity ────────────────────────────────────────────────
      if (p === 'drugbank.drug.drugbank-id') {
        if (!currentDrug.id) currentDrug.id = text.trim();

      } else if (p === 'drugbank.drug.name') {
        currentDrug.name = text.trim();

      } else if (p === 'drugbank.drug.description') {
        currentDrug.description += text;

      } else if (p === 'drugbank.drug.indication') {
        currentDrug.indication += text;

      } else if (p === 'drugbank.drug.toxicity') {
        currentDrug.toxicity += text;

      } else if (p === 'drugbank.drug.mechanism-of-action') {
        currentDrug.mechanismOfAction += text;

      } else if (p === 'drugbank.drug.pharmacodynamics') {
        currentDrug.pharmacodynamics += text;

      // ── Pharmacokinetics ─────────────────────────────────────────────
      } else if (p === 'drugbank.drug.absorption') {
        currentDrug.absorption += text;

      } else if (p === 'drugbank.drug.half-life') {
        currentDrug.halfLife += text;

      } else if (p === 'drugbank.drug.protein-binding') {
        currentDrug.proteinBinding += text;

      } else if (p === 'drugbank.drug.route-of-elimination') {
        currentDrug.routeOfElimination += text;

      } else if (p === 'drugbank.drug.volume-of-distribution') {
        currentDrug.volumeOfDistribution += text;

      } else if (p === 'drugbank.drug.clearance') {
        currentDrug.clearance += text;

      // ── Dosing ───────────────────────────────────────────────────────
      } else if (p === 'drugbank.drug.dosages.dosage.form' && currentDosage) {
        currentDosage.form += text;

      } else if (p === 'drugbank.drug.dosages.dosage.route' && currentDosage) {
        currentDosage.route += text;

      } else if (p === 'drugbank.drug.dosages.dosage.strength' && currentDosage) {
        currentDosage.strength += text;

      // ── Classification ───────────────────────────────────────────────
      } else if (p === 'drugbank.drug.categories.category.category' && currentCategory) {
        currentCategory.name += text;

      } else if (p === 'drugbank.drug.categories.category.mesh-id' && currentCategory) {
        currentCategory.meshId += text;

      } else if (p === 'drugbank.drug.synonyms.synonym') {
        currentDrug.synonyms.push(text.trim());

      // ── Identifiers ──────────────────────────────────────────────────
      } else if (p === 'drugbank.drug.cas-number') {
        currentDrug.cas += text.trim();

      } else if (p === 'drugbank.drug.unii') {
        currentDrug.unii += text.trim();

      // ── Brand names ──────────────────────────────────────────────────
      } else if (p === 'drugbank.drug.international-brands.international-brand.name') {
        currentDrug.brandNames.push(text.trim());

      // ── Groups ───────────────────────────────────────────────────────
      } else if (p === 'drugbank.drug.groups.group') {
        currentDrug.groups.push(text.trim());

      // ── Food interactions ────────────────────────────────────────────
      } else if (p === 'drugbank.drug.food-interactions.food-interaction') {
        currentDrug.foodInteractions.push(text.trim());

      // ── Drug–drug interactions ───────────────────────────────────────
      } else if (p === 'drugbank.drug.drug-interactions.drug-interaction.drugbank-id' && currentInteraction) {
        currentInteraction.id += text.trim();

      } else if (p === 'drugbank.drug.drug-interactions.drug-interaction.name' && currentInteraction) {
        currentInteraction.name += text;

      } else if (p === 'drugbank.drug.drug-interactions.drug-interaction.description' && currentInteraction) {
        currentInteraction.description += text;
      }
    });

    // ── Close tag ─────────────────────────────────────────────────────────
    saxStream.on('closetag', (nodeName) => {
      nodePath.pop();

      if (!currentDrug) return;

      if (nodeName === 'drug-interaction' && currentInteraction) {
        if (currentInteraction.id || currentInteraction.name) {
          currentDrug.interactions.push({
            id:          currentInteraction.id.trim(),
            name:        currentInteraction.name.trim(),
            description: currentInteraction.description.trim(),
          });
        }
        currentInteraction = null;

      } else if (nodeName === 'dosage' && currentDosage) {
        if (currentDosage.form || currentDosage.route || currentDosage.strength) {
          currentDrug.dosages.push({
            form:     currentDosage.form.trim(),
            route:    currentDosage.route.trim(),
            strength: currentDosage.strength.trim(),
          });
        }
        currentDosage = null;

      } else if (nodeName === 'category' && currentCategory) {
        if (currentCategory.name) {
          currentDrug.categories.push({
            name:   currentCategory.name.trim(),
            meshId: currentCategory.meshId.trim(),
          });
        }
        currentCategory = null;

      } else if (nodeName === 'drug' && nodePath.length === 1) {
        // Finished a top-level <drug> element — clean up and write
        if (currentDrug.id && currentDrug.name) {

          // Deduplicate array fields
          currentDrug.synonyms        = dedup(currentDrug.synonyms);
          currentDrug.brandNames      = dedup(currentDrug.brandNames);
          currentDrug.groups          = dedup(currentDrug.groups);
          currentDrug.atcCodes        = dedup(currentDrug.atcCodes);
          currentDrug.foodInteractions = dedup(currentDrug.foodInteractions);

          // Trim all string fields
          const strFields = [
            'description','indication','toxicity','mechanismOfAction','pharmacodynamics',
            'absorption','halfLife','proteinBinding','routeOfElimination',
            'volumeOfDistribution','clearance','cas','unii',
          ];
          for (const f of strFields) {
            if (typeof currentDrug[f] === 'string') currentDrug[f] = currentDrug[f].trim();
          }

          fs.writeFileSync(
            path.join(DRUGS_DIR, `${currentDrug.id}.json`),
            JSON.stringify(currentDrug)
          );

          indexData.push({
            id:   currentDrug.id,
            name: currentDrug.name,
            type: currentDrug.groups.includes('approved') ? 'Approved' : 'Other',
          });

          processedCount++;
          if (processedCount % 1000 === 0) {
            console.log(`  Processed ${processedCount} drugs...`);
          }
        }
        currentDrug = null;
      }
    });

    // ── Done ─────────────────────────────────────────────────────────────
    saxStream.on('end', () => {
      console.log(`\nFinished! Total drugs saved: ${processedCount}`);

      fs.writeFileSync(
        path.join(DATA_DIR, 'index.json'),
        JSON.stringify(indexData)
      );
      console.log('Search index saved to data/index.json');
      resolve();
    });

    stream.pipe(saxStream);
  });
};

parseDrugBank().catch(console.error);
