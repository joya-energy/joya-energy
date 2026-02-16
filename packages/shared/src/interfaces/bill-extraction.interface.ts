/**
 * Bill Extraction Interfaces
 * 
 * Shared type definitions for bill extraction functionality used by both
 * frontend and backend. These types match the structure returned by the
 * OpenAI Vision API extraction service for STEG (Tunisia) electricity bills.
 */

/**
 * Represents a single extracted field with its value and explanation
 * @template T The type of the value (can be a primitive or an object)
 */
export interface ExtractedField<T> {
  /** The extracted value, or null if not found */
  value: T | null;
  /** French explanation of what this value represents, suitable for user tooltips */
  explanation: string;
}

/**
 * Structure for amount fields that have a total value
 * Used for monthlyBillAmount and recentBillConsumption
 */
export interface AmountValue {
  /** The total amount value */
  total: number;
}

/**
 * Complete extracted bill data structure
 * Contains all fields extracted from a STEG electricity bill
 * 
 * Note: The structure matches the OpenAI prompt output format where:
 * - monthlyBillAmount and recentBillConsumption return objects with { total: number }
 * - Other fields return primitive values (string, number, or null)
 */
export interface ExtractedBillData {
  /** Monthly bill amount (HT - hors taxes) as an object with total */
  monthlyBillAmount: ExtractedField<AmountValue>;
  
  /** Recent bill consumption in kWh as an object with total */
  recentBillConsumption: ExtractedField<AmountValue>;
  
  /** Billing period start date in YYYY-MM-DD format */
  periodStart: ExtractedField<string>;
  
  /** Billing period end date in YYYY-MM-DD format (may be null for MT bills) */
  periodEnd: ExtractedField<string>;
  
  /** Number of months in the billing period */
  period: ExtractedField<number>;
  
  /** Tariff type: 'Basse Tension', 'Moyenne Tension', or 'Haute Tension' */
  tariffType: ExtractedField<string>;
  
  /** Contracted power in kVA */
  contractedPower: ExtractedField<number>;
  
  /** Full address of the consumption point */
  address: ExtractedField<string>;
  
  /** Client/company name (contract holder) */
  clientName: ExtractedField<string>;
  
  /** Governorate name (one of 24 Tunisian governorates) */
  governorate: ExtractedField<string>;
  
  /** Meter number identifier */
  meterNumber: ExtractedField<string>;
  
  /** Bill reference number */
  reference: ExtractedField<string>;
  
  /** STEG district name */
  district: ExtractedField<string>;
  
  /** Calculated field: monthlyBillAmount.value.total divided by period.value */
  BillAmountDividedByPeriod: ExtractedField<number>;
}

/**
 * API response structure for bill extraction endpoint
 */
export interface ExtractBillResponse {
  /** Indicates if the extraction was successful */
  success: boolean;
  /** The extracted bill data */
  data: ExtractedBillData;
}
