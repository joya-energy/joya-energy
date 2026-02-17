import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ExtractBillResponse } from '@shared/interfaces/bill-extraction.interface';

@Injectable({
  providedIn: 'root',
})
export class BillExtractionService {
  private api = inject(ApiService);

  /**
   * Extract data from a bill image/PDF
   * @param formData FormData containing the billImage file
   */
  extractBillData(formData: FormData): Observable<ExtractBillResponse> {
    return this.api.postFormData<ExtractBillResponse>('/bill-extraction/extract', formData);
  }
}
