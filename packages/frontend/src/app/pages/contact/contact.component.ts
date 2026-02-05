import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactService, ContactSubject } from '../../core/services/contact.service';
import { NotificationStore } from '../../core/notifications/notification.store';
import { finalize } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideMail,
  lucidePhone,
  lucideMapPin,
  lucideClock,
  lucideSend,
  lucideChevronDown,
  lucideMessageSquare,
  lucideUser,
  lucideBuilding2,
  lucideCalendar,
  lucideArrowRight,
  lucideSparkles,
} from '@ng-icons/lucide';

// Define strongly typed form
interface ContactForm {
  name: FormControl<string>;
  email: FormControl<string>;
  phoneNumber: FormControl<string>;
  companyName: FormControl<string>;
  subject: FormControl<ContactSubject>;
  message: FormControl<string>;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent],
  providers: [
    provideIcons({
      lucideMail,
      lucidePhone,
      lucideMapPin,
      lucideClock,
      lucideSend,
      lucideChevronDown,
      lucideMessageSquare,
      lucideUser,
      lucideBuilding2,
      lucideCalendar,
      lucideArrowRight,
      lucideSparkles,
    }),
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private notificationStore = inject(NotificationStore);

  protected subjects = Object.values(ContactSubject);
  protected isSubmitting = signal(false);

  protected contactInfo: { icon: string; label: string; value: string; link: string | null }[] = [
    {
      icon: 'lucideMail',
      label: 'Email',
      value: 'hello@joya-energy.com',
      link: 'mailto:hello@joya-energy.com',
    },
    { icon: 'lucidePhone', label: 'Téléphone', value: '+216 54 433 617', link: 'tel:+21654433617' },
    {
      icon: 'lucideMapPin',
      label: 'Adresse',
      value: 'Les Berges du Lac, Tunis',
      link: 'https://maps.google.com/?q=Les+Berges+du+Lac+Tunis',
    },
    { icon: 'lucideClock', label: 'Horaires', value: 'Lun - Ven: 8h - 18h', link: null },
  ];

  // Initialize with non-nullable controls
  // Phone validation pattern: Allows 8 digits (Tunisian local) or +... or 0...
  // This regex in Angular Validators matches the shared validation logic roughly:
  // ^(\+|00)[1-9][0-9]{7,14}$  -> International
  // ^0[1-9][0-9]{8}$           -> Local with prefix (e.g. 06...) - Tunisian 8 digits usually don't start with 0 unless it's 0X... but standard mobile is 8 digits like 5X...
  // ^[1-9][0-9]{7}$            -> 8 digits exactly (Tunisian standard)

  contactForm: FormGroup<ContactForm> = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    // Update pattern to accept:
    // 1. International: +216... (min 8 digits after +)
    // 2. 8 digits starting with 2, 4, 5, 7, 9 (Tunisian Mobile/Fixed)
    phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+|00)[0-9]{8,15}$|^[0-9]{8}$/)]],
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    subject: [ContactSubject.GENERAL_INFO, [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(2)]],
  });

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();

      // Check if phone is specifically invalid
      if (this.contactForm.controls.phoneNumber.invalid) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Numéro de téléphone invalide',
          message: 'Veuillez entrer un numéro valide (ex: 51845578 ou +21651845578).',
        });
      } else {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Formulaire incomplet',
          message: 'Veuillez remplir tous les champs obligatoires.',
        });
      }
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.contactForm.getRawValue();

    this.contactService
      .sendContactMessage(formData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Message envoyé',
            message: 'Nous avons bien reçu votre demande. Notre équipe vous répondra très bientôt.',
          });
          this.contactForm.reset({
            name: '',
            email: '',
            phoneNumber: '',
            companyName: '',
            subject: ContactSubject.GENERAL_INFO,
            message: '',
          });
        },
        error: (err) => {
          console.error('Contact error:', err);
          if (err.status === 400 || err.status === 401) {
            this.notificationStore.addNotification({
              type: 'error',
              title: "Erreur d'envoi",
              message: 'Veuillez vérifier le format de votre email ou numéro de téléphone.',
            });
          }
        },
      });
  }
}
