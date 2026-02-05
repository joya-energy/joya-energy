import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
export class StatusComponent {
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
}
