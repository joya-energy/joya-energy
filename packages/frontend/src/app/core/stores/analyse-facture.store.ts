import { Injectable } from '@angular/core';
import { Store } from '../state/store';
import type { StegAnalyseResponse } from '@shared/interfaces/analyse-facture.interface';
import type {
  BtAnalyseResult,
  MtAnalyseResult,
} from '../../pages/analyse-facture-resultats/analyse-facture-resultats.types';
import type { MappedAnalyseFactureResult } from '../utils/analyse-facture.mapper';

export interface AnalyseFactureState {
  raw: StegAnalyseResponse | null;
  btResult: BtAnalyseResult | null;
  mtResult: MtAnalyseResult | null;
  tariffType: 'BT' | 'MT' | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzedAt: Date | null;
}

const initialState: AnalyseFactureState = {
  raw: null,
  btResult: null,
  mtResult: null,
  tariffType: null,
  isAnalyzing: false,
  error: null,
  analyzedAt: null,
};

@Injectable({
  providedIn: 'root',
})
export class AnalyseFactureStore extends Store<AnalyseFactureState> {
  constructor() {
    super(initialState);
  }

  readonly raw$ = this.select((state) => state.raw);
  readonly btResult$ = this.select((state) => state.btResult);
  readonly mtResult$ = this.select((state) => state.mtResult);
  readonly tariffType$ = this.select((state) => state.tariffType);
  readonly isAnalyzing$ = this.select((state) => state.isAnalyzing);
  readonly error$ = this.select((state) => state.error);

  getMappedResult(): MappedAnalyseFactureResult | null {
    if (!this.state.raw || !this.state.tariffType) {
      return null;
    }
    return {
      raw: this.state.raw,
      tariffType: this.state.tariffType,
      btResult: this.state.btResult,
      mtResult: this.state.mtResult,
    };
  }

  getBtResult(): BtAnalyseResult | null {
    return this.state.btResult;
  }

  getMtResult(): MtAnalyseResult | null {
    return this.state.mtResult;
  }

  getTariffType(): 'BT' | 'MT' | null {
    return this.state.tariffType;
  }

  setAnalyzing(isAnalyzing: boolean): void {
    this.setState({
      isAnalyzing,
      error: isAnalyzing ? null : this.state.error,
    });
  }

  setResult(mapped: MappedAnalyseFactureResult): void {
    this.setState({
      raw: mapped.raw,
      btResult: mapped.btResult,
      mtResult: mapped.mtResult,
      tariffType: mapped.tariffType,
      isAnalyzing: false,
      error: null,
      analyzedAt: new Date(),
    });
  }

  setError(error: string): void {
    this.setState({
      isAnalyzing: false,
      error,
    });
  }

  clear(): void {
    this.setState(initialState);
  }
}
