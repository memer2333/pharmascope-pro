// PharmaScope Pro - Drug Profile Renderer
// Renders clinical drug profile directly from DrugBank JSON + DailyMed label

function renderDrugProfile(drug, localData, dailyMedLabel, adverseEvents, interactions) {
  if (!drug) return '<div class="error-state"><p>No drug data available.</p></div>';

  var name = drug.name || 'Unknown Drug';
  var brands = (drug.brandNames && drug.brandNames.length > 0) ? drug.brandNames.join(', ') : '';
  var groups = (drug.groups && drug.groups.length > 0) ? drug.groups.join(', ') : '';
  var indication = drug.indication || '';
  var mechanism = drug.mechanism || '';
  var halfLife = drug.halfLife || '';
  var absorption = drug.absorption || '';
  var metabolism = drug.metabolism || '';
  var toxicity = drug.toxicity || '';
  var proteinBinding = drug.proteinBinding || '';
  var volumeDist = drug.volumeOfDistribution || '';
  var clearance = drug.clearance || '';
  var categories = (drug.categories && drug.categories.length > 0) ? drug.categories.map(function(c) { return c.category || c; }).slice(0, 5).join(', ') : '';

  // Use localData overrides when available
  var therapeuticClass = (localData && localData.therapeuticClass) ? localData.therapeuticClass : groups;
  var localIndication = (localData && localData.indications) ? localData.indications : indication;
  var localWarnings = (localData && localData.warnings) ? localData.warnings : (drug.toxicity || '');

  // Use DailyMed enrichment when available
  var dosage = (dailyMedLabel && dailyMedLabel.dosage) ? dailyMedLabel.dosage : ((localData && localData.generalDosing) ? localData.generalDosing : '');
  var warnings = (dailyMedLabel && dailyMedLabel.warnings) ? dailyMedLabel.warnings : localWarnings;
  var boxedWarning = (dailyMedLabel && dailyMedLabel.boxedWarning) ? dailyMedLabel.boxedWarning : ((localData && localData.blackBoxWarning) ? localData.blackBoxWarning : '');
  var contraindications = (dailyMedLabel && dailyMedLabel.contraindications) ? dailyMedLabel.contraindications : '';
  var adverseRx = (dailyMedLabel && dailyMedLabel.adverseReactions) ? dailyMedLabel.adverseReactions : '';
  var drugInteractions = (dailyMedLabel && dailyMedLabel.drugInteractions) ? dailyMedLabel.drugInteractions : '';
  var pkText = (dailyMedLabel && dailyMedLabel.pharmacokinetics) ? dailyMedLabel.pharmacokinetics : '';
  var pregnancyText = (dailyMedLabel && dailyMedLabel.useInPregnancy) ? dailyMedLabel.useInPregnancy : '';
  var pediatricText = (dailyMedLabel && dailyMedLabel.pediatricUse) ? dailyMedLabel.pediatricUse : '';
  var geriatricText = (dailyMedLabel && dailyMedLabel.geriatricUse) ? dailyMedLabel.geriatricUse : '';
  var overdosageText = (dailyMedLabel && dailyMedLabel.overdosage) ? dailyMedLabel.overdosage : '';

  function section(title, content) {
    if (!content || !content.trim()) return '';
    var safe = escapeHtml(content.replace(/<[^>]*>/g, '').trim());
    if (!safe) return '';
    return '<div class="info-card"><h4 class="card-title">' + title + '</h4><div class="card-content"><p>' + safe.substring(0, 1000) + (safe.length > 1000 ? '...' : '') + '</p></div></div>';
  }

  var bbwBanner = boxedWarning ? '<div class="boxed-warning"><strong>&#9888; BOXED WARNING:</strong> ' + escapeHtml(boxedWarning.replace(/<[^>]*>/g, '').substring(0, 300)) + '</div>' : '';

  var header = '<div class="profile-header">' +
    '<div class="drug-name-section">' +
    '<h1 class="drug-profile-name">' + escapeHtml(name) + '</h1>' +
    (brands ? '<p class="drug-brands">Brands: <em>' + escapeHtml(brands) + '</em></p>' : '') +
    (therapeuticClass ? '<span class="profile-class-badge">' + escapeHtml(therapeuticClass) + '</span>' : '') +
    (groups ? '<span class="profile-groups">' + escapeHtml(groups) + '</span>' : '') +
    '</div>' +
    '<button class="back-btn" onclick="history.go(-1)||renderHomePage()">&#8592; Back</button>' +
    '</div>';

  var tabNav = '<div class="profile-tabs-wrapper"><nav class="profile-tabs" role="tablist">' +
    '<button class="tab-btn active" data-tab="general" onclick="switchTab(&#39;general&#39;)" role="tab">General</button>' +
    '<button class="tab-btn" data-tab="dosing" onclick="switchTab(&#39;dosing&#39;)" role="tab">Dosing</button>' +
    '<button class="tab-btn" data-tab="safety" onclick="switchTab(&#39;safety&#39;)" role="tab">Safety</button>' +
    '<button class="tab-btn" data-tab="pharmacology" onclick="switchTab(&#39;pharmacology&#39;)" role="tab">ADME</button>' +
    '</nav></div>';

  var generalTab = '<div id="tab-general" class="tab-panel active">' +
    section('Indications & Usage', localIndication || indication) +
    section('Mechanism of Action', mechanism) +
    section('Drug Categories', categories) +
    '</div>';

  var dosingTab = '<div id="tab-dosing" class="tab-panel">' +
    section('Dosage & Administration', dosage) +
    section('Pediatric Dosing', pediatricText) +
    section('Geriatric Dosing', geriatricText) +
    section('Overdosage', overdosageText) +
    '</div>';

  var safetyTab = '<div id="tab-safety" class="tab-panel">' +
    section('Warnings & Precautions', warnings) +
    section('Contraindications', contraindications) +
    section('Adverse Reactions', adverseRx) +
    section('Drug Interactions', drugInteractions) +
    section('Use in Pregnancy', pregnancyText) +
    '</div>';

  var admeTab = '<div id="tab-pharmacology" class="tab-panel">' +
    section('Pharmacokinetics', pkText) +
    section('Absorption', absorption) +
    section('Metabolism', metabolism) +
    section('Half-Life', halfLife) +
    section('Protein Binding', proteinBinding) +
    section('Volume of Distribution', volumeDist) +
    section('Clearance', clearance) +
    '</div>';

  return '<div class="drug-profile" id="drug-profile">' +
    header +
    bbwBanner +
    tabNav +
    '<div class="tab-content">' +
    generalTab +
    dosingTab +
    safetyTab +
    admeTab +
    '</div>' +
    '</div>';
}

function getClassColor(cls) {
  if (!cls) return '#00d4aa';
  var c = cls.toLowerCase();
  if (c.includes('antibiotic') || c.includes('antimicrobial')) return '#00d4aa';
  if (c.includes('anticoagulant')) return '#e74c3c';
  if (c.includes('antihypertensive') || c.includes('ace') || c.includes('beta')) return '#3498db';
  if (c.includes('antidiabetic') || c.includes('biguanide')) return '#2ecc71';
  if (c.includes('statin')) return '#9b59b6';
  if (c.includes('ssri') || c.includes('antidepressant')) return '#e91e63';
  if (c.includes('thyroid')) return '#00bcd4';
  if (c.includes('diuretic')) return '#26c6da';
  return '#00d4aa';
}
