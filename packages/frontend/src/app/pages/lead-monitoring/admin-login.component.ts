import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminLoginModalComponent } from './components/admin-login-modal.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [AdminLoginModalComponent],
  template: `<app-admin-login-modal></app-admin-login-modal>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {}
