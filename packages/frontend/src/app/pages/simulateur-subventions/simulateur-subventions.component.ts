import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideBadgePercent,
  lucideCheck,
  lucideCoins,
  lucideInfo,
} from '@ng-icons/lucide';
import { trigger, transition, style, animate } from '@angular/animations';

import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { UiStepTimelineComponent } from '../../shared/components/ui-step-timeline/ui-step-timeline.component';
import { UiProgressBarComponent } from '../../shared/components/ui-progress-bar/ui-progress-bar.component';
import { SEOService } from '../../core/services/seo.service';
import { LeadService } from '../../core/services/lead.service';
import { SUBVENTION_CATEGORIES, SUBVENTION_CATEGORY_ENTRIES } from './subventions-fte.data';
import {
  calculateSubventionPrime,
  formatSubventionAmount,
  getSubventionBadge,
} from './subventions-fte.calculator';
import type {
  SubventionCalculationResult,
  SubventionCategoryKey,
  SubventionItem,
} from './subventions-fte.types';
import { isFlatItem, isPercentItem, isSolarM2Item } from './subventions-fte.types';
import {
  SUBVENTION_BENEFIT_CARDS,
  SUBVENTION_HIGHLIGHT_STATS,
  SUBVENTION_PROCEDURE_STEPS,
  SUBVENTION_TRUST_STATS,
} from './subventions-fte.info';
import { validatePhoneNumber } from '@shared/functions/user-check';

function phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return validatePhoneNumber(value) ? null : { phoneNumber: true };
}

interface SimulatorStep {
  number: number;
  title: string;
  isResult: boolean;
}

@Component({
  selector: 'app-simulateur-subventions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    UiStepTimelineComponent,
    UiProgressBarComponent,
    UiInputComponent,
  ],
  templateUrl: './simulateur-subventions.component.html',
  styleUrl: './simulateur-subventions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
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
      lucideBadgePercent,
      lucideCheck,
      lucideCoins,
      lucideInfo,
    }),
  ],
})
export class SimulateurSubventionsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly seoService = inject(SEOService);
  private readonly leadService = inject(LeadService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly steps: SimulatorStep[] = [
    { number: 1, title: 'Catégorie', isResult: false },
    { number: 2, title: 'Action', isResult: false },
    { number: 3, title: 'Projet', isResult: false },
    { number: 4, title: 'Contact', isResult: false },
    { number: 5, title: 'Résultat', isResult: true },
  ];

  protected readonly categoryEntries = SUBVENTION_CATEGORY_ENTRIES;
  protected readonly highlightStats = SUBVENTION_HIGHLIGHT_STATS;
  protected readonly trustStats = SUBVENTION_TRUST_STATS;
  protected readonly benefitCards = SUBVENTION_BENEFIT_CARDS;
  protected readonly procedureSteps = SUBVENTION_PROCEDURE_STEPS;
  protected readonly currentStep = signal(1);
  protected readonly selectedCategoryKey = signal<SubventionCategoryKey | null>(null);
  protected readonly selectedItemId = signal<string | null>(null);
  protected readonly result = signal<SubventionCalculationResult | null>(null);
  private readonly formUpdateTrigger = signal(0);

  protected readonly form: FormGroup = this.createForm();

  protected readonly selectedCategory = computed(() => {
    const key = this.selectedCategoryKey();
    return key ? SUBVENTION_CATEGORIES[key] : null;
  });

  protected readonly selectedItem = computed((): SubventionItem | null => {
    const category = this.selectedCategory();
    const itemId = this.selectedItemId();
    if (!category || !itemId) {
      return null;
    }
    return category.items.find((item) => item.id === itemId) ?? null;
  });

  protected readonly isSolarM2Selected = computed(() => {
    const item = this.selectedItem();
    return item ? isSolarM2Item(item) : false;
  });

  protected readonly stepProgress = computed<Record<number, number>>(() => {
    this.formUpdateTrigger();
    const progress: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (this.selectedCategoryKey()) {
      progress[1] = 100;
    }
    if (this.selectedItemId()) {
      progress[2] = 100;
    }
    if (this.isStepThreeValid()) {
      progress[3] = 100;
    }
    if (this.isStepFourValid()) {
      progress[4] = 100;
    }
    if (this.result()) {
      progress[5] = 100;
    }

    return progress;
  });

  protected readonly overallProgress = computed(() => {
    const current = this.currentStep();
    if (current === 5) {
      return this.result() ? 100 : 0;
    }
    return this.stepProgress()[current];
  });

  protected readonly currentStepData = computed(() => {
    return this.steps.find((step) => step.number === this.currentStep()) ?? this.steps[0];
  });

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Simulateur des subventions FTE | JOYA Energy',
      description:
        "Estimez la prime du Fonds de Transition Énergétique (FTE) pour vos études, équipements et projets photovoltaïques en Tunisie.",
      url: 'https://joya-energy.com/simulateur-subventions',
      keywords:
        'subventions FTE Tunisie, Fonds Transition Énergétique, prime ANME, aide énergie Tunisie, simulateur subvention',
    });
    this.form.valueChanges.subscribe(() => this.formUpdateTrigger.update((value) => value + 1));
  }

  protected getBadge(categoryKey: SubventionCategoryKey, item: SubventionItem): string {
    return getSubventionBadge(SUBVENTION_CATEGORIES[categoryKey], item);
  }

  protected formatAmount(value: number): string {
    return formatSubventionAmount(value);
  }

  protected getPercentHint(item: SubventionItem): string {
    if (!isPercentItem(item)) {
      return '';
    }
    return `Taux applicable : ${Math.round(item.taux * 100)}% · Plafond de prime : ${this.formatAmount(item.plafond)} DT`;
  }

  protected getFlatHint(item: SubventionItem): string {
    if (!isFlatItem(item)) {
      return '';
    }
    return `Prime forfaitaire : ${item.amount.toLocaleString('fr-FR')} ${item.unit}`;
  }

  protected isStepClickable(stepNumber: number): boolean {
    if (stepNumber === 5) {
      return !!this.result();
    }
    return stepNumber <= this.currentStep();
  }

  protected goToStep(stepNumber: number): void {
    if (stepNumber === 5 && !this.result()) {
      return;
    }
    if (!this.isStepClickable(stepNumber)) {
      return;
    }
    this.currentStep.set(stepNumber);
  }

  protected selectCategory(key: SubventionCategoryKey): void {
    this.selectedCategoryKey.set(key);
    this.selectedItemId.set(null);
    this.result.set(null);
    this.resetFormValues();
    this.formUpdateTrigger.update((value) => value + 1);
  }

  protected nextFromCategoryStep(): void {
    if (!this.selectedCategoryKey()) {
      return;
    }
    this.currentStep.set(2);
  }

  protected selectItem(itemId: string): void {
    this.selectedItemId.set(itemId);
    this.result.set(null);
    this.resetFormValues();
    this.formUpdateTrigger.update((value) => value + 1);
  }

  protected nextFromActionStep(): void {
    if (!this.selectedItemId()) {
      return;
    }
    this.currentStep.set(3);
  }

  protected calculate(): void {
    const category = this.selectedCategory();
    const item = this.selectedItem();
    if (!category || !item || !this.isStepThreeValid() || !this.isStepFourValid()) {
      return;
    }

    const values = this.form.getRawValue();
    const calculation = calculateSubventionPrime(category, item, {
      montant: Number(values.montant) || 0,
      surface: Number(values.surface) || 0,
      quantity: Number(values.quantity) || 0,
      power: Number(values.power) || 0,
    });

    this.result.set(calculation);
    this.collectLead();
    this.currentStep.set(5);
  }

  protected resetSimulation(): void {
    this.selectedCategoryKey.set(null);
    this.selectedItemId.set(null);
    this.result.set(null);
    this.resetFormValues();
    this.currentStep.set(1);
  }

  protected canGoBack(): boolean {
    return this.currentStep() > 1;
  }

  protected canProceed(): boolean {
    const step = this.currentStep();
    if (step === 1) {
      return !!this.selectedCategoryKey();
    }
    if (step === 2) {
      return !!this.selectedItemId();
    }
    if (step === 3) {
      return this.isStepThreeValid();
    }
    if (step === 4) {
      return this.isStepFourValid();
    }
    return false;
  }

  protected nextStep(): void {
    const step = this.currentStep();
    if (step === 1) {
      this.nextFromCategoryStep();
      return;
    }
    if (step === 2) {
      this.nextFromActionStep();
      return;
    }
    if (step === 3) {
      this.currentStep.set(4);
      return;
    }
    if (step === 4) {
      this.calculate();
    }
  }

  protected previousStep(): void {
    if (!this.canGoBack()) {
      return;
    }
    this.currentStep.update((step) => step - 1);
  }

  protected scrollToSection(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected remainingCost(): number {
    const currentResult = this.result();
    if (!currentResult || currentResult.montant === null) {
      return 0;
    }
    return Math.max(currentResult.montant - currentResult.prime, 0);
  }

  private createForm(): FormGroup {
    return this.fb.group({
      montant: [null as number | null, [Validators.min(0)]],
      surface: [null as number | null, [Validators.min(0)]],
      quantity: [1 as number | null, [Validators.min(1)]],
      power: [null as number | null, [Validators.min(0)]],
      personal: this.fb.group({
        fullName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, phoneNumberValidator]],
      }),
    });
  }

  private resetFormValues(): void {
    this.form.reset({
      montant: null,
      surface: null,
      quantity: 1,
      power: null,
      personal: {
        fullName: '',
        email: '',
        phoneNumber: '',
      },
    });
    this.formUpdateTrigger.update((value) => value + 1);
  }

  private isStepThreeValid(): boolean {
    const category = this.selectedCategory();
    const item = this.selectedItem();
    if (!category || !item) {
      return false;
    }

    const values = this.form.getRawValue();

    if (category.type === 'percent' && !isSolarM2Item(item)) {
      return values.montant !== null && Number(values.montant) > 0;
    }
    if (isSolarM2Item(item)) {
      return (
        values.montant !== null &&
        Number(values.montant) > 0 &&
        values.surface !== null &&
        Number(values.surface) > 0
      );
    }
    if (category.type === 'flat') {
      return values.quantity !== null && Number(values.quantity) >= 1;
    }
    if (category.type === 'offgrid') {
      return values.power !== null && Number(values.power) > 0;
    }

    return false;
  }

  private isStepFourValid(): boolean {
    const personal = this.form.get('personal');
    return personal ? personal.valid : false;
  }

  private collectLead(): void {
    const personalGroup = this.form.get('personal');
    if (!personalGroup) {
      return;
    }

    const personal = personalGroup.getRawValue() as {
      fullName: string;
      email: string;
      phoneNumber: string;
    };

    if (!personal.email?.trim()) {
      return;
    }

    this.leadService
      .createLead({
        email: personal.email.trim(),
        phoneNumber: personal.phoneNumber?.trim(),
        name: personal.fullName?.trim(),
        source: 'subventions-simulator',
      })
      .subscribe({
        error: () => {
          // Non-blocking: lead collection must not block the simulation result
        },
      });
  }
}
