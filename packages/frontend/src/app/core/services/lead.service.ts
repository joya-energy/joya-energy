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

export interface LeadResponse {
  id?: string;
  email: string;
  phoneNumber?: string;
  name?: string;
  address?: string;
  companyName?: string;
  source?: string;
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
}
