import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-image-container" [class.loading]="isLoading">
      <img
        [src]="src"
        [alt]="alt"
        [style.height.px]="height"
        (load)="onLoad()"
        (error)="onError()"
        class="ui-image"
      />
      <div class="ui-image-skeleton" *ngIf="isLoading"></div>
    </div>
  `,
  styleUrls: ['./ui-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiImageComponent {
  @Input() src: string = '';
  @Input() alt: string = '';
  @Input() width: number = 300;
  @Input() height: number = 200;

  protected isLoading = true;

  protected onLoad(): void {
    this.isLoading = false;
  }

  protected onError(): void {
    this.isLoading = false;
  }
}

