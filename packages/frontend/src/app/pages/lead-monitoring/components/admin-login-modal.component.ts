import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideLock,
  lucideLoader2,
  lucideAlertCircle,
} from '@ng-icons/lucide';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './admin-login-modal.component.html',
  styleUrl: './admin-login-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideX,
      lucideLock,
      lucideLoader2,
      lucideAlertCircle,
    }),
  ],
})
export class AdminLoginModalComponent {
  private readonly authService = inject(AdminAuthService);
  private readonly router = inject(Router);

  passwordValue = '';
  readonly error = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly open = signal(true);

  constructor() {
    // Auto-open modal if not authenticated
    effect(() => {
      if (!this.authService.isAuthenticatedSync() && !this.open()) {
        this.open.set(true);
      }
    });
  }

  onSubmit(): void {
    const pwd = this.passwordValue.trim();
    
    if (!pwd) {
      this.error.set('Veuillez entrer le mot de passe');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Validate password on the backend
    this.authService.authenticate(pwd).subscribe({
      next: (isValid) => {
        this.isLoading.set(false);
        if (isValid) {
          this.open.set(false);
          // Redirect to leads page - use window.location for a hard redirect
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/leads';
          }
        } else {
          this.error.set('Mot de passe incorrect');
          this.passwordValue = '';
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Erreur de connexion. Veuillez réessayer.');
        this.passwordValue = '';
      }
    });
  }

  onClose(): void {
    // Redirect to home if user closes without authenticating
    this.router.navigate(['/']);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('login-backdrop')) {
      this.onClose();
    }
  }
}
