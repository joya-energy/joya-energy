import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

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

  createLead(payload: CreateLeadPayload): Observable<LeadResponse | LeadExistsResponse> {
    return this.api.post<LeadResponse | LeadExistsResponse>('/leads', payload);
  }

  getLeads(): Observable<LeadResponse[]> {
    return this.api.get<LeadResponse[]>('/leads');
  }

  updateLeadStatus(id: string, status: LeadStatus): Observable<LeadResponse> {
    return this.api.patch<LeadResponse>(`/leads/${id}/status`, { status });
  }

  updateLead(id: string, payload: Partial<CreateLeadPayload>): Observable<LeadResponse> {
    return this.api.put<LeadResponse>(`/leads/${id}`, payload);
  }

  createOrUpdateLead(payload: CreateLeadPayload): Observable<LeadResponse> {
    return this.api.post<LeadResponse>('/leads/create-or-update', payload);
  }
}
