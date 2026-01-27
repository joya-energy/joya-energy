import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { EnergyAuditRequest } from '../types/energy-audit.types';
import { AuditEnergetiqueResponse } from '../../../core/services/audit-energetique.service';

@Injectable({
  providedIn: 'root'
})
export class EnergyAuditService {
  private api = inject(ApiService);

  createSimulation(payload: EnergyAuditRequest): Observable<AuditEnergetiqueResponse> {
    return this.api.post<AuditEnergetiqueResponse>('/audit-energetique-simulations', payload);
  }

  getSimulationById(id: string): Observable<AuditEnergetiqueResponse> {
    return this.api.get<AuditEnergetiqueResponse>(`/audit-energetique-simulations/${id}`);
  }

  generateAndSendPDF(simulationId: string): Observable<{ message: string; email: string; simulationId: string }> {
    return this.api.post<{ message: string; email: string; simulationId: string }>(
      '/audit-energetique-simulations/send-pdf',
      { simulationId }
    );
  }
}
