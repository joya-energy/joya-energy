import type { ExtractedBillData } from '@shared/interfaces/bill-extraction.interface';

/**
 * Solar audit fields extracted from bill data
 */
export interface SolarAuditBillFields {
  /** Monthly bill amount in TND (BillAmountDividedByPeriod) */
  measuredAmountTnd: number;
  /** Reference month (1-12) (MonthOfReferance) */
  referenceMonth: number;
  /** Tariff tension: 'BT' or 'MT' (derived from tariffType) */
  tariffTension: 'BT' | 'MT';
  /** Tariff regime for MT: 'uniforme' or 'horaire' (derived from monthlyBillAmount structure) */
  tariffRegime?: 'uniforme' | 'horaire' | null;
  /** Operating hours case for MT: defaults to '24_7' */
  operatingHoursCase?: 'jour' | 'jour_soir' | '24_7' | null;
}

/**
 * Extract the 3 required fields from bill extraction data for solar audit
 * 
 * Maps:
 * - BillAmountDividedByPeriod → measuredAmountTnd
 * - MonthOfReferance → referenceMonth
 * - tariffType → tariffTension (Basse Tension → BT, Moyenne Tension → MT)
 * 
 * @param extractedData The full extracted bill data from BillExtractionStore
 * @returns The 3 fields needed for solar audit, or null if any required field is missing
 */
export function extractSolarAuditFields(
  extractedData: ExtractedBillData | null
): SolarAuditBillFields | null {
  if (!extractedData) {
    return null;
  }

  // Extract BillAmountDividedByPeriod
  const billAmount = extractedData.BillAmountDividedByPeriod?.value;
  if (billAmount === null || billAmount === undefined || billAmount <= 0) {
    return null;
  }

  // Extract MonthOfReferance
  const monthOfReference = extractedData.MonthOfReferance?.value;
  if (
    monthOfReference === null ||
    monthOfReference === undefined ||
    monthOfReference < 1 ||
    monthOfReference > 12
  ) {
    return null;
  }

  // Extract and map tariffType to tariffTension
  const tariffType = extractedData.tariffType?.value;
  if (!tariffType) {
    return null;
  }

  // Map tariff type to tension
  // "Basse Tension" → "BT"
  // "Moyenne Tension" → "MT"
  // "Haute Tension" → "MT" (treat HT as MT for solar audit)
  let tariffTension: 'BT' | 'MT';
  if (tariffType.toLowerCase().includes('basse')) {
    tariffTension = 'BT';
  } else if (
    tariffType.toLowerCase().includes('moyenne') ||
    tariffType.toLowerCase().includes('haute')
  ) {
    tariffTension = 'MT';
  } else {
    // Default to BT if unclear
    tariffTension = 'BT';
  }

  // Determine tariffRegime for MT bills based on monthlyBillAmount structure
  let tariffRegime: 'uniforme' | 'horaire' | null = null;
  let operatingHoursCase: 'jour' | 'jour_soir' | '24_7' | null = null;

  if (tariffTension === 'MT') {
    // Default operatingHoursCase to '24_7' for MT
    operatingHoursCase = '24_7';

    // Check monthlyBillAmount structure to determine tariffRegime
    const monthlyBillAmountValue = extractedData.monthlyBillAmount?.value;

    if (monthlyBillAmountValue && typeof monthlyBillAmountValue === 'object') {
      // Count properties in the object (excluding null/undefined values)
      const propertyKeys = Object.keys(monthlyBillAmountValue).filter(
        (key) => monthlyBillAmountValue[key] !== null && monthlyBillAmountValue[key] !== undefined
      );

      // If only 'total' property exists → uniforme
      // If multiple properties exist (total + other elements) → horaire
      if (propertyKeys.length === 1 && propertyKeys[0] === 'total') {
        tariffRegime = 'uniforme';
      } else if (propertyKeys.length > 1) {
        // Has total + other properties (elements) → horaire
        tariffRegime = 'horaire';
      }
      // If structure is unclear, leave as null (user can select manually)
    }
  }

  return {
    measuredAmountTnd: billAmount,
    referenceMonth: monthOfReference,
    tariffTension,
    tariffRegime: tariffRegime ?? null,
    operatingHoursCase: operatingHoursCase ?? null,
  };
}

/**
 * Personal information fields extracted from bill data
 */
export interface PersonalInfoBillFields {
  /** Client/company name (from clientName field) */
  clientName: string | null;
  /** Full address (from address field) */
  address: string | null;
}

/**
 * Extract personal information fields from bill extraction data
 * 
 * Maps:
 * - clientName → fullName or companyName (user can choose)
 * - address → address (location)
 * 
 * Note: Email and phone number are not available in bill extraction data
 * 
 * @param extractedData The full extracted bill data from BillExtractionStore
 * @returns Personal info fields, with null values if fields are missing
 */
export function extractPersonalInfoFields(
  extractedData: ExtractedBillData | null
): PersonalInfoBillFields {
  if (!extractedData) {
    return {
      clientName: null,
      address: null,
    };
  }

  return {
    clientName: extractedData.clientName?.value ?? null,
    address: extractedData.address?.value ?? null,
  };
}
