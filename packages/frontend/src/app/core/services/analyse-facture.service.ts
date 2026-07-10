import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { AnalyseFactureApiResponse } from '@shared/interfaces/analyse-facture.interface';

@Injectable({
  providedIn: 'root',
})
export class AnalyseFactureService {
  private readonly api = inject(ApiService);

  analyzeBill(formData: FormData): Observable<AnalyseFactureApiResponse> {
    return this.api.postFormData<AnalyseFactureApiResponse>('/analyse-facture/analyze', formData);
  }
}
