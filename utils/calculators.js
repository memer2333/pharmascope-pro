/**
 * PharmaScope Pro — Clinical Calculators
 * Cockcroft-Gault CrCl, Pediatric mg/kg, IBW, BSA
 */

/**
 * Cockcroft-Gault Creatinine Clearance
 * CrCl (mL/min) = [(140 - age) × weight × 0.85(if female)] / (72 × SCr)
 */
function calculateCrCl({ age, weight, scr, sex, useIBW = false }) {
  age = parseFloat(age);
  weight = parseFloat(weight);
  scr = parseFloat(scr);
  if (!age || !weight || !scr || age <= 0 || weight <= 0 || scr <= 0) {
    return { error: 'Please enter valid positive values for all fields.' };
  }
  const sexFactor = sex === 'female' ? 0.85 : 1.0;
  const crcl = ((140 - age) * weight * sexFactor) / (72 * scr);
  const crclRounded = Math.round(crcl * 10) / 10;
  const stage = getRenalStage(crclRounded);
  const adjustmentTier = getRenalAdjustmentTier(crclRounded);
  return {
    value: crclRounded,
    unit: 'mL/min',
    stage,
    adjustmentTier,
    interpretation: getRenalInterpretation(crclRounded),
    egfr: estimateEGFR(crclRounded),
    color: stage.color
  };
}

function getRenalStage(crcl) {
  if (crcl >= 90) return { label: 'Normal / High', ckdStage: 'CKD Stage 1 (if structural damage)', color: '#00d4aa' };
  if (crcl >= 60) return { label: 'Mildly Decreased', ckdStage: 'CKD Stage 2', color: '#4ecdc4' };
  if (crcl >= 45) return { label: 'Mildly-Moderately Decreased', ckdStage: 'CKD Stage 3a', color: '#ffe66d' };
  if (crcl >= 30) return { label: 'Moderately-Severely Decreased', ckdStage: 'CKD Stage 3b', color: '#ffa500' };
  if (crcl >= 15) return { label: 'Severely Decreased', ckdStage: 'CKD Stage 4', color: '#ff6b6b' };
  return { label: 'Kidney Failure / ESRD', ckdStage: 'CKD Stage 5', color: '#c0392b' };
}

function getRenalAdjustmentTier(crcl) {
  if (crcl >= 60) return '>60';
  if (crcl >= 30) return '30-59';
  if (crcl >= 15) return '15-29';
  if (crcl > 0) return '<15';
  return 'HD';
}

function getRenalInterpretation(crcl) {
  if (crcl >= 60) return 'No dose adjustment typically required for most medications.';
  if (crcl >= 30) return 'Dose reduction may be required for renally-eliminated drugs. Review each medication carefully.';
  if (crcl >= 15) return 'Significant dose reduction required for renally-eliminated drugs. Consult pharmacist.';
  return 'Severe impairment — most drugs require major dose reduction or are contraindicated. Dialysis may be required.';
}

function estimateEGFR(crcl) {
  return Math.round(crcl);
}

/**
 * Ideal Body Weight (IBW) — Devine Formula
 */
function calculateIBW({ heightCm, sex }) {
  const heightIn = heightCm / 2.54;
  const base = sex === 'female' ? 45.5 : 50;
  const ibw = base + 2.3 * (heightIn - 60);
  return Math.max(0, Math.round(ibw * 10) / 10);
}

/**
 * Adjusted Body Weight (AdjBW) — for obese patients
 */
function calculateAdjBW({ ibw, actualWeight }) {
  return Math.round((ibw + 0.4 * (actualWeight - ibw)) * 10) / 10;
}

/**
 * Body Surface Area — Mosteller formula
 * BSA (m²) = sqrt(height(cm) × weight(kg) / 3600)
 */
function calculateBSA({ heightCm, weightKg }) {
  const bsa = Math.sqrt((heightCm * weightKg) / 3600);
  return Math.round(bsa * 100) / 100;
}

/**
 * Pediatric Dosing Calculator
 * @param {number} weightKg - Patient weight in kg
 * @param {number} dosePerKg - Dose in mg/kg
 * @param {number} maxDose - Maximum dose cap in mg (optional)
 * @returns {object} - Calculated dose with details
 */
function calculatePediatricDose({ weightKg, dosePerKg, maxDose, frequency }) {
  weightKg = parseFloat(weightKg);
  dosePerKg = parseFloat(dosePerKg);
  maxDose = maxDose ? parseFloat(maxDose) : null;
  if (!weightKg || !dosePerKg || weightKg <= 0 || dosePerKg <= 0) {
    return { error: 'Please enter valid weight and dose per kg values.' };
  }
  const calculatedDose = Math.round(weightKg * dosePerKg * 10) / 10;
  const cappedDose = maxDose ? Math.min(calculatedDose, maxDose) : calculatedDose;
  const wasCapped = maxDose && calculatedDose > maxDose;
  return {
    calculatedDose,
    finalDose: cappedDose,
    wasCapped,
    maxDose,
    weightKg,
    dosePerKg,
    frequency: frequency || '',
    dailyDose: frequency ? getDailyDose(cappedDose, frequency) : null,
    note: wasCapped
      ? `Dose capped at maximum of ${maxDose} mg (calculated was ${calculatedDose} mg)`
      : `Dose = ${weightKg} kg × ${dosePerKg} mg/kg = ${calculatedDose} mg`
  };
}

function getDailyDose(dose, frequency) {
  const freqMap = { 'q4h': 6, 'q6h': 4, 'q8h': 3, 'q12h': 2, 'q24h': 1, 'once daily': 1, 'twice daily': 2, 'three times daily': 3 };
  const multiplier = freqMap[frequency.toLowerCase()] || null;
  return multiplier ? dose * multiplier : null;
}

/**
 * Vancomycin AUC/MIC Dosing Helper (clinical utility)
 */
function calculateVancomycinDose({ weightKg, crcl }) {
  weightKg = parseFloat(weightKg);
  crcl = parseFloat(crcl);
  if (!weightKg || !crcl) return { error: 'Enter weight and CrCl to estimate vancomycin dose.' };
  // Target AUC/MIC 400-600 (ASHP/IDSA guidelines 2020)
  const dailyAUCTarget = 500;
  const cl_van = (0.0189 * crcl + 0.0048) * 1000 * 60; // mL/hr converted
  const estDailyDose = dailyAUCTarget * cl_van / 1000; // mg/day
  const doseQ12 = Math.round(estDailyDose / 2 / 250) * 250;
  const doseQ8 = Math.round(estDailyDose / 3 / 250) * 250;
  return {
    estimatedDailyDose: Math.round(estDailyDose),
    suggestedQ12: doseQ12,
    suggestedQ8: doseQ8,
    note: 'Estimate only — obtain AUC-guided TDM (troughs are no longer recommended as primary monitoring).',
    target: 'Target AUC/MIC 400–600 mg·h/L (ASHP/IDSA 2020 guidelines)'
  };
}

/**
 * Body Mass Index
 */
function calculateBMI({ weightKg, heightCm }) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;
  let category;
  if (bmi < 18.5) category = { label: 'Underweight', color: '#ffe66d' };
  else if (bmi < 25) category = { label: 'Normal weight', color: '#00d4aa' };
  else if (bmi < 30) category = { label: 'Overweight', color: '#ffa500' };
  else if (bmi < 35) category = { label: 'Obese Class I', color: '#ff6b6b' };
  else if (bmi < 40) category = { label: 'Obese Class II', color: '#e74c3c' };
  else category = { label: 'Obese Class III (Severe)', color: '#c0392b' };
  return { value: rounded, category };
}
