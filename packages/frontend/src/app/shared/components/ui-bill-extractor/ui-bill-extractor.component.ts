/**
 * UI Bill Extractor Component
 * 
 * A standalone component for extracting data from electricity bills.
 * 
 * Features:
 * - File upload (PNG, JPG, PDF)
 * - Loading state during extraction
 * - Success/error state display
 * - Automatic storage of results in BillExtractionStore
 * 
 * Usage:
 * ```html
 * <app-ui-bill-extractor></app-ui-bill-extractor>
 * ```
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideUpload,
  lucideFileText,
  lucideCheckCircle2,
  lucideAlertCircle,
  lucideX,
  lucideLoader2,
  lucideSparkles,
} from '@ng-icons/lucide';
import { BillExtractionService } from '../../../core/services/bill-extraction.service';
import { BillExtractionStore } from '../../../core/stores/bill-extraction.store';
import { ExtractedBillData } from '@shared/interfaces/bill-extraction.interface';

@Component({
  selector: 'app-ui-bill-extractor',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './ui-bill-extractor.component.html',
  styleUrls: ['./ui-bill-extractor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideUpload,
      lucideFileText,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideX,
      lucideLoader2,
      lucideSparkles,
    }),
  ],
})
export class UiBillExtractorComponent {
  private billExtractionService = inject(BillExtractionService);
  private billExtractionStore = inject(BillExtractionStore);

  // Component state
  protected selectedFile = signal<File | null>(null);
  protected isExtracting = signal(false);
  protected extractionResult = signal<ExtractedBillData | null>(null);
  protected error = signal<string | null>(null);
  protected dragOver = signal(false);

  // Computed values
  protected hasFile = computed(() => this.selectedFile() !== null);
  protected canExtract = computed(() => this.hasFile() && !this.isExtracting());
  protected showSuccess = computed(() => this.extractionResult() !== null && !this.error());
  protected showError = computed(() => this.error() !== null);

  // File validation
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  constructor() {
    // Sync with store
    effect(() => {
      const storeData = this.billExtractionStore.getExtractedData();
      if (storeData) {
        this.extractionResult.set(storeData);
      }
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  protected onCardClick(): void {
    const input = document.querySelector('#bill-extractor-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  protected onExtract(): void {
    const file = this.selectedFile();
    if (!file || this.isExtracting()) {
      return;
    }

    // Validate file
    if (!this.isValidFile(file)) {
      return;
    }

    // Reset previous results
    this.error.set(null);
    this.extractionResult.set(null);
    this.isExtracting.set(true);
    this.billExtractionStore.setExtracting(true);

    // Create FormData
    const formData = new FormData();
    formData.append('billImage', file);

    // Call API
    this.billExtractionService.extractBillData(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Check if all fields are null (AI couldn't extract values)
          if (this.isAllFieldsNull(response.data)) {
            const errorMsg = 'Impossible d\'extraire les données de cette facture. Veuillez vérifier que le document est clair, bien éclairé et pas trop éloigné, puis réessayez.';
            this.error.set(errorMsg);
            this.billExtractionStore.setError(errorMsg);
            this.extractionResult.set(null);
          } else {
            this.extractionResult.set(response.data);
            this.billExtractionStore.setExtractedData(response.data);
            this.error.set(null);
          }
        } else {
          this.error.set('Échec de l\'extraction. Veuillez réessayer.');
          this.billExtractionStore.setError('Échec de l\'extraction. Veuillez réessayer.');
        }
        this.isExtracting.set(false);
        this.billExtractionStore.setExtracting(false);
      },
      error: (err) => {
        const errorMessage = this.getUserFriendlyError(err);
        this.error.set(errorMessage);
        this.billExtractionStore.setError(errorMessage);
        this.isExtracting.set(false);
        this.billExtractionStore.setExtracting(false);
      },
    });
  }

  protected onClear(): void {
    this.selectedFile.set(null);
    this.extractionResult.set(null);
    this.error.set(null);
    const input = document.querySelector('#bill-extractor-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  protected onDismissError(): void {
    this.error.set(null);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private handleFile(file: File): void {
    // Reset previous state
    this.error.set(null);
    this.extractionResult.set(null);

    // Validate file
    if (!this.isValidFile(file)) {
      return;
    }

    this.selectedFile.set(file);
  }

  private isValidFile(file: File): boolean {
    // Check file type
    if (!this.ACCEPTED_TYPES.includes(file.type)) {
      this.error.set(
        'Type de fichier non supporté. Veuillez télécharger une image (JPG, PNG) ou un PDF.'
      );
      return false;
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.error.set(
        `Le fichier est trop volumineux. Taille maximale: ${this.formatFileSize(this.MAX_FILE_SIZE)}`
      );
      return false;
    }

    return true;
  }

  /**
   * Check if all extracted fields are null (AI couldn't read the document)
   */
  private isAllFieldsNull(data: ExtractedBillData): boolean {
    // Check all key fields - if all are null, extraction failed
    const keyFields = [
      data.monthlyBillAmount?.value?.total ?? data.monthlyBillAmount?.value,
      data.recentBillConsumption?.value?.total ?? data.recentBillConsumption?.value,
      data.periodStart?.value,
      data.periodEnd?.value,
      data.tariffType?.value,
      data.contractedPower?.value,
      data.address?.value,
      data.clientName?.value,
      data.governorate?.value,
      data.meterNumber?.value,
      data.reference?.value,
      data.district?.value,
      data.MonthOfReferance?.value,
    ];

    // Count non-null values
    const nonNullCount = keyFields.filter(
      (field) => field !== null && field !== undefined && field !== ''
    ).length;

    // If less than 3 fields have values, consider it a failed extraction
    // This means AI received the document but couldn't extract meaningful data
    return nonNullCount < 3;
  }

  /**
   * Convert technical errors into user-friendly messages
   */
  private getUserFriendlyError(error: any): string {
    // Network errors
    if (error.status === 0 || error.name === 'HttpErrorResponse') {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.';
    }

    // HTTP status code errors
    if (error.status) {
      switch (error.status) {
        case 400:
          // Bad request - could be invalid file or extraction failed
          if (error.error?.error) {
            const errorMsg = error.error.error.toLowerCase();
            if (errorMsg.includes('file') || errorMsg.includes('fichier')) {
              return 'Le fichier téléchargé n\'est pas valide. Veuillez vérifier que c\'est bien une facture STEG et réessayer.';
            }
            if (errorMsg.includes('extract') || errorMsg.includes('extraction')) {
              return 'Impossible d\'extraire les données de cette facture. Assurez-vous que la facture est claire et lisible, puis réessayez.';
            }
          }
          return 'Le fichier téléchargé n\'est pas valide. Veuillez vérifier que c\'est bien une facture STEG et réessayer.';

        case 401:
          return 'Session expirée. Veuillez rafraîchir la page et réessayer.';

        case 403:
          return 'Accès refusé. Veuillez contacter le support si le problème persiste.';

        case 404:
          return 'Service non disponible. Veuillez réessayer dans quelques instants.';

        case 413:
          return `Le fichier est trop volumineux. Taille maximale: ${this.formatFileSize(this.MAX_FILE_SIZE)}`;

        case 429:
          return 'Trop de demandes. Veuillez patienter quelques instants avant de réessayer.';

        case 500:
        case 502:
        case 503:
        case 504:
          return 'Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.';
      }
    }

    // API error messages (if they're already user-friendly)
    if (error.error?.error) {
      const apiError = error.error.error.toLowerCase();
      
      // Check if it's already a user-friendly message (contains common French words)
      if (
        apiError.includes('facture') ||
        apiError.includes('fichier') ||
        apiError.includes('télécharger') ||
        apiError.includes('réessayer') ||
        apiError.includes('vérifier')
      ) {
        return error.error.error;
      }

      // Technical error messages that need translation
      if (apiError.includes('openai') || apiError.includes('quota') || apiError.includes('429')) {
        return 'Le service d\'extraction est temporairement surchargé. Veuillez réessayer dans quelques instants.';
      }

      if (apiError.includes('pdf') || apiError.includes('conversion')) {
        return 'Impossible de traiter ce fichier PDF. Veuillez télécharger une image (JPG ou PNG) à la place.';
      }

      if (apiError.includes('parse') || apiError.includes('json')) {
        return 'Les données extraites ne sont pas valides. Veuillez vérifier que la facture est claire et réessayer.';
      }
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return 'La demande a pris trop de temps. Veuillez réessayer avec une facture plus claire.';
    }

    // Generic fallback
    return 'Une erreur est survenue lors de l\'extraction. Veuillez vérifier que votre facture est claire et réessayer. Si le problème persiste, contactez le support.';
  }
}
