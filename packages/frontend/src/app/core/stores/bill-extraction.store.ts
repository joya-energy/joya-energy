/**
 * Bill Extraction Store
 * 
 * Manages the state of bill extraction operations and stores extracted bill data
 * for reuse across different simulators (solar audit, energy audit, etc.).
 * 
 * Usage:
 * ```typescript
 * private billExtractionStore = inject(BillExtractionStore);
 * 
 * // Subscribe to extracted data
 * this.billExtractionStore.extractedData$.subscribe(data => {
 *   if (data) {
 *     // Use extracted data
 *   }
 * });
 * 
 * // Get current extracted data synchronously
 * const data = this.billExtractionStore.getExtractedData();
 * 
 * // Clear extracted data
 * this.billExtractionStore.clear();
 * ```
 */

import { Injectable } from '@angular/core';
import { Store } from '../state/store';
import { ExtractedBillData } from '@shared/interfaces/bill-extraction.interface';

export interface BillExtractionState {
  extractedData: ExtractedBillData | null;
  isExtracting: boolean;
  error: string | null;
  lastExtractedAt: Date | null;
}

const initialState: BillExtractionState = {
  extractedData: null,
  isExtracting: false,
  error: null,
  lastExtractedAt: null,
};

@Injectable({
  providedIn: 'root',
})
export class BillExtractionStore extends Store<BillExtractionState> {
  constructor() {
    super(initialState);
  }

  readonly extractedData$ = this.select((state) => state.extractedData);
  readonly isExtracting$ = this.select((state) => state.isExtracting);
  readonly error$ = this.select((state) => state.error);
  readonly lastExtractedAt$ = this.select((state) => state.lastExtractedAt);

  /**
   * Get current extracted data synchronously
   */
  getExtractedData(): ExtractedBillData | null {
    return this.state.extractedData;
  }

  /**
   * Set extraction in progress
   */
  setExtracting(isExtracting: boolean): void {
    this.setState({
      isExtracting,
      error: isExtracting ? null : this.state.error, // Clear error when starting new extraction
    });
  }

  /**
   * Store extracted bill data
   */
  setExtractedData(data: ExtractedBillData): void {
    this.setState({
      extractedData: data,
      isExtracting: false,
      error: null,
      lastExtractedAt: new Date(),
    });
  }

  /**
   * Set extraction error
   */
  setError(error: string): void {
    this.setState({
      isExtracting: false,
      error,
    });
  }

  /**
   * Clear extracted data and errors
   */
  clear(): void {
    this.setState({
      extractedData: null,
      isExtracting: false,
      error: null,
      lastExtractedAt: null,
    });
  }
}
