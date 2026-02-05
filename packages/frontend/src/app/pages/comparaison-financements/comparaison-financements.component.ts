import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideWallet,
  lucideBarChart3,
  lucideZap,
  lucideMapPin,
  lucideSun,
  lucideInfo,
} from '@ng-icons/lucide';
import { trigger, transition, style, animate } from '@angular/animations';
import { finalize } from 'rxjs/operators';

import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';
import { UiStepTimelineComponent } from '../../shared/components/ui-step-timeline/ui-step-timeline.component';
import { UiProgressBarComponent } from '../../shared/components/ui-progress-bar/ui-progress-bar.component';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { RouterLink } from '@angular/router';

import {
  FinancingComparisonService,
  ProjectInput,
} from '../../features/financing-comparison/services/financing-comparison.service';
import { Governorates } from '@shared';
import { NotificationStore } from '../../core/notifications/notification.store';

interface SimulatorStep {
  number: number;
  title: string;
  isResult: boolean;
}

@Component({
  selector: 'app-comparaison-financements',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    NoGroupingPipe,
    UiStepTimelineComponent,
    UiProgressBarComponent,
    UiSelectComponent,
    UiInputComponent,
    RouterLink,
  ],
  templateUrl: './comparaison-financements.component.html',
  styleUrls: ['./comparaison-financements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' })),
      ]),
    ]),
    trigger('resultCards', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideWallet,
      lucideBarChart3,
      lucideZap,
      lucideMapPin,
      lucideSun,
      lucideInfo,
    }),
  ],
})
export class ComparaisonFinancementsComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);
  private readonly financingService = inject(FinancingComparisonService);
  private readonly notificationStore = inject(NotificationStore);

  protected readonly steps: SimulatorStep[] = [
    { number: 1, title: 'Introduction', isResult: false },
    { number: 2, title: 'Données du projet', isResult: false },
    { number: 3, title: 'Résultats', isResult: true },
  ];

  protected readonly currentStep = signal(1);
  protected readonly isSubmitting = signal(false);
  private readonly formUpdateTrigger = signal(0);
  protected form!: FormGroup;

  protected readonly comparisonResult = this.financingService.comparisonResult;
  protected readonly loading = this.financingService.loading;
  protected readonly error = this.financingService.error;
  protected readonly locations = this.financingService.locations;
  protected readonly solutions = this.financingService.solutions;
  protected readonly bestCashflow = this.financingService.bestCashflow;

  /** Solutions reordered: ESCO JOYA first, Comptant last. */
  protected readonly displaySolutions = computed(() => {
    const list = this.solutions();
    if (list.length === 0) return [];
    const order: Array<'esco' | 'credit' | 'leasing' | 'cash'> = [
      'esco',
      'credit',
      'leasing',
      'cash',
    ];
    return order
      .map((type) => list.find((s) => s.type === type))
      .filter((s): s is (typeof list)[0] => s != null);
  });

  protected readonly locationOptions = () => {
    const locs = this.locations();
    return locs.map((loc) => ({ value: loc.location, label: loc.location }));
  };

  protected readonly inputTypeOptions: { value: string; label: string }[] = [
    { value: 'size', label: "Taille de l'installation (kWp)" },
    { value: 'amount', label: "Budget d'investissement (DT)" },
  ];

  constructor() {
    effect(() => {
      const result = this.comparisonResult();
      const esco = result?.esco;
      if (esco && esco.isViable === false && esco.viabilityError) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Solution ESCO non viable',
          message: esco.viabilityError,
          duration: 8000,
        });
      }
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      this.financingService.fetchLocations().subscribe();
      this.financingService.fetchAdvantages().subscribe();
    }
    this.buildForm();
    this.form.valueChanges.subscribe(() => this.formUpdateTrigger.update((v) => v + 1));
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      location: ['', Validators.required],
      inputType: ['size'],
      installationSizeKwp: [null as number | null],
      investmentAmountDt: [null as number | null],
    });
    this.form.get('inputType')?.valueChanges.subscribe((type) => {
      this.form.patchValue(
        { installationSizeKwp: null, investmentAmountDt: null },
        { emitEvent: false }
      );
    });
  }

  protected get currentStepData(): SimulatorStep {
    return this.steps[this.currentStep() - 1];
  }

  protected readonly stepProgress = computed<Record<number, number>>(() => {
    this.formUpdateTrigger();
    const current = this.currentStep();
    const result = this.comparisonResult();
    const progress: Record<number, number> = {
      1: current >= 1 ? 100 : 0,
      2: 0,
      3: result && current === 3 ? 100 : 0,
    };

    if (this.form) {
      const loc = this.form.get('location')?.value;
      const type = this.form.get('inputType')?.value;
      const size = this.form.get('installationSizeKwp')?.value;
      const amount = this.form.get('investmentAmountDt')?.value;
      const locationFilled = !!loc && String(loc).trim().length > 0;
      const sizeOrAmountFilled =
        type === 'size' ? size != null && Number(size) > 0 : amount != null && Number(amount) > 0;
      progress[2] = locationFilled && sizeOrAmountFilled ? 100 : locationFilled ? 50 : 0;
    }

    return progress;
  });

  protected readonly overallProgress = computed(() => {
    const current = this.currentStep();
    if (current === 3) return this.comparisonResult() ? 100 : 0;
    return this.stepProgress()[current];
  });

  protected isStepClickable(stepNumber: number): boolean {
    if (stepNumber === 3) return !!this.comparisonResult();
    return stepNumber <= this.currentStep();
  }

  protected goToStep(stepNumber: number): void {
    if (!this.isStepClickable(stepNumber) && stepNumber !== 3) return;
    if (stepNumber === 3 && !this.comparisonResult()) return;
    this.currentStep.set(stepNumber);
  }

  protected nextStep(): void {
    if (this.currentStep() === 1) {
      this.currentStep.set(2);
      return;
    }
    if (this.currentStep() === 2) {
      this.submitComparison();
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) this.currentStep.set(this.currentStep() - 1);
  }

  protected canProceed(): boolean {
    if (this.currentStep() === 1) return true;
    if (this.currentStep() === 2) {
      const loc = this.form.get('location')?.value;
      const type = this.form.get('inputType')?.value;
      const size = this.form.get('installationSizeKwp')?.value;
      const amount = this.form.get('investmentAmountDt')?.value;
      if (!loc) return false;
      if (type === 'size') return size != null && size > 0;
      return amount != null && amount > 0;
    }
    return false;
  }

  private submitComparison(): void {
    if (!this.canProceed() || this.loading()) return;
    const loc = this.form.get('location')?.value as Governorates;
    const type = this.form.get('inputType')?.value;
    const input: ProjectInput = { location: loc };
    if (type === 'size') {
      const v = this.form.get('installationSizeKwp')?.value;
      if (v != null && v > 0) input.installationSizeKwp = v;
    } else {
      const v = this.form.get('investmentAmountDt')?.value;
      if (v != null && v > 0) input.investmentAmountDt = v;
    }
    this.isSubmitting.set(true);
    this.financingService
      .createComparison(input)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.currentStep.set(3),
        error: () => {},
      });
  }

  protected newComparison(): void {
    this.financingService.clearResult();
    this.currentStep.set(1);
    this.form.reset({ inputType: 'size', installationSizeKwp: null, investmentAmountDt: null });
  }

  protected formatCurrency(value: number): string {
    return (
      new Intl.NumberFormat('fr-TN', { style: 'decimal', maximumFractionDigits: 0 }).format(value) +
      ' DT'
    );
  }

  protected getSolutionTitle(type: string): string {
    const titles: Record<string, string> = {
      cash: 'Comptant',
      credit: 'Crédit bancaire',
      leasing: 'Leasing',
      esco: 'ESCO JOYA',
    };
    return titles[type] ?? type;
  }

  protected getSolutionColor(type: string): string {
    const colors: Record<string, string> = {
      cash: '#2196F3',
      credit: '#FF9800',
      leasing: '#9C27B0',
      esco: 'var(--success-500, #22c55e)',
    };
    return colors[type] ?? '#64748b';
  }

  protected isBestCashflow(type: string): boolean {
    const best = this.bestCashflow();
    return best?.type === type;
  }
}
