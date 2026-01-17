/**
 * Financing Comparison Service
 * Handles API calls and state management for financing comparisons
 * Uses Angular signals for reactive state
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Governorates } from '@shared/enums/audit-general.enum';

export interface ProjectInput {
  location: Governorates;
  installationSizeKwp?: number;
  investmentAmountDt?: number;
}

export interface ProjectCalculation {
  sizeKwp: number;
  capexDt: number;
  annualProductionKwh: number;
  annualGrossSavingsDt: number;
  monthlyGrossSavingsDt: number;
  annualOpexDt: number;
  monthlyOpexDt: number;
}

export interface FinancingSolution {
  type: 'cash' | 'credit' | 'leasing' | 'esco';
  initialInvestment: number;
  monthlyPayment: number;
  monthlyOpex: number;
  totalMonthlyCost: number;
  monthlyCashflow: number;
  durationMonths: number;
  durationYears: number;
}

export interface CashSolution extends FinancingSolution {
  type: 'cash';
}

export interface CreditSolution extends FinancingSolution {
  type: 'credit';
  creditMonthlyRate: number;
  creditAnnualRate: number;
  selfFinancingDt: number;
  financedPrincipalDt: number;
}

export interface LeasingSolution extends FinancingSolution {
  type: 'leasing';
  leasingMonthlyRate: number;
  leasingAnnualRate: number;
  leasingDownPaymentDt: number;
  leasingResidualValueDt: number;
  leasingResidualValueRate: number;
}

export interface EscoSolution extends FinancingSolution {
  type: 'esco';
  escoTargetIrrMonthly: number;
  escoTargetIrrAnnual: number;
  escoOpexIncluded: boolean;
  isViable?: boolean;
  viabilityError?: string;
}

export interface ComparisonResult {
  input: ProjectInput;
  projectCalculation: ProjectCalculation;
  cash: CashSolution;
  credit: CreditSolution;
  leasing: LeasingSolution;
  esco: EscoSolution;
}

export interface Location {
  location: Governorates;
  yieldKwhPerKwpYear: number;
}

export interface SolutionAdvantages {
  type: string;
  advantages: string[];
  disadvantages: string[];
  dafReading: string;
}

@Injectable({
  providedIn: 'root',
})
export class FinancingComparisonService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/financing-comparisons`;

  private comparisonResultSignal = signal<ComparisonResult | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private locationsSignal = signal<Location[]>([]);
  private advantagesSignal = signal<Record<string, SolutionAdvantages>>({});

  public comparisonResult = this.comparisonResultSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();
  public error = this.errorSignal.asReadonly();
  public locations = this.locationsSignal.asReadonly();
  public advantages = this.advantagesSignal.asReadonly();

  public hasResult = computed(() => this.comparisonResultSignal() !== null);
  public solutions = computed(() => {
    const result = this.comparisonResultSignal();
    if (!result) return [];
    return [result.cash, result.credit, result.leasing, result.esco];
  });

  public bestCashflow = computed(() => {
    const solutions = this.solutions();
    if (solutions.length === 0) return null;
    return solutions.reduce((best, current) =>
      current.monthlyCashflow > best.monthlyCashflow ? current : best
    );
  });

  public lowestInitialInvestment = computed(() => {
    const solutions = this.solutions();
    if (solutions.length === 0) return null;
    return solutions.reduce((lowest, current) =>
      current.initialInvestment < lowest.initialInvestment ? current : lowest
    );
  });

  /**
   * Creates a new financing comparison
   */
  public createComparison(input: ProjectInput): Observable<ComparisonResult> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<{ success: boolean; data: ComparisonResult }>(this.apiUrl, input)
      .pipe(
        map((response) => response.data),
        tap((result) => {
          this.comparisonResultSignal.set(result);
          this.loadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set(error.error?.message || 'An error occurred');
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Fetches available locations
   */
  public fetchLocations(): Observable<Location[]> {
    return this.http
      .get<{ success: boolean; data: Location[] }>(`${this.apiUrl}/locations`)
      .pipe(
        map((response) => response.data),
        tap((locations) => {
          this.locationsSignal.set(locations);
        }),
        catchError((error) => {
          console.error('Error fetching locations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Fetches solution advantages
   */
  public fetchAdvantages(): Observable<Record<string, SolutionAdvantages>> {
    return this.http
      .get<{ success: boolean; data: Record<string, SolutionAdvantages> }>(
        `${this.apiUrl}/advantages`
      )
      .pipe(
        map((response) => response.data),
        tap((advantages) => {
          this.advantagesSignal.set(advantages);
        }),
        catchError((error) => {
          console.error('Error fetching advantages:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Clears the current comparison result
   */
  public clearResult(): void {
    this.comparisonResultSignal.set(null);
    this.errorSignal.set(null);
  }
}

