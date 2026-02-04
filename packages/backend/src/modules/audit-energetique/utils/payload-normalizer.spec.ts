import {
  mergeExtractedValues,
  sanitizeAuditPayload,
  type AuditRequestPayload,
  type ExtractedAuditData
} from './payload-normalizer';
import {
  Governorates,
  BuildingTypes,
  ClimateZones
} from '@shared/enums/audit-general.enum';
import {
  ConditionedCoverage,
  CoolingSystemTypes,
  DomesticHotWaterTypes,
  GlazingTypes,
  HeatingSystemTypes,
  InsulationQualities,
  VentilationSystems
} from '@shared/enums/audit-batiment.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energy-tariff';
import { EquipmentCategories, ExistingMeasures, LightingTypes } from '@shared/enums/audit-usage.enum';

describe('payload-normalizer', () => {
  describe('mergeExtractedValues', () => {
    it('fills missing fields and normalizes governorate from extracted data', () => {
      const body: AuditRequestPayload = {};
      const extracted: ExtractedAuditData = {
        monthlyBillAmount: { value: 100 },
        recentBillConsumption: { value: 900 },
        tariffType: { value: EnergyTariffTypes.BT },
        contractedPower: { value: 12 },
        address: { value: '123 Rue Exemple' },
        governorate: { value: 'Ariàna ' } // with accent + trailing space
      };

      const result = mergeExtractedValues(body, extracted);

      expect(result.monthlyBillAmount).toBe(100);
      expect(result.recentBillConsumption).toBe(900);
      expect(result.tariffType).toBe(EnergyTariffTypes.BT);
      expect(result.contractedPower).toBe(12);
      expect(result.address).toBe('123 Rue Exemple');
      expect(result.governorate).toBe(Governorates.ARIANA);
      // default when not provided
      expect(result.hasRecentBill).toBe(true);
    });

    it('does not override already provided fields', () => {
      const body: AuditRequestPayload = {
        monthlyBillAmount: 50,
        address: 'Existing address',
        hasRecentBill: false
      };
      const extracted: ExtractedAuditData = {
        monthlyBillAmount: { value: 200 },
        address: { value: 'New address' }
      };

      const result = mergeExtractedValues(body, extracted);

      expect(result.monthlyBillAmount).toBe(50);
      expect(result.address).toBe('Existing address');
      expect(result.hasRecentBill).toBe(false);
    });
  });

  describe('sanitizeAuditPayload', () => {
    const basePayload = (hasRecentBill: boolean, includeRecentValue: boolean): AuditRequestPayload => ({
      fullName: 'John Doe',
      companyName: 'ACME',
      email: 'john@example.com',
      phoneNumber: '12345678',
      address: '1 rue test',
      governorate: Governorates.ARIANA,
      buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
      surfaceArea: 120,
      floors: 2,
      activityType: 'Services',
      openingDaysPerWeek: 5,
      openingHoursPerDay: 9,
      insulation: InsulationQualities.MEDIUM,
      glazingType: GlazingTypes.DOUBLE,
      ventilation: VentilationSystems.SINGLE_FLOW,
      climateZone: ClimateZones.NORTH,
      heatingSystem: HeatingSystemTypes.GAS_BOILER,
      coolingSystem: CoolingSystemTypes.SPLIT,
      conditionedCoverage: ConditionedCoverage.HALF_BUILDING,
      domesticHotWater: DomesticHotWaterTypes.ELECTRIC,
      equipmentCategories: [EquipmentCategories.LIGHTING],
      tariffType: EnergyTariffTypes.BT,
      contractedPower: 15,
      monthlyBillAmount: 300,
      hasRecentBill,
      recentBillConsumption: includeRecentValue ? 800 : undefined,
      billAttachmentUrl: null,
      existingMeasures: [ExistingMeasures.LED],
      lightingType: LightingTypes.LED
    });

    it('returns sanitized payload and keeps recentBillConsumption undefined when hasRecentBill is false', () => {
      const payload = basePayload(false, false);
      const sanitized = sanitizeAuditPayload(payload);

      expect(sanitized.hasRecentBill).toBe(false);
      expect(sanitized.recentBillConsumption).toBeUndefined();
      expect(sanitized.governorate).toBe(Governorates.ARIANA);
    });

    it('sanitizes payload when recentBillConsumption is provided', () => {
      const payload = basePayload(true, true);
      const sanitized = sanitizeAuditPayload(payload);

      expect(sanitized.hasRecentBill).toBe(true);
      expect(sanitized.recentBillConsumption).toBe(800);
      expect(sanitized.tariffType).toBe(EnergyTariffTypes.BT);
    });

    it('throws when hasRecentBill is true but recentBillConsumption is missing', () => {
      const payload = basePayload(true, false);
      expect(() => sanitizeAuditPayload(payload)).toThrow();
    });
  });
});

