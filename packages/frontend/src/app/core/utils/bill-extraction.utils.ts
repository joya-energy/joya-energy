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

  return {
    measuredAmountTnd: billAmount,
    referenceMonth: monthOfReference,
    tariffTension,
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
