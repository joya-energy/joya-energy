import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { Store } from '../../core/state/store';
import { ApiService } from '../services/api.service';

// 1. Define the State Interface
export interface SimulationState {
  simulations: any[]; // Replace 'any' with your actual Simulation interface
  loading: boolean;
  error: string | null;
  selectedSimulationId: string | null;
}

// 2. Define Initial State
const initialState: SimulationState = {
  simulations: [],
  loading: false,
  error: null,
  selectedSimulationId: null
};

@Injectable({
  providedIn: 'root'
})
export class SimulationStateService extends Store<SimulationState> {
  private api = inject(ApiService);

  constructor() {
    super(initialState);
  }

  // 3. Selectors (Exposed as Observables)
  readonly simulations$ = this.select(state => state.simulations);
  readonly loading$ = this.select(state => state.loading);
  readonly error$ = this.select(state => state.error);
  
  // 4. Actions (Methods that update state)
  
  loadSimulations() {
    this.setState({ loading: true, error: null });
    
    // This is just an example endpoint
    this.api.get<any[]>('/audit-energetique-simulations').pipe(
      finalize(() => this.setState({ loading: false }))
    ).subscribe({
      next: (data) => this.setState({ simulations: data }),
      error: (err) => this.setState({ error: err.message || 'Failed to load simulations' })
    });
  }

  selectSimulation(id: string) {
    this.setState({ selectedSimulationId: id });
  }
}

