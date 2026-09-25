import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * Shared handoff simulator chrome: animated stage + grain behind projected content.
 * Page content (card, steps, report) is projected via ng-content.
 */
@Component({
  selector: 'app-aud-shell',
  standalone: true,
  template: `
    <div class="aud__stage" aria-hidden="true">
      <div class="aud__flow a"></div>
      <div class="aud__flow b"></div>
      <div class="aud__flow c"></div>
    </div>
    <div class="aud__grain" aria-hidden="true"></div>
    <div class="aud" [class.aud--result]="isResult()">
      <div class="aud__card" [class.aud__card--result]="isResult()">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      min-height: 100vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudShellComponent {
  readonly isResult = input(false);
}
