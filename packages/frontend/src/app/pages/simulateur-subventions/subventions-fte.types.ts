export type SubventionCategoryKey = 'immateriel' | 'materiel' | 'prosol' | 'offgrid';

export type SubventionCategoryType = 'percent' | 'flat' | 'offgrid';

export interface OffgridTier {
  max: number;
  rate: number;
  cap?: number;
}

export interface SubventionItemBase {
  id: string;
  name: string;
  desc: string;
}

export interface PercentSubventionItem extends SubventionItemBase {
  taux: number;
  plafond: number;
}

export interface SolarM2SubventionItem extends SubventionItemBase {
  kind: 'solar_m2';
  taux: number;
  ratePerM2: number;
}

export interface FlatSubventionItem extends SubventionItemBase {
  amount: number;
  unit: string;
}

export interface OffgridSubventionItem extends SubventionItemBase {
  tiers: OffgridTier[];
}

export type SubventionItem =
  | PercentSubventionItem
  | SolarM2SubventionItem
  | FlatSubventionItem
  | OffgridSubventionItem;

export interface SubventionCategory {
  title: string;
  desc: string;
  range: string;
  type: SubventionCategoryType;
  items: SubventionItem[];
}

export interface SubventionCalculationInput {
  montant: number;
  surface: number;
  quantity: number;
  power: number;
}

export interface SubventionCalculationResult {
  prime: number;
  montant: number | null;
  capHit: boolean;
  capVal: number | null;
  tauxLabel: string;
  itemName: string;
}

export function isSolarM2Item(item: SubventionItem): item is SolarM2SubventionItem {
  return 'kind' in item && item.kind === 'solar_m2';
}

export function isOffgridItem(item: SubventionItem): item is OffgridSubventionItem {
  return 'tiers' in item;
}

export function isFlatItem(item: SubventionItem): item is FlatSubventionItem {
  return 'amount' in item && 'unit' in item;
}

export function isPercentItem(item: SubventionItem): item is PercentSubventionItem {
  return 'taux' in item && 'plafond' in item && !isSolarM2Item(item);
}
