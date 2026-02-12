import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SEOService } from '../../core/services/seo.service';

export interface BackendHealth {
  status: string;
  service: string;
  timestamp: string;
  env?: string;
}

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status.component.html',
  styleUrl: './status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusComponent implements OnInit {
  private readonly seoService = inject(SEOService);
  
  /** 'loading' | 'ok' | 'error' */
  readonly state = signal<'loading' | 'ok' | 'error'>('loading');
  readonly payload = signal<BackendHealth | null>(null);
  readonly errorMessage = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {
    const healthUrl = `${environment.apiUrl}/health`;
    this.http.get<BackendHealth>(healthUrl).subscribe({
      next: (body) => {
        this.payload.set(body);
        this.state.set('ok');
      },
      error: (err) => {
        this.errorMessage.set(err?.message ?? err?.statusText ?? 'Request failed');
        this.state.set('error');
      },
    });
  }

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'État des services | JOYA Energy',
      description: 'Vérifiez l\'état des services JOYA Energy en Tunisie. Statut de disponibilité de nos plateformes et services énergétiques.',
      url: 'https://joya-energy.com/status',
      keywords: 'statut services JOYA Energy, disponibilité plateforme Tunisie',
    });
  }
}
