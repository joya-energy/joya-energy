import type {
  FactureExtraiteBtRaw,
  FactureExtraiteMtRaw,
  StegAnalyseResponse,
} from '../interfaces/analyse-facture.interface';

function isMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  const text = String(value).trim();
  return text !== '' && text !== '-';
}

function countMeaningfulFields(facture: FactureExtraiteBtRaw | FactureExtraiteMtRaw): number {
  return Object.values(facture).filter(isMeaningfulValue).length;
}

export function isStegAnalyseResponseEmpty(response: StegAnalyseResponse): boolean {
  const facture = response.facture_extraite;
  if (!facture) {
    return true;
  }
  return countMeaningfulFields(facture) < 3;
}
