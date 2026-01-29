import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export enum ContactSubject {
  GENERAL_INFO = 'Information générale',
  SUPPORT = 'Support technique',
  PARTNERSHIP = 'Partenariat',
  OTHER = 'Autre'
}

export interface ContactFormPayload {
  name: string;
  email: string;
  phoneNumber: string;
  subject?: ContactSubject;
  message?: string;
  companyName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private api = inject(ApiService);

  sendContactMessage(payload: ContactFormPayload): Observable<any> {
    return this.api.post('/contacts', payload);
  }
}
