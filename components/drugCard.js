// PharmaScope Pro - Drug Card Component

window._drugRegistry = [];

function renderDrugCards(results, onSelect) {
  if (!results || results.length === 0) {
    return '<div class="no-results"><div class="no-results-icon">&#128269;</div><h3>No drugs found</h3><p>Try a different spelling or search by generic name</p></div>';
  }
  window._drugRegistry = results;
  var cards = results.map(function(result, index) {
    var info = extractCardInfo(result);
    return createDrugCard(info, index);
  });
  return '<div class="drug-cards-grid">' + cards.join('') + '</div>';
}

function extractCardInfo(result) {
  var indicationRaw = result.indication || '';
  var indication = indicationRaw.replace(/<[^>]+>/g, '').substring(0, 160).trim();
  return {
    brandName: result.name,
    genericName: result.brandNames && result.brandNames.length > 0 ? result.brandNames[0] : '',
    manufacturer: '',
    pharmClass: result.groups && result.groups.length > 0 ? result.groups[0] : 'Drug',
    indication: indication ? indication + (indicationRaw.length > 160 ? '...' : '') : null,
    hasBlackBox: false,
    rawResult: result
  };
}

function createDrugCard(info, index) {
  var localData = getDrugLocalData(info.genericName || info.brandName);
  var therapeuticClass = (localData && localData.therapeuticClass) ? localData.therapeuticClass : (info.pharmClass || 'Pharmaceutical Agent');
  var classColor = getClassColor(therapeuticClass);
  var indication = info.indication ? '<div class="drug-indication"><span class="indication-label">INDICATIONS:</span><p>' + escapeHtml(info.indication) + '</p></div>' : '';
  return '<div class="drug-card" style="animation-delay:' + (index * 60) + 'ms">' +
    '<div class="drug-card-header">' +
    '<span class="drug-class-badge" style="background:' + classColor + '20;color:' + classColor + ';border-color:' + classColor + '40">' + getClassIcon(therapeuticClass) + ' ' + escapeHtml(therapeuticClass) + '</span>' +
    '</div>' +
    '<h3 class="drug-name">' + escapeHtml(info.brandName) + '</h3>' +
    (info.genericName ? '<p class="drug-generic">' + escapeHtml(info.genericName) + '</p>' : '') +
    indication +
    '<div class="drug-card-footer">' +
    '<button class="view-profile-btn" onclick="selectDrug(window._drugRegistry[' + index + '])">View Profile &rarr;</button>' +
    '</div>' +
    '</div>';
}

function getClassColor(cls) {
  if (!cls) return '#00d4aa';
  var c = cls.toLowerCase();
  if (c.includes('antibiotic') || c.includes('antimicrobial')) return '#00d4aa';
  if (c.includes('anticoagulant') || c.includes('antiplatelet')) return '#e74c3c';
  if (c.includes('antihypertensive') || c.includes('ace') || c.includes('beta')) return '#3498db';
  if (c.includes('antidiabetic') || c.includes('insulin') || c.includes('biguanide')) return '#2ecc71';
  if (c.includes('statin') || c.includes('lipid')) return '#9b59b6';
  if (c.includes('ssri') || c.includes('antidepressant')) return '#e91e63';
  if (c.includes('analgesic') || c.includes('opioid') || c.includes('nsaid')) return '#ff5722';
  if (c.includes('proton pump') || c.includes('ppi')) return '#ff9800';
  if (c.includes('steroid') || c.includes('corticosteroid')) return '#795548';
  if (c.includes('thyroid')) return '#00bcd4';
  if (c.includes('antifungal')) return '#8bc34a';
  if (c.includes('antiviral')) return '#607d8b';
  if (c.includes('diuretic')) return '#26c6da';
  return '#00d4aa';
}

function getClassIcon(cls) {
  if (!cls) return '&#128138;';
  var c = cls.toLowerCase();
  if (c.includes('antibiotic')) return '&#129440;';
  if (c.includes('anticoagulant')) return '&#129641;';
  if (c.includes('antihypertensive') || c.includes('ace') || c.includes('beta')) return '&#10084;&#65039;';
  if (c.includes('antidiabetic') || c.includes('biguanide')) return '&#129658;';
  if (c.includes('statin')) return '&#128300;';
  if (c.includes('ssri') || c.includes('antidepressant')) return '&#129504;';
  if (c.includes('thyroid')) return '&#129419;';
  if (c.includes('diuretic')) return '&#128167;';
  return '&#128138;';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
