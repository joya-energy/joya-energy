import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AdminAuthService } from './admin-auth.service';

export interface CreateLeadPayload {
  email: string;
  phoneNumber?: string;
  name?: string;
  address?: string;
  companyName?: string;
  source?: string;
}

export type LeadStatus = 'nouveau' | 'contacté' | 'qualifié' | 'converti' | 'perdu';

export interface LeadResponse {
  id?: string;
  email: string;
  phoneNumber?: string;
  name?: string;
  address?: string;
  companyName?: string;
  source?: string;
  status?: LeadStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadExistsResponse {
  message: 'already exist';
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private api = inject(ApiService);
  private adminAuth = inject(AdminAuthService);

  createLead(payload: CreateLeadPayload): Observable<LeadResponse | LeadExistsResponse> {
    return this.api.post<LeadResponse | LeadExistsResponse>('/leads', payload);
  }

  private getAuthHeaders(): { [key: string]: string } {
    const password = this.adminAuth.getStoredPassword();
    if (password) {
      return { Authorization: `Bearer ${password}` };
    }
    return {};
  }

  getLeads(): Observable<LeadResponse[]> {
    return this.api.get<LeadResponse[]>('/leads', undefined, this.getAuthHeaders());
  }

  updateLeadStatus(id: string, status: LeadStatus): Observable<LeadResponse> {
    return this.api.patch<LeadResponse>(`/leads/${id}/status`, { status }, this.getAuthHeaders());
  }

  updateLead(id: string, payload: Partial<CreateLeadPayload>): Observable<LeadResponse> {
    return this.api.put<LeadResponse>(`/leads/${id}`, payload, this.getAuthHeaders());
  }

  createOrUpdateLead(payload: CreateLeadPayload): Observable<LeadResponse> {
    return this.api.post<LeadResponse>('/leads/create-or-update', payload, this.getAuthHeaders());
  }
}
