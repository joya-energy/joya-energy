import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IAuditSolaireSimulation } from '@shared/interfaces';

export interface CreateSimulationPayload {
  // Location
  address: string;
  
  // Consumption
  measuredAmountTnd: number;
  referenceMonth: number;
  
  // Building
  buildingType: string;
  climateZone: string;
  
  // Personal Info (ready for backend integration)
  // NOTE: These fields are currently sent but backend doesn't use them yet.
  // Backend will be updated to accept and store these fields.
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
}

export interface PaginatedSimulationsResponse {
  data: IAuditSolaireSimulation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditSolaireService {
  private api = inject(ApiService);

  createSimulation(payload: CreateSimulationPayload): Observable<IAuditSolaireSimulation> {
    return this.api.post<IAuditSolaireSimulation>('/audit-solaire-simulations', payload);
  }

  getSimulations(page = 1, limit = 10): Observable<PaginatedSimulationsResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.api.get<PaginatedSimulationsResponse>('/audit-solaire-simulations', params);
  }

  getSimulationById(id: string): Observable<IAuditSolaireSimulation> {
    return this.api.get<IAuditSolaireSimulation>(`/audit-solaire-simulations/${id}`);
  }

  deleteSimulation(id: string): Observable<void> {
    return this.api.delete<void>(`/audit-solaire-simulations/${id}`);
  }

  downloadPVReport(solaireId: string, energetiqueId?: string): Observable<Blob> {
    return this.api.downloadFile('/audit-energetique-simulations/download-pv-pdf', {
      solaireId,
      energetiqueId
    });
  }
}

