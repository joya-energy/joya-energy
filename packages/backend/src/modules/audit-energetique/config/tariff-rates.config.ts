import { EnergyTariffTypes } from '@shared/enums/audit-energetique.enum';

export const TARIFF_RATES: Record<EnergyTariffTypes, number> = {
  [EnergyTariffTypes.BT]: 0.38,
  [EnergyTariffTypes.MT]: 0.32,
  [EnergyTariffTypes.HT]: 0.27
};



