/**
 * PharmaScope Pro — Curated Local Drug Dataset
 * Contains renal/pediatric/geriatric dosing for top 50 commonly prescribed drugs
 * Sources: Lexicomp, Sanford Guide, KDIGO guidelines, AGS Beers Criteria 2023
 */

const DRUG_LOCAL_DATA = {
  amoxicillin: {
    genericName: "Amoxicillin",
    brandNames: ["Amoxil", "Trimox"],
    therapeuticClass: "Antibiotic — Aminopenicillin",
    mechanismOfAction: "Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), disrupting the final transpeptidation step of peptidoglycan synthesis.",
    cyp450: "Not significantly metabolized by CYP450",
    proteinBinding: "17–20%",
    halfLife: "1–1.5 hours (normal renal function)",
    volumeOfDistribution: "0.3 L/kg",
    bioavailability: "~90% oral",
    excretion: "Renal — 60–70% unchanged in urine",
    beersCriteria: false,
    adultDosing: [
      { indication: "Mild-Moderate Infections", dose: "250–500 mg orally every 8 hours OR 500–875 mg every 12 hours", duration: "7–10 days" },
      { indication: "H. pylori Eradication (Triple Therapy)", dose: "1000 mg every 12 hours with clarithromycin + PPI", duration: "14 days" },
      { indication: "Community-Acquired Pneumonia (mild)", dose: "1 g every 8 hours", duration: "5–7 days" }
    ],
    pediatricDosing: [
      { indication: "General Infections", dose: "25–50 mg/kg/day divided every 8–12h", maxDose: "500 mg/dose", ageRange: "≥3 months" },
      { indication: "Otitis Media (standard)", dose: "80–90 mg/kg/day divided every 12h", maxDose: "3000 mg/day", ageRange: "≥3 months" },
      { indication: "Neonates", dose: "20–30 mg/kg/day divided every 12h", maxDose: null, ageRange: "<3 months" }
    ],
    renalDosing: [
      { crcl: ">30", adjustment: "No dose adjustment required" },
      { crcl: "10–30", adjustment: "250–500 mg every 12 hours (avoid 875 mg formulation)" },
      { crcl: "<10", adjustment: "250–500 mg every 24 hours" },
      { crcl: "HD", adjustment: "Administer dose after dialysis session" }
    ],
    geriatricDosing: "No specific adjustment beyond renal function. Monitor for GI side effects. Use with caution in penicillin-allergic patients.",
    contraindications: ["Hypersensitivity to penicillins", "History of anaphylaxis to beta-lactams"],
    blackBoxWarning: null,
    keyInteractions: ["Warfarin (increased INR)", "Methotrexate (decreased clearance)", "Allopurinol (increased rash risk)"]
  },

  metformin: {
    genericName: "Metformin",
    brandNames: ["Glucophage", "Glumetza", "Fortamet"],
    therapeuticClass: "Antidiabetic — Biguanide",
    mechanismOfAction: "Activates AMP-activated protein kinase (AMPK), suppressing hepatic gluconeogenesis, improving insulin sensitivity in peripheral tissues, and reducing intestinal glucose absorption.",
    cyp450: "Not metabolized by CYP450; excreted unchanged",
    proteinBinding: "Negligible",
    halfLife: "6.2 hours (plasma); 17.6 hours (blood)",
    volumeOfDistribution: "654 L",
    bioavailability: "50–60% oral",
    excretion: "Renal — 90% unchanged in urine within 24 hours",
    beersCriteria: false,
    adultDosing: [
      { indication: "Type 2 Diabetes — Initial", dose: "500 mg twice daily OR 850 mg once daily with meals", duration: "Chronic" },
      { indication: "Type 2 Diabetes — Maintenance", dose: "1500–2550 mg/day in divided doses", maxDose: "2550 mg/day", duration: "Chronic" },
      { indication: "Extended-Release", dose: "500–2000 mg once daily with evening meal", duration: "Chronic" }
    ],
    pediatricDosing: [
      { indication: "Type 2 Diabetes", dose: "500 mg twice daily; titrate by 500 mg/week", maxDose: "2000 mg/day", ageRange: "≥10 years" },
      { indication: "Under 10 years", dose: "Not approved", maxDose: null, ageRange: "<10 years" }
    ],
    renalDosing: [
      { crcl: "≥45", adjustment: "No dose adjustment required" },
      { crcl: "30–44", adjustment: "Use with caution; consider dose reduction and more frequent monitoring; avoid initiation" },
      { crcl: "<30", adjustment: "CONTRAINDICATED — risk of lactic acidosis" },
      { crcl: "HD", adjustment: "CONTRAINDICATED" }
    ],
    geriatricDosing: "Start low (500 mg/day) and titrate slowly. Monitor eGFR every 3–6 months. Avoid in patients >80 unless confirmed adequate renal function. Vitamin B12 deficiency risk with long-term use.",
    contraindications: ["eGFR <30 mL/min/1.73m²", "Acute/Chronic metabolic acidosis", "Diabetic ketoacidosis", "Iodinated contrast dye within 48 hours"],
    blackBoxWarning: "LACTIC ACIDOSIS: Rare but fatal. Risk increases with renal impairment, liver disease, congestive heart failure, and alcohol use. Contraindicated with eGFR <30.",
    keyInteractions: ["Iodinated contrast (hold 48h before/after)", "Alcohol (lactic acidosis risk)", "Carbonic anhydrase inhibitors (lactic acidosis risk)", "Topiramate (lactic acidosis risk)"]
  },

  lisinopril: {
    genericName: "Lisinopril",
    brandNames: ["Prinivil", "Zestril"],
    therapeuticClass: "Antihypertensive — ACE Inhibitor",
    mechanismOfAction: "Inhibits angiotensin-converting enzyme (ACE), preventing conversion of angiotensin I to angiotensin II. Reduces vasoconstriction, aldosterone secretion, and sodium/water retention.",
    cyp450: "Not metabolized by CYP450",
    proteinBinding: "<10%",
    halfLife: "12 hours (effective); up to 30 hours",
    volumeOfDistribution: "Not well characterized",
    bioavailability: "~25% oral (active form)",
    excretion: "Renal — 100% unchanged",
    beersCriteria: false,
    adultDosing: [
      { indication: "Hypertension", dose: "10 mg once daily; usual range 20–40 mg/day", maxDose: "80 mg/day" },
      { indication: "Heart Failure", dose: "5 mg once daily; target 20–40 mg/day", maxDose: "40 mg/day" },
      { indication: "Post-MI", dose: "5 mg within 24h, then 5 mg at 24h, 10 mg at 48h, then 10 mg/day", maxDose: "10 mg/day" },
      { indication: "Diabetic Nephropathy", dose: "10–40 mg once daily", maxDose: "40 mg/day" }
    ],
    pediatricDosing: [
      { indication: "Hypertension", dose: "0.07 mg/kg/dose once daily", maxDose: "5 mg/dose initially", ageRange: "≥6 years" },
      { indication: "Under 6 years", dose: "Not recommended", ageRange: "<6 years" }
    ],
    renalDosing: [
      { crcl: ">30", adjustment: "Start at 10 mg/day — no adjustment needed for HTN" },
      { crcl: "10–30", adjustment: "Start at 5 mg/day; may titrate. Monitor potassium and SCr closely." },
      { crcl: "<10", adjustment: "Start at 2.5 mg/day; titrate cautiously" },
      { crcl: "HD", adjustment: "2.5 mg—start low; dialyzable (50% in 4h); supplement post-dialysis if needed" }
    ],
    geriatricDosing: "Start at 2.5–5 mg/day. High risk for first-dose hypotension. Monitor BUN, creatinine, potassium. Risk of fall from hypotension — flag in Beers Criteria context.",
    contraindications: ["History of ACE inhibitor-induced angioedema", "Bilateral renal artery stenosis", "Pregnancy (all trimesters)", "Concomitant use with sacubitril/valsartan within 36 hours", "Aliskiren with diabetes"],
    blackBoxWarning: "FETAL TOXICITY: When pregnancy is detected, discontinue immediately. Drugs that act directly on the renin-angiotensin system can cause injury and death to the developing fetus.",
    keyInteractions: ["NSAIDs (reduced efficacy + renal impairment)", "Potassium-sparing diuretics (hyperkalemia)", "Lithium (increased lithium toxicity)", "Aliskiren (contraindicated in diabetes)"]
  },

  atorvastatin: {
    genericName: "Atorvastatin",
    brandNames: ["Lipitor"],
    therapeuticClass: "Antilipemic — HMG-CoA Reductase Inhibitor (Statin)",
    mechanismOfAction: "Competitively inhibits HMG-CoA reductase, the rate-limiting enzyme in hepatic cholesterol synthesis. Upregulates LDL receptors, increasing LDL clearance.",
    cyp450: "CYP3A4 substrate (major)",
    proteinBinding: "≥98%",
    halfLife: "14 hours (atorvastatin); 20–30 hours (active metabolites)",
    volumeOfDistribution: "381 L",
    bioavailability: "12% (first-pass metabolism)",
    excretion: "Biliary/fecal — <2% renal",
    beersCriteria: false,
    adultDosing: [
      { indication: "Hyperlipidemia (moderate intensity)", dose: "10–20 mg once daily", maxDose: "20 mg/day" },
      { indication: "Hyperlipidemia (high intensity / ASCVD prevention)", dose: "40–80 mg once daily", maxDose: "80 mg/day" },
      { indication: "Acute Coronary Syndrome", dose: "80 mg once daily (high-intensity)", maxDose: "80 mg/day" }
    ],
    pediatricDosing: [
      { indication: "Heterozygous Familial Hypercholesterolemia", dose: "10 mg once daily; titrate to 20 mg/day", maxDose: "20 mg/day", ageRange: "10–17 years" },
      { indication: "Under 10 years", dose: "Not approved", ageRange: "<10 years" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No renal dose adjustment required. Primarily hepatic/biliary elimination." }
    ],
    geriatricDosing: "No pharmacokinetic adjustment needed. Monitor for myopathy/rhabdomyolysis — older adults are at higher risk. Review all CYP3A4 drug interactions.",
    contraindications: ["Active liver disease or unexplained persistent elevations of serum transaminases", "Pregnancy", "Breastfeeding"],
    blackBoxWarning: null,
    keyInteractions: ["Strong CYP3A4 inhibitors: clarithromycin, itraconazole (max 20 mg/day)", "Cyclosporine (max 10 mg/day)", "Gemfibrozil (increased myopathy risk)", "Niacin ≥1g/day (myopathy)"]
  },

  amlodipine: {
    genericName: "Amlodipine",
    brandNames: ["Norvasc"],
    therapeuticClass: "Antihypertensive — Calcium Channel Blocker (dihydropyridine)",
    mechanismOfAction: "Blocks L-type voltage-gated calcium channels in vascular smooth muscle and cardiac cells, causing vasodilation and reduced peripheral vascular resistance.",
    cyp450: "CYP3A4 substrate",
    proteinBinding: "93–98%",
    halfLife: "30–50 hours",
    volumeOfDistribution: "21 L/kg",
    bioavailability: "64–90% oral",
    excretion: "Renal — 60% as inactive metabolites; fecal 20–25%",
    beersCriteria: false,
    adultDosing: [
      { indication: "Hypertension", dose: "5 mg once daily; titrate to 10 mg/day", maxDose: "10 mg/day" },
      { indication: "Angina (Stable/Vasospastic)", dose: "5–10 mg once daily", maxDose: "10 mg/day" }
    ],
    pediatricDosing: [
      { indication: "Hypertension", dose: "0.1–0.3 mg/kg/day once daily", maxDose: "5 mg/day", ageRange: "1–17 years" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No renal dose adjustment required. Hepatic metabolism predominates." }
    ],
    geriatricDosing: "Start at 2.5 mg once daily. Risk of peripheral edema and orthostatic hypotension. Titrate slowly.",
    contraindications: ["Hypersensitivity to dihydropyridine calcium channel blockers", "Cardiogenic shock"],
    blackBoxWarning: null,
    keyInteractions: ["Cyclosporine (CYP3A4 inhibition; increased amlodipine levels)", "Simvastatin (limit simvastatin to 20 mg/day)", "Strong CYP3A4 inhibitors (increase amlodipine exposure)"]
  },

  omeprazole: {
    genericName: "Omeprazole",
    brandNames: ["Prilosec", "Losec"],
    therapeuticClass: "GI Agent — Proton Pump Inhibitor (PPI)",
    mechanismOfAction: "Irreversibly inhibits the H+/K+-ATPase enzyme (proton pump) in gastric parietal cells, blocking the final step of gastric acid secretion.",
    cyp450: "CYP2C19 (major), CYP3A4 (minor) substrate; inhibits CYP2C19",
    proteinBinding: "95%",
    halfLife: "0.5–1 hour (prolonged pharmacodynamic effect due to irreversible binding)",
    volumeOfDistribution: "0.34–0.36 L/kg",
    bioavailability: "~30–40% (increases with repeated dosing)",
    excretion: "Renal — 77%; fecal 18–23%",
    beersCriteria: true,
    beersNote: "Avoid scheduled use for >8 weeks unless high-risk patients (e.g., oral corticosteroids, anticoagulants). Risk of C. difficile, pneumonia, hypomagnesemia, bone fractures.",
    adultDosing: [
      { indication: "GERD — Erosive Esophagitis", dose: "20–40 mg once daily before meals", duration: "4–8 weeks" },
      { indication: "H. pylori Eradication", dose: "20 mg twice daily with antibiotics", duration: "14 days" },
      { indication: "Zollinger-Ellison Syndrome", dose: "60 mg once daily; adjust to response", maxDose: "120 mg/day TID" },
      { indication: "Stress Ulcer Prophylaxis (ICU)", dose: "40 mg IV/PO once daily" }
    ],
    pediatricDosing: [
      { indication: "GERD (≥1 year)", dose: "5–10 kg: 5 mg/day; 10–20 kg: 10 mg/day; >20 kg: 20 mg/day", ageRange: "1–16 years" },
      { indication: "Neonates", dose: "Not recommended (safety not established)", ageRange: "<1 year" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No dose adjustment required for renal impairment" }
    ],
    geriatricDosing: "Start at lowest effective dose. Avoid routine long-term use >8 weeks (Beers Criteria). Risk of hypomagnesemia, bone fractures, and C. difficile infection.",
    contraindications: ["Hypersensitivity to PPIs", "Concomitant use with rilpivirine-containing products"],
    blackBoxWarning: null,
    keyInteractions: ["Clopidogrel (CYP2C19 inhibition — reduced antiplatelet effect)", "Methotrexate (increased MTX levels)", "Rilpivirine (contraindicated)", "Atazanavir (reduced absorption)"]
  },

  metoprolol: {
    genericName: "Metoprolol",
    brandNames: ["Lopressor (tartrate)", "Toprol-XL (succinate)"],
    therapeuticClass: "Antihypertensive — Cardioselective Beta-1 Adrenergic Blocker",
    mechanismOfAction: "Selectively blocks beta-1 adrenergic receptors in cardiac tissue, reducing heart rate, contractility, and cardiac output. Reduces renin secretion.",
    cyp450: "CYP2D6 substrate (major)",
    proteinBinding: "12%",
    halfLife: "3–7 hours (tartrate); 3–7 hours (succinate, similar to tartrate but controlled release)",
    volumeOfDistribution: "3.2–5.6 L/kg",
    bioavailability: "~50% oral (extensive first-pass)",
    excretion: "Renal — 95% as metabolites",
    beersCriteria: false,
    adultDosing: [
      { indication: "Hypertension (tartrate)", dose: "50–100 mg twice daily", maxDose: "450 mg/day" },
      { indication: "Heart Failure (succinate)", dose: "Start 12.5–25 mg/day; double dose q2 weeks to target 200 mg/day", maxDose: "200 mg/day" },
      { indication: "Angina (tartrate)", dose: "50 mg 2–4 times daily", maxDose: "400 mg/day" },
      { indication: "Post-MI", dose: "50 mg every 6h starting 15 min after last IV dose → 100 mg twice daily" }
    ],
    pediatricDosing: [
      { indication: "Hypertension", dose: "1–2 mg/kg/day divided twice daily", maxDose: "200 mg/day", ageRange: "≥6 years" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No dose adjustment required. Hepatic metabolism predominates." }
    ],
    geriatricDosing: "Start at 25 mg/day. Slower titration needed. Monitor heart rate and blood pressure. Risk of bradycardia, fatigue, and depression.",
    contraindications: ["Severe bradycardia", "Second or third-degree AV block (without pacemaker)", "Cardiogenic shock", "Decompensated heart failure", "Sick sinus syndrome"],
    blackBoxWarning: "ABRUPT WITHDRAWAL: Do not abruptly discontinue therapy in ischemic heart disease — may precipitate angina, MI, or ventricular arrhythmia. Taper over 1–2 weeks.",
    keyInteractions: ["CYP2D6 inhibitors (fluoxetine, paroxetine — significantly increase levels)", "Verapamil/Diltiazem (AV block risk)", "Clonidine (rebound hypertension if clonidine withdrawn first)"]
  },

  azithromycin: {
    genericName: "Azithromycin",
    brandNames: ["Zithromax", "Z-Pak"],
    therapeuticClass: "Antibiotic — Macrolide",
    mechanismOfAction: "Binds to 50S ribosomal subunit of susceptible bacteria, inhibiting translocation of peptides during RNA-dependent protein synthesis.",
    cyp450: "Minor CYP3A4 substrate; inhibits CYP3A4 (weakly)",
    proteinBinding: "7–51% (concentration-dependent)",
    halfLife: "68 hours (tissue half-life extends antibacterial effect)",
    volumeOfDistribution: "31 L/kg (extensive tissue distribution)",
    bioavailability: "37% oral",
    excretion: "Fecal/biliary — 50%; renal 6%",
    beersCriteria: false,
    adultDosing: [
      { indication: "Community-Acquired Pneumonia (outpatient)", dose: "500 mg on Day 1, then 250 mg/day on Days 2–5", duration: "5 days" },
      { indication: "Sinusitis/Pharyngitis", dose: "500 mg once daily", duration: "3 days" },
      { indication: "STI — Gonorrhea (alternative)", dose: "2 g as a single dose" },
      { indication: "MAC Prophylaxis (HIV)", dose: "1200 mg once weekly" }
    ],
    pediatricDosing: [
      { indication: "Otitis Media", dose: "30 mg/kg as a single dose OR 10 mg/kg/day x3 days", maxDose: "500 mg/dose", ageRange: "≥6 months" },
      { indication: "CAP", dose: "10 mg/kg on Day 1, then 5 mg/kg/day Days 2–5", maxDose: "500 mg Day 1 / 250 mg Days 2–5", ageRange: "≥6 months" }
    ],
    renalDosing: [
      { crcl: ">10", adjustment: "No dose adjustment required" },
      { crcl: "<10", adjustment: "Use with caution; AUC may increase by ~35%" }
    ],
    geriatricDosing: "No specific adjustment. Be alert to QT prolongation risk — review all QT-prolonging medications before prescribing.",
    contraindications: ["Hypersensitivity to azithromycin or other macrolides", "History of cholestatic jaundice/hepatic dysfunction with prior azithromycin use"],
    blackBoxWarning: null,
    keyInteractions: ["QT-prolonging agents (additive risk — fluoroquinolones, antipsychotics)", "Warfarin (may increase INR)", "Digoxin (increased digoxin levels)"]
  },

  warfarin: {
    genericName: "Warfarin",
    brandNames: ["Coumadin", "Jantoven"],
    therapeuticClass: "Anticoagulant — Vitamin K Antagonist",
    mechanismOfAction: "Inhibits vitamin K epoxide reductase (VKORC1), preventing regeneration of active vitamin K1 and K2, thereby blocking hepatic synthesis of clotting factors II, VII, IX, and X.",
    cyp450: "S-warfarin: CYP2C9 (major); R-warfarin: CYP3A4, CYP1A2",
    proteinBinding: "99%",
    halfLife: "20–60 hours (mean 40 hours)",
    volumeOfDistribution: "0.14 L/kg",
    bioavailability: "~100% oral",
    excretion: "Renal — 92% as inactive metabolites",
    beersCriteria: true,
    beersNote: "Avoid in patients ≥65 with high fall risk unless benefit clearly outweighs risk (e.g., mechanical heart valve). Ensure INR monitoring is feasible.",
    adultDosing: [
      { indication: "DVT/PE Treatment", dose: "Individualized to INR 2.0–3.0; typical starting dose 2–5 mg/day", duration: "3–6 months minimum" },
      { indication: "Atrial Fibrillation", dose: "Individualized to INR 2.0–3.0" },
      { indication: "Mechanical Heart Valve", dose: "Individualized to INR 2.5–3.5" },
      { indication: "Initiation (pharmacogenomic)", dose: "Dose based on VKORC1/CYP2C9 genotype if available" }
    ],
    pediatricDosing: [
      { indication: "Thromboembolism", dose: "0.2 mg/kg/day (max 10 mg); adjust to target INR", maxDose: "10 mg", ageRange: "All pediatric ages with monitoring" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No specific renal dose adjustment; however, renal impairment may affect response. Monitor INR closely." }
    ],
    geriatricDosing: "Start at 2 mg/day (lower initial dose). Elderly patients are more sensitive to warfarin. Higher bleeding risk. Weekly INR monitoring until stable. Falls risk assessment mandatory.",
    contraindications: ["Active hemorrhage", "Pregnancy", "Severe hepatic impairment", "Recent cranial surgery/trauma", "Blood dyscrasias"],
    blackBoxWarning: "BLEEDING RISK: Can cause major or fatal bleeding. Regular INR monitoring required. Factors that increase bleeding risk include intensity of anticoagulation, patient age, variable INR, history of GI bleeding, hypertension, cerebrovascular disease.",
    keyInteractions: ["Major interactions with >200 drugs and foods. Key CYP2C9 inhibitors (increase INR): fluconazole, amiodarone, metronidazole. CYP2C9 inducers (decrease INR): rifampin, carbamazepine. Vitamin K-rich foods decrease INR."]
  },

  gabapentin: {
    genericName: "Gabapentin",
    brandNames: ["Neurontin", "Gralise", "Horizant"],
    therapeuticClass: "Anticonvulsant / Neuropathic Pain Agent",
    mechanismOfAction: "Binds to the α2δ subunit of voltage-gated calcium channels in the CNS, reducing calcium influx and modulating neurotransmitter release. Does not act on GABA receptors directly.",
    cyp450: "Not metabolized by CYP450",
    proteinBinding: "<3%",
    halfLife: "5–7 hours",
    volumeOfDistribution: "57.7 L",
    bioavailability: "60% at 300 mg/dose; decreases with higher doses (saturable absorption)",
    excretion: "Renal — 100% unchanged",
    beersCriteria: true,
    beersNote: "Use with caution in older adults — risk of ataxia, impaired psychomotor function, syncope, and falls. Avoid in those at high fall/fracture risk.",
    adultDosing: [
      { indication: "Postherpetic Neuralgia", dose: "300 mg on Day 1, 600 mg on Day 2, 900 mg on Days 3+; maintain 1800–3600 mg/day in 3 divided doses", maxDose: "3600 mg/day" },
      { indication: "Epilepsy (adjunctive)", dose: "300–1200 mg three times daily", maxDose: "3600 mg/day" }
    ],
    pediatricDosing: [
      { indication: "Epilepsy (adjunctive)", dose: "10–15 mg/kg/day in 3 divided doses; titrate over 3 days", maxDose: "50 mg/kg/day", ageRange: "3–12 years" },
      { indication: "≥12 years", dose: "Adult dosing", ageRange: "12+ years" }
    ],
    renalDosing: [
      { crcl: "≥60", adjustment: "900–3600 mg/day in 3 divided doses (standard)" },
      { crcl: "30–59", adjustment: "400–1400 mg/day in 2 divided doses" },
      { crcl: "15–29", adjustment: "200–700 mg once daily" },
      { crcl: "<15", adjustment: "100–300 mg once daily" },
      { crcl: "HD", adjustment: "125–350 mg after each 4-hour dialysis session" }
    ],
    geriatricDosing: "Start at 100–300 mg at bedtime. Titrate slowly. High fall risk. Assess cognitive function regularly. Reduce dose for any renal impairment.",
    contraindications: ["Hypersensitivity to gabapentin"],
    blackBoxWarning: "RESPIRATORY DEPRESSION: Serious, life-threatening respiratory depression can occur, particularly when used with CNS depressants (opioids, benzodiazepines, alcohol). Risk higher in COPD and elderly.",
    keyInteractions: ["CNS depressants/opioids (profound respiratory depression)", "Antacids containing aluminum/magnesium (reduce bioavailability — take 2h after)"]
  },

  hydrochlorothiazide: {
    genericName: "Hydrochlorothiazide (HCTZ)",
    brandNames: ["Microzide", "HydroDIURIL"],
    therapeuticClass: "Antihypertensive — Thiazide Diuretic",
    mechanismOfAction: "Inhibits Na+/Cl− cotransporter in the distal convoluted tubule, increasing excretion of sodium, chloride, and water. Also reduces peripheral vascular resistance with long-term use.",
    cyp450: "Not metabolized by CYP450",
    proteinBinding: "40–68%",
    halfLife: "6–15 hours",
    volumeOfDistribution: "3.6–7.8 L/kg",
    bioavailability: "65–75% oral",
    excretion: "Renal — 95% unchanged",
    beersCriteria: false,
    adultDosing: [
      { indication: "Hypertension", dose: "12.5–25 mg once daily; may increase to 50 mg/day", maxDose: "50 mg/day" },
      { indication: "Edema", dose: "25–100 mg/day as single or divided dose", maxDose: "100 mg/day" }
    ],
    pediatricDosing: [
      { indication: "Hypertension/Edema", dose: "1–3 mg/kg/day divided twice daily", maxDose: "37.5 mg/day (<2yr) / 100 mg/day (2–12yr)", ageRange: "Any age" }
    ],
    renalDosing: [
      { crcl: "≥30", adjustment: "Standard dose" },
      { crcl: "<30", adjustment: "Generally ineffective; avoid. Consider loop diuretic instead." },
      { crcl: "HD", adjustment: "Generally not used; ineffective in ESRD" }
    ],
    geriatricDosing: "Start at 12.5 mg/day. Monitor electrolytes (sodium, potassium, magnesium) and glucose. Higher risk of hyponatremia in elderly.",
    contraindications: ["Anuria", "Hypersensitivity to sulfonamide-derived drugs"],
    blackBoxWarning: null,
    keyInteractions: ["NSAIDs (reduced diuretic effect)", "Lithium (increased toxicity)", "Digoxin (hypokalemia potentiates toxicity)", "Antidiabetics (hyperglycemia)"]
  },

  sertraline: {
    genericName: "Sertraline",
    brandNames: ["Zoloft"],
    therapeuticClass: "Antidepressant — SSRI (Selective Serotonin Reuptake Inhibitor)",
    mechanismOfAction: "Selectively inhibits the reuptake of serotonin (5-HT) at the presynaptic neuronal membrane, increasing serotonergic neurotransmission.",
    cyp450: "CYP2C19, CYP2D6 (moderate inhibitor), CYP3A4, CYP2C9 substrate",
    proteinBinding: "~98%",
    halfLife: "26 hours",
    volumeOfDistribution: "20 L/kg",
    bioavailability: "44% oral",
    excretion: "Fecal 40–45%; renal 40–45% (as metabolites)",
    beersCriteria: true,
    beersNote: "SSRIs increase risk of SIADH/hyponatremia in older adults. Also increases bleeding risk (especially with NSAIDs). Increased fall risk.",
    adultDosing: [
      { indication: "Major Depressive Disorder", dose: "50 mg once daily; increase to 50–200 mg/day", maxDose: "200 mg/day" },
      { indication: "OCD", dose: "50 mg once daily; may increase to 200 mg/day", maxDose: "200 mg/day" },
      { indication: "PTSD / Social Anxiety / Panic Disorder", dose: "25 mg once daily initially; titrate to 50–200 mg/day", maxDose: "200 mg/day" }
    ],
    pediatricDosing: [
      { indication: "OCD (pediatric)", dose: "25 mg/day (13–17yr) or 25 mg/day (6–12yr)", maxDose: "200 mg/day", ageRange: "6–17 years" },
      { indication: "Depression", dose: "NOT approved for pediatric depression (MDD)", ageRange: "Any" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No dose adjustment required" }
    ],
    geriatricDosing: "Start at 25 mg/day. Titrate slowly. Monitor for hyponatremia (SIADH), increased fall risk, GI bleeding (especially with NSAIDs). Avoid abrupt discontinuation.",
    contraindications: ["Concurrent or within 14 days of MAO inhibitor use", "Pimozide coadministration", "With disulfiram (oral liquid contains alcohol)"],
    blackBoxWarning: "SUICIDALITY: Antidepressants increase the risk of suicidal thinking and behavior in children, adolescents, and young adults (18–24 years) with MDD. Monitor closely especially during initial months.",
    keyInteractions: ["MAO inhibitors (serotonin syndrome — contraindicated)", "Tramadol/fentanyl (serotonin syndrome)", "NSAIDs/anticoagulants (bleeding risk)", "Lithium (serotonin syndrome risk)"]
  },

  levothyroxine: {
    genericName: "Levothyroxine (T4)",
    brandNames: ["Synthroid", "Levoxyl", "Tirosint"],
    therapeuticClass: "Thyroid Hormone Replacement",
    mechanismOfAction: "Synthetic form of endogenous thyroxine (T4). Converted peripherally to T3. Binds nuclear thyroid hormone receptors, regulating metabolism, growth, and development.",
    cyp450: "Not significantly CYP metabolized",
    proteinBinding: "99.97%",
    halfLife: "6–7 days",
    volumeOfDistribution: "10–12 L",
    bioavailability: "40–80% oral (variable; best on empty stomach)",
    excretion: "Fecal (partially reabsorbed via enterohepatic recirculation); renal minimal",
    beersCriteria: false,
    adultDosing: [
      { indication: "Hypothyroidism (full replacement)", dose: "1.6 mcg/kg/day ideal body weight, once daily on empty stomach; typical: 75–125 mcg/day" },
      { indication: "Elderly / Cardiac Disease", dose: "25–50 mcg/day; increase by 12.5–25 mcg every 4–8 weeks" }
    ],
    pediatricDosing: [
      { indication: "Congenital Hypothyroidism (0–3 months)", dose: "10–15 mcg/kg/day", ageRange: "0–3 months" },
      { indication: "3–6 months", dose: "8–10 mcg/kg/day", ageRange: "3–6 months" },
      { indication: "6–12 months", dose: "6–8 mcg/kg/day", ageRange: "6–12 months" },
      { indication: "1–5 years", dose: "5–6 mcg/kg/day", ageRange: "1–5 years" },
      { indication: "6–12 years", dose: "4–5 mcg/kg/day", ageRange: "6–12 years" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No dose adjustment required. Adjust based on TSH." }
    ],
    geriatricDosing: "Start at 25 mcg/day; increase slowly. Target TSH 1–4 mIU/L in most elderly; slightly higher TSH may be acceptable (1–5). Risk of cardiac arrhythmia and angina with rapid titration.",
    contraindications: ["Uncorrected adrenal insufficiency (can precipitate adrenal crisis)", "Acute MI", "Thyrotoxicosis"],
    blackBoxWarning: "Do not use for obesity or weight loss — serious and life-threatening adverse events can occur with use of thyroid hormones for this indication.",
    keyInteractions: ["Calcium/iron supplements (reduce absorption — separate by 4h)", "Antacids/sucralfate (reduce absorption)", "Warfarin (increased anticoagulation)", "Cholestyramine (reduce absorption)"]
  },

  albuterol: {
    genericName: "Albuterol (Salbutamol)",
    brandNames: ["ProAir HFA", "Ventolin HFA", "Proventil HFA"],
    therapeuticClass: "Bronchodilator — Short-Acting Beta-2 Adrenergic Agonist (SABA)",
    mechanismOfAction: "Stimulates beta-2 adrenergic receptors in bronchial smooth muscle, activating adenyl cyclase and increasing cAMP, causing smooth muscle relaxation and bronchodilation.",
    cyp450: "Not significantly CYP metabolized",
    proteinBinding: "Low",
    halfLife: "2.7–5 hours",
    volumeOfDistribution: "2.2 L/kg",
    bioavailability: "Inhaled: ~25% systemic; oral: 100%",
    excretion: "Renal — 69–90% (as metabolites)",
    beersCriteria: false,
    adultDosing: [
      { indication: "Acute Bronchospasm (inhaler)", dose: "2 puffs (90 mcg/puff) every 4–6 hours PRN", maxDose: "12 puffs/day" },
      { indication: "Acute Severe Asthma (nebulizer)", dose: "2.5 mg every 20 min for 3 doses, then 2.5–10 mg every 1–4 hours PRN" },
      { indication: "Prevention of Exercise-Induced Bronchospasm", dose: "2 puffs 15–30 minutes before exercise" }
    ],
    pediatricDosing: [
      { indication: "Acute Bronchospasm (<4yr, nebulizer)", dose: "0.15 mg/kg (min 2.5 mg) every 20 min x3 doses", maxDose: "5 mg/dose", ageRange: "<4 years" },
      { indication: "Inhaler (≥4yr)", dose: "2 puffs every 4–6 hours PRN", ageRange: "≥4 years" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No dose adjustment required" }
    ],
    geriatricDosing: "Standard doses. Monitor for tachycardia, hypokalemia, and worsening of coronary artery disease. May worsen hypokalemia with high doses.",
    contraindications: ["Hypersensitivity to albuterol or any component"],
    blackBoxWarning: null,
    keyInteractions: ["MAO inhibitors/TCAs (potentiate cardiovascular effects)", "Beta-blockers (antagonize bronchodilation)", "Diuretics (additive hypokalemia)", "Digoxin (hypokalemia potentiates toxicity)"]
  },

  clopidogrel: {
    genericName: "Clopidogrel",
    brandNames: ["Plavix"],
    therapeuticClass: "Antiplatelet Agent — P2Y12 ADP Receptor Antagonist",
    mechanismOfAction: "Irreversibly inhibits ADP-induced platelet aggregation by selectively blocking the P2Y12 ADP receptor on platelets. Requires hepatic activation via CYP2C19.",
    cyp450: "Prodrug — CYP2C19 (major activation); CYP3A4 also involved",
    proteinBinding: "Parent: 94–98%; active metabolite: 94%",
    halfLife: "6–8 hours",
    volumeOfDistribution: "Not well characterized",
    bioavailability: "~50% oral absorption",
    excretion: "Renal — 50%; fecal 46%",
    beersCriteria: false,
    adultDosing: [
      { indication: "ACS / PCI (loading)", dose: "300–600 mg loading dose, then 75 mg once daily" },
      { indication: "Stroke / TIA Prevention", dose: "75 mg once daily" },
      { indication: "PAD", dose: "75 mg once daily" }
    ],
    pediatricDosing: [
      { indication: "Pediatric use", dose: "Not well established; limited data", ageRange: "Any" }
    ],
    renalDosing: [
      { crcl: "Any", adjustment: "No dose adjustment required, but use with caution in severe renal impairment (limited data)" }
    ],
    geriatricDosing: "No dose adjustment needed. Monitor for bleeding. CYP2C19 poor metabolizer status (common in some ethnicities) significantly reduces efficacy — consider genetic testing for high-risk patients.",
    contraindications: ["Active pathological bleeding", "Hypersensitivity to clopidogrel"],
    blackBoxWarning: "DIMINISHED EFFECTIVENESS IN POOR CYP2C19 METABOLIZERS: Tests are available to identify CYP2C19 poor metabolizers. Consider alternative antiplatelet therapy in known or suspected poor metabolizers.",
    keyInteractions: ["Omeprazole, esomeprazole (CYP2C19 inhibition — reduce efficacy)", "NSAIDs/aspirin (increased bleeding)", "Warfarin (increased bleeding risk)"]
  },

  furosemide: {
    genericName: "Furosemide",
    brandNames: ["Lasix"],
    therapeuticClass: "Diuretic — Loop Diuretic",
    mechanismOfAction: "Inhibits Na+/K+/2Cl− cotransporter in the thick ascending limb of the loop of Henle, producing profound natriuresis and diuresis.",
    cyp450: "Minimal CYP metabolism",
    proteinBinding: "91–99%",
    halfLife: "1–2 hours (normal renal function); prolonged in renal failure",
    volumeOfDistribution: "0.1–0.2 L/kg",
    bioavailability: "47–70% oral (variable)",
    excretion: "Renal — 60–70% unchanged; hepatic — 30–40%",
    beersCriteria: false,
    adultDosing: [
      { indication: "Edema (oral)", dose: "20–80 mg once or twice daily; titrate PRN", maxDose: "600 mg/day" },
      { indication: "Acute Pulmonary Edema (IV)", dose: "40 mg IV push over 1–2 min; may increase to 80 mg if inadequate response" },
      { indication: "Hypertension", dose: "40 mg twice daily" }
    ],
    pediatricDosing: [
      { indication: "Edema", dose: "0.5–1 mg/kg/dose every 6–24h", maxDose: "6 mg/kg/day", ageRange: "Any age" },
      { indication: "Neonates", dose: "0.5–1 mg/kg every 12–24h", ageRange: "Neonates" }
    ],
    renalDosing: [
      { crcl: "≥30", adjustment: "Standard dosing; may require higher doses to achieve adequate response" },
      { crcl: "10–30", adjustment: "Increase dose (80–200 mg); response is attenuated" },
      { crcl: "<10", adjustment: "Very high doses may be required (200–400 mg); limited efficacy" },
      { crcl: "HD", adjustment: "Not effectively removed by dialysis; dose 40–80 mg post-dialysis for fluid management" }
    ],
    geriatricDosing: "Start at lower doses (20 mg/day). Monitor electrolytes closely. High risk of dehydration, hyponatremia, hypokalemia, and orthostatic hypotension and falls.",
    contraindications: ["Anuria", "Hypersensitivity to furosemide or sulfonamides"],
    blackBoxWarning: "FLUID AND ELECTROLYTE IMBALANCE: Furosemide is a potent diuretic. Excessive amounts can lead to profound diuresis with water and electrolyte depletion. Careful medical supervision required.",
    keyInteractions: ["Ototoxic drugs (aminoglycosides — synergistic ototoxicity)", "Lithium (increased toxicity)", "NSAIDs (reduced diuretic effect)", "Digoxin (hypokalemia increases toxicity)"]
  }
};

// Beers Criteria Summary
const BEERS_CRITERIA_DRUGS = [
  { drug: "Omeprazole (and all PPIs)", risk: "C. difficile, hypomagnesemia, bone fractures, pneumonia with long-term use >8 weeks", recommendation: "Avoid unless high-risk GI conditions" },
  { drug: "Gabapentin / Pregabalin", risk: "Ataxia, falls, cognitive impairment, respiratory depression", recommendation: "Use with caution; start low and titrate slowly" },
  { drug: "Warfarin", risk: "Increased bleeding risk with falls", recommendation: "Consider risk/benefit. Ensure INR monitoring is feasible." },
  { drug: "Sertraline and SSRIs", risk: "SIADH, hyponatremia, falls, GI bleeding", recommendation: "Use with caution; monitor sodium" },
  { drug: "Benzodiazepines (all)", risk: "Cognitive impairment, delirium, falls, fractures, MVA risk", recommendation: "Avoid in older adults; taper if long-term user" },
  { drug: "Muscle relaxants (cyclobenzaprine, methocarbamol)", risk: "Anticholinergic effects, sedation, falls", recommendation: "Avoid" },
  { drug: "Diphenhydramine (Benadryl) and first-gen antihistamines", risk: "Anticholinergic: confusion, constipation, urinary retention", recommendation: "Avoid" },
  { drug: "NSAIDs (ibuprofen, naproxen — chronic)", risk: "GI bleeding/ulcer, renal impairment, fluid retention, worsening heart failure", recommendation: "Avoid unless alternatives not effective; topical preferred" }
];

// Drug class → therapeutic area mapping
const THERAPEUTIC_CLASSES = {
  antibiotics: ["amoxicillin", "azithromycin", "ciprofloxacin", "doxycycline", "trimethoprim-sulfamethoxazole"],
  antihypertensives: ["lisinopril", "amlodipine", "metoprolol", "hydrochlorothiazide", "furosemide", "losartan"],
  antidiabetics: ["metformin", "insulin", "glipizide", "sitagliptin"],
  anticoagulants: ["warfarin", "clopidogrel", "apixaban", "rivaroxaban"],
  statins: ["atorvastatin", "rosuvastatin", "simvastatin"],
  gi: ["omeprazole", "pantoprazole"],
  neuro_psych: ["sertraline", "gabapentin", "alprazolam"],
  thyroid: ["levothyroxine"],
  respiratory: ["albuterol", "fluticasone"]
};

function getDrugLocalData(drugName) {
  if (!drugName) return null;
  const key = drugName.toLowerCase().replace(/\s+/g, '').split(/[^a-z]/)[0];
  for (const [dbKey, data] of Object.entries(DRUG_LOCAL_DATA)) {
    if (key.includes(dbKey) || dbKey.includes(key) || data.genericName.toLowerCase().includes(key) || 
        data.brandNames.some(b => b.toLowerCase().includes(key))) {
      return data;
    }
  }
  return null;
}
