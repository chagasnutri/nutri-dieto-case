/**
 * Módulo de Cálculos Clínico-Nutricionais - DietoCase
 * Implementação das 5 equações preditivas abertas e fórmulas antropométricas de Chumlea (1985)
 */

export interface PatientAnthropometry {
  idade: number;
  sexo: "M" | "F";
  pesoKg: number;
  alturaCm: number;
  alturaJoelhoCm?: number;
  circunferenciaBracoCm?: number;
  circunferenciaPanturrilhaCm?: number;
  dobraSubescapularMm?: number;
  fatorAtividade: number;
  fatorInjuria?: number;
}

export interface PredictiveEquationsResult {
  bolso: { minKcal: number; maxKcal: number; mediaKcal: number };
  harrisBenedict: number;
  mifflinStJeor: number;
  faoOms: number;
  eerIom: number;
}

/**
 * 1. Regra de Bolso (20 a 35 kcal/kg de acordo com o objetivo clínico)
 */
export function calculateBolso(pesoKg: number, minKcalKg = 25, maxKcalKg = 30) {
  const min = Math.round(pesoKg * minKcalKg);
  const max = Math.round(pesoKg * maxKcalKg);
  return {
    minKcal: min,
    maxKcal: max,
    mediaKcal: Math.round((min + max) / 2)
  };
}

/**
 * 2. Harris & Benedict (1919)
 */
export function calculateHarrisBenedict(p: PatientAnthropometry): number {
  const { pesoKg, alturaCm, idade, sexo, fatorAtividade, fatorInjuria = 1.0 } = p;
  let geb = 0;
  if (sexo === "M") {
    geb = 66.5 + (13.75 * pesoKg) + (5.003 * alturaCm) - (6.755 * idade);
  } else {
    geb = 655.1 + (9.563 * pesoKg) + (1.850 * alturaCm) - (4.676 * idade);
  }
  return Math.round(geb * fatorAtividade * fatorInjuria);
}

/**
 * 3. Mifflin-St Jeor (1990)
 */
export function calculateMifflinStJeor(p: PatientAnthropometry): number {
  const { pesoKg, alturaCm, idade, sexo, fatorAtividade } = p;
  let geb = (10 * pesoKg) + (6.25 * alturaCm) - (5 * idade);
  geb += (sexo === "M" ? 5 : -161);
  return Math.round(geb * fatorAtividade);
}

/**
 * 4. FAO / OMS (1985/2001)
 */
export function calculateFaoOms(p: PatientAnthropometry): number {
  const { pesoKg, idade, sexo, fatorAtividade } = p;
  let geb = 0;
  if (sexo === "M") {
    if (idade >= 18 && idade < 30) geb = (15.057 * pesoKg) + 692.2;
    else if (idade >= 30 && idade < 60) geb = (11.472 * pesoKg) + 873.1;
    else geb = (11.711 * pesoKg) + 587.7;
  } else {
    if (idade >= 18 && idade < 30) geb = (14.818 * pesoKg) + 486.6;
    else if (idade >= 30 && idade < 60) geb = (8.126 * pesoKg) + 845.6;
    else geb = (9.082 * pesoKg) + 658.5;
  }
  return Math.round(geb * fatorAtividade);
}

/**
 * 5. EER / IOM (DRI 2002/2006)
 */
export function calculateEerIom(p: PatientAnthropometry): number {
  const { pesoKg, alturaCm, idade, sexo, fatorAtividade } = p;
  const alturaM = alturaCm / 100;
  let eer = 0;
  // Coeficiente de Atividade Física (CAF)
  const caf = fatorAtividade <= 1.2 ? 1.0 : fatorAtividade <= 1.5 ? 1.12 : 1.27;
  if (sexo === "M") {
    eer = 662 - (9.53 * idade) + caf * (15.91 * pesoKg + 539.6 * alturaM);
  } else {
    eer = 354 - (6.91 * idade) + caf * (9.36 * pesoKg + 726 * alturaM);
  }
  return Math.round(eer);
}

/**
 * Executa todas as 5 equações simultaneamente para análise comparativa
 */
export function calculateAllPredictiveEquations(p: PatientAnthropometry): PredictiveEquationsResult {
  return {
    bolso: calculateBolso(p.pesoKg),
    harrisBenedict: calculateHarrisBenedict(p),
    mifflinStJeor: calculateMifflinStJeor(p),
    faoOms: calculateFaoOms(p),
    eerIom: calculateEerIom(p)
  };
}

/**
 * Fórmulas de Estimativa Antropométrica Alternativa de Chumlea et al. (1985/1988)
 */
export function calculateChumleaHeight(alturaJoelhoCm: number, idadeAnos: number, sexo: "M" | "F"): number {
  if (sexo === "M") {
    return Math.round(64.19 - (0.04 * idadeAnos) + (2.02 * alturaJoelhoCm));
  } else {
    return Math.round(84.88 - (0.24 * idadeAnos) + (1.83 * alturaJoelhoCm));
  }
}

export function calculateChumleaWeight(
  alturaJoelhoCm: number,
  circBracoCm: number,
  circPanturrilhaCm: number,
  dobraSubescapularMm: number,
  sexo: "M" | "F"
): number {
  if (sexo === "M") {
    const peso = (alturaJoelhoCm * 0.98) + (circBracoCm * 1.16) + (circPanturrilhaCm * 1.73) + (dobraSubescapularMm * 0.37) - 81.69;
    return Math.round(peso * 10) / 10;
  } else {
    const peso = (alturaJoelhoCm * 1.27) + (circBracoCm * 0.87) + (circPanturrilhaCm * 0.98) + (dobraSubescapularMm * 0.4) - 62.35;
    return Math.round(peso * 10) / 10;
  }
}

