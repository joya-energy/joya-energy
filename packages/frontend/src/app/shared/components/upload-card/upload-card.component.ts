import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUpload, lucideArrowRight, lucidePencil } from '@ng-icons/lucide';

export interface UploadCardConfig {
  title: string;
  subtitle: string;
  acceptedTypes: string;
  maxSizeText: string;
  extractButtonText: string;
  manualEntryButtonText: string;
  selectedFileText: string;
  changeFileText: string;
}

@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './upload-card.component.html',
  styleUrl: './upload-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideUpload,
      lucideArrowRight,
      lucidePencil
    })
  ]
})
export class UploadCardComponent {
  @Input() config!: UploadCardConfig;
  @Input() isExtracting = false;
  @Input() selectedFile: File | null = null;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() extractClicked = new EventEmitter<void>();
  @Output() manualEntryClicked = new EventEmitter<void>();

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  protected onCardClick(): void {
    const input = document.querySelector('#upload-file-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  protected onExtractClick(): void {
    this.extractClicked.emit();
  }

  protected onManualEntryClick(): void {
    this.manualEntryClicked.emit();
  }

  protected onChangeFileClick(event: Event): void {
    event.stopPropagation();
    this.fileSelected.emit(null as any);
    const input = document.querySelector('#upload-file-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }
}
