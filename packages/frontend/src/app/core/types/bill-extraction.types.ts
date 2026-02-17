/**
 * Bill Extraction Types
 *
 * Re-exports shared bill extraction types from @shared package.
 * This file maintains backward compatibility while using the shared types.
 * 
 * @deprecated Import directly from '@shared/interfaces/bill-extraction.interface' instead
 */

export type {
  ExtractedField,
  AmountValue,
  ExtractedBillData,
  ExtractBillResponse,
} from '@shared/interfaces/bill-extraction.interface';
