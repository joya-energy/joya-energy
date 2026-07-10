import {
  isFlatItem,
  isOffgridItem,
  isPercentItem,
  isSolarM2Item,
  type SubventionCalculationInput,
  type SubventionCalculationResult,
  type SubventionCategory,
  type SubventionItem,
} from './subventions-fte.types';

export function formatSubventionAmount(value: number): string {
  return Math.round(value).toLocaleString('fr-FR');
}

export function getSubventionBadge(category: SubventionCategory, item: SubventionItem): string {
  if (category.type === 'percent' && isPercentItem(item)) {
    return `${Math.round(item.taux * 100)}%`;
  }
  if (isSolarM2Item(item)) {
    return `${Math.round(item.taux * 100)}%`;
  }
  if (category.type === 'flat' && isFlatItem(item)) {
    return `${item.amount.toLocaleString('fr-FR')} ${item.unit}`;
  }
  if (category.type === 'offgrid' && isOffgridItem(item)) {
    return `jusqu'à ${item.tiers[0].rate.toLocaleString('fr-FR')} DT/kW`;
  }
  return '';
}

export function calculateSubventionPrime(
  category: SubventionCategory,
  item: SubventionItem,
  input: SubventionCalculationInput
): SubventionCalculationResult {
  let prime = 0;
  let montant: number | null = null;
  let capHit = false;
  let capVal: number | null = null;
  let tauxLabel = '';

  if (category.type === 'percent' && isPercentItem(item)) {
    montant = input.montant;
    prime = montant * item.taux;
    capVal = item.plafond;
    if (prime > item.plafond) {
      prime = item.plafond;
      capHit = true;
    }
    tauxLabel = `${Math.round(item.taux * 100)}%`;
  } else if (isSolarM2Item(item)) {
    montant = input.montant;
    const byRate = montant * item.taux;
    const byM2 = input.surface * item.ratePerM2;
    prime = Math.min(byRate, byM2);
    capVal = byM2;
    capHit = byM2 < byRate;
    tauxLabel = '30% ou 250 DT/m²';
  } else if (category.type === 'flat' && isFlatItem(item)) {
    montant = null;
    prime = input.quantity * item.amount;
    tauxLabel = `${item.amount.toLocaleString('fr-FR')} DT/système`;
  } else if (category.type === 'offgrid' && isOffgridItem(item)) {
    const tier =
      item.tiers.find((entry) => input.power <= entry.max) ?? item.tiers[item.tiers.length - 1];
    prime = input.power * tier.rate;
    if (tier.cap) {
      capVal = tier.cap;
      if (prime > tier.cap) {
        prime = tier.cap;
        capHit = true;
      }
    }
    tauxLabel = `${tier.rate.toLocaleString('fr-FR')} DT/kW`;
    montant = null;
  }

  return {
    prime,
    montant,
    capHit,
    capVal,
    tauxLabel,
    itemName: item.name,
  };
}
