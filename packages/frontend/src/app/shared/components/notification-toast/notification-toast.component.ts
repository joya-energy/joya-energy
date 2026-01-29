import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from '../../../core/notifications/notification.store';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheckCircle, lucideAlertTriangle, lucideInfo, lucideXCircle, lucideX } from '@ng-icons/lucide';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [provideIcons({ lucideCheckCircle, lucideAlertTriangle, lucideInfo, lucideXCircle, lucideX })],
  template: `
    <div class="toast-container">
      @for (notification of notifications$ | async; track notification.id) {
        <div 
          class="toast" 
          [ngClass]="notification.type"
          @slideIn
        >
          <div class="toast-icon">
            @switch (notification.type) {
              @case ('success') { <ng-icon name="lucideCheckCircle"></ng-icon> }
              @case ('warning') { <ng-icon name="lucideAlertTriangle"></ng-icon> }
              @case ('error') { <ng-icon name="lucideXCircle"></ng-icon> }
              @default { <ng-icon name="lucideInfo"></ng-icon> }
            }
          </div>
          
          <div class="toast-content">
            <h4 class="toast-title">{{ notification.title }}</h4>
            @if (notification.message) {
              <p class="toast-message">{{ notification.message }}</p>
            }
          </div>

          <button class="toast-close" (click)="dismiss(notification.id)" aria-label="Close">
            <ng-icon name="lucideX"></ng-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
      display: flex;
      flex-direction: column-reverse;
      gap: 1rem;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      border-left: 4px solid transparent;
      overflow: hidden;

      &.success { border-left-color: var(--success-500, #10b981); }
      &.error { border-left-color: var(--danger-500, #ef4444); }
      &.warning { border-left-color: var(--warning-500, #f59e0b); }
      &.info { border-left-color: var(--teal-deep, #0a3d46); }
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      font-size: var(--font-size-lg);
      margin-top: 2px;

      .success & { color: var(--success-500, #10b981); }
      .error & { color: var(--danger-500, #ef4444); }
      .warning & { color: var(--warning-500, #f59e0b); }
      .info & { color: var(--teal-deep, #0a3d46); }
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 600;
      font-size: var(--font-size-sm);
      color: var(--text-primary, #1f2937);
      margin: 0 0 0.25rem;
    }

    .toast-message {
      font-size: var(--font-size-xs);
      color: var(--text-secondary, #6b7280);
      margin: 0;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-muted, #9ca3af);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      transition: color 0.2s;
      margin-top: 2px;

      &:hover {
        color: var(--text-primary, #1f2937);
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationToastComponent {
  private store = inject(NotificationStore);
  notifications$ = this.store.notifications$;

  dismiss(id: string) {
    this.store.dismissNotification(id);
  }
}
