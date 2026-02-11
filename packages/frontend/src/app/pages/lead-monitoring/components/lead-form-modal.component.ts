import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  effect,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideMail,
  lucideUser,
  lucidePhone,
  lucideBuilding,
  lucideMapPin,
  lucideSave,
  lucideLoader2,
} from '@ng-icons/lucide';
import { LeadService, type CreateLeadPayload, type LeadResponse } from '../../../core/services/lead.service';

@Component({
  selector: 'app-lead-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './lead-form-modal.component.html',
  styleUrl: './lead-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideX,
      lucideMail,
      lucideUser,
      lucidePhone,
      lucideBuilding,
      lucideMapPin,
      lucideSave,
      lucideLoader2,
    }),
  ],
})
export class LeadFormModalComponent {
  private readonly leadService = inject(LeadService);

  @Input() lead: LeadResponse | null = null;
  @Input() open = signal(false);
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<LeadResponse>();

  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formData = signal<CreateLeadPayload>({
    email: '',
    phoneNumber: '',
    name: '',
    address: '',
    companyName: '',
    source: '',
  });

  constructor() {
    effect(() => {
      if (this.open() && this.lead) {
        // Edit mode - populate form
        this.formData.set({
          email: this.lead.email || '',
          phoneNumber: this.lead.phoneNumber || '',
          name: this.lead.name || '',
          address: this.lead.address || '',
          companyName: this.lead.companyName || '',
          source: this.lead.source || '',
        });
      } else if (this.open() && !this.lead) {
        // Create mode - reset form
        this.formData.set({
          email: '',
          phoneNumber: '',
          name: '',
          address: '',
          companyName: '',
          source: '',
        });
      }
      this.error.set(null);
    });
  }

  onClose(): void {
    this.open.set(false);
    this.error.set(null);
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  onSubmit(): void {
    const data = this.formData();
    
    if (!data.email || !data.email.trim()) {
      this.error.set('L\'email est requis');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      this.error.set('Format d\'email invalide');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const payload: CreateLeadPayload = {
      email: data.email.trim().toLowerCase(),
      phoneNumber: data.phoneNumber?.trim() || undefined,
      name: data.name?.trim() || undefined,
      address: data.address?.trim() || undefined,
      companyName: data.companyName?.trim() || undefined,
      source: data.source?.trim() || undefined,
    };

    if (this.lead?.id) {
      // Update existing lead
      this.leadService.updateLead(this.lead.id, payload).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.saved.emit(updated);
          this.onClose();
        },
        error: (err) => {
          console.error('Failed to update lead', err);
          this.error.set(err?.error?.error || 'Erreur lors de la mise à jour du lead');
          this.isSaving.set(false);
        },
      });
    } else {
      // Create or update by email
      this.leadService.createOrUpdateLead(payload).subscribe({
        next: (result) => {
          this.isSaving.set(false);
          this.saved.emit(result);
          this.onClose();
        },
        error: (err) => {
          console.error('Failed to create/update lead', err);
          this.error.set(err?.error?.error || 'Erreur lors de la sauvegarde du lead');
          this.isSaving.set(false);
        },
      });
    }
  }

  get title(): string {
    return this.lead ? 'Modifier le Lead' : 'Nouveau Lead';
  }
}
