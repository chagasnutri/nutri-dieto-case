/**
 * Biblioteca de Consulta da Tabela TACO (4ª Edição - UNICAMP)
 */
import tacoData from "../data/taco.json";

export interface TacoFoodItem {
  id: number;
  nome: string;
  categoria?: string;
  kcal: number;
  cho: number;
  ptn: number;
  lip: number;
  fibra?: number;
  calcio?: number;
  ferro?: number;
  sodio?: number;
  potassio?: number;
}

export function searchTacoFood(query: string): TacoFoodItem[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return (tacoData as TacoFoodItem[]).filter(item => {
    const itemNorm = item.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return itemNorm.includes(q);
  });
}

export function calculateNutrientsForPortion(food: TacoFoodItem, grams: number) {
  const factor = grams / 100;
  return {
    kcal: Math.round(food.kcal * factor * 10) / 10,
    cho: Math.round(food.cho * factor * 10) / 10,
    ptn: Math.round(food.ptn * factor * 10) / 10,
    lip: Math.round(food.lip * factor * 10) / 10,
    fibra: Math.round((food.fibra || 0) * factor * 10) / 10,
    sodio: Math.round((food.sodio || 0) * factor * 10) / 10
  };
}
