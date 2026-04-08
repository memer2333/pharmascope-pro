const fs = require('fs');
const path = require('path');
const sax = require('sax');

const SOURCE_XML = path.join('C:', 'Users', 'senth', 'Downloads', 'drugbank.xml', 'drugbank.xml');
const DATA_DIR = path.join(__dirname, '..', 'data');
const DRUGS_DIR = path.join(DATA_DIR, 'drugs');

// Ensure output directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DRUGS_DIR)) fs.mkdirSync(DRUGS_DIR);

if (!fs.existsSync(SOURCE_XML)) {
  console.error(`Error: Could not find DrugBank XML at ${SOURCE_XML}`);
  process.exit(1);
}

const parseDrugBank = () => {
  return new Promise((resolve, reject) => {
    console.log('Starting DrugBank XML Parse...');
    const stream = fs.createReadStream(SOURCE_XML, 'utf8');
    
    // Configure SAX parser
    const saxStream = sax.createStream(true, { trim: true, normalize: true });
    
    let currentDrug = null;
    let currentInteraction = null;
    let currentTag = null;
    let nodePath = [];
    
    const indexData = [];
    let processedCount = 0;

    saxStream.on('error', (e) => {
      console.error('SAX Parser Error:', e);
      reject(e);
    });

    saxStream.on('opentag', (node) => {
      nodePath.push(node.name);
      currentTag = node.name;

      if (node.name === 'drug' && nodePath.length === 2) { // <drugbank><drug>
        currentDrug = {
          id: null,
          name: '',
          description: '',
          indication: '',
          toxicity: '',
          mechanismOfAction: '',
          pharmacodynamics: '',
          brandNames: [],
          groups: [],
          interactions: []
        };
      } else if (node.name === 'drug-interaction' && nodePath.length === 4) {
        currentInteraction = { id: '', name: '', description: '' };
      }
    });

    saxStream.on('text', (text) => {
      if (!currentDrug || !text.trim()) return;

      const pathStr = nodePath.join('.');

      if (pathStr === 'drugbank.drug.name') {
        currentDrug.name = text;
      } else if (pathStr === 'drugbank.drug.description') {
        currentDrug.description += text;
      } else if (pathStr === 'drugbank.drug.indication') {
        currentDrug.indication += text;
      } else if (pathStr === 'drugbank.drug.toxicity') {
        currentDrug.toxicity += text;
      } else if (pathStr === 'drugbank.drug.mechanism-of-action') {
         currentDrug.mechanismOfAction += text;
      } else if (pathStr === 'drugbank.drug.pharmacodynamics') {
         currentDrug.pharmacodynamics += text;
      } else if (pathStr === 'drugbank.drug.drugbank-id') {
        if (!currentDrug.id) currentDrug.id = text;
      } else if (pathStr === 'drugbank.drug.groups.group') {
        currentDrug.groups.push(text);
      } else if (pathStr === 'drugbank.drug.international-brands.international-brand.name') {
         currentDrug.brandNames.push(text);
      } else if (pathStr === 'drugbank.drug.drug-interactions.drug-interaction.drugbank-id' && currentInteraction) {
         currentInteraction.id += text;
      } else if (pathStr === 'drugbank.drug.drug-interactions.drug-interaction.name' && currentInteraction) {
         currentInteraction.name += text;
      } else if (pathStr === 'drugbank.drug.drug-interactions.drug-interaction.description' && currentInteraction) {
         currentInteraction.description += text;
      }
    });

    saxStream.on('closetag', (nodeName) => {
      nodePath.pop();
      if (nodeName === 'drug-interaction' && currentInteraction) {
        if (currentInteraction.id || currentInteraction.name) {
          currentDrug.interactions.push(currentInteraction);
        }
        currentInteraction = null;
      } else if (nodeName === 'drug' && currentDrug) {
        // We only care about approved drugs or a subset if desired.
        // For now take everything that has an ID and name.
        if (currentDrug.id && currentDrug.name) {
          // Write drug JSON
          fs.writeFileSync(
            path.join(DRUGS_DIR, `${currentDrug.id}.json`), 
            JSON.stringify(currentDrug)
          );
          
          // Add to index
          indexData.push({
            id: currentDrug.id,
            name: currentDrug.name,
            type: currentDrug.groups.includes('approved') ? 'Approved' : 'Other'
          });
          
          processedCount++;
          if (processedCount % 1000 === 0) {
            console.log(`Processed ${processedCount} drugs...`);
          }
        }
        currentDrug = null;
      }
    });

    saxStream.on('end', () => {
      console.log(`\nFinished processing! Total drugs saved: ${processedCount}`);
      
      // Write Index
      fs.writeFileSync(
        path.join(DATA_DIR, 'index.json'), 
        JSON.stringify(indexData)
      );
      console.log(`Search index saved to data/index.json`);
      resolve();
    });

    stream.pipe(saxStream);
  });
};

parseDrugBank().catch(console.error);
