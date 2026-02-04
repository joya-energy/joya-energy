import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

/**
 * Generic Store for reactive state management.
 * @template T The state interface
 */
export class Store<T> {
  private _state$: BehaviorSubject<T>;

  protected constructor(initialState: T) {
    this._state$ = new BehaviorSubject<T>(initialState);
  }

  /**
   * Select a slice of state as an Observable.
   * @param selectorFn Function to select a part of the state
   */
  protected select<K>(selectorFn: (state: T) => K): Observable<K> {
    return this._state$.asObservable().pipe(
      map(selectorFn),
      distinctUntilChanged()
    );
  }

  /**
   * Get current snapshot of state.
   */
  protected get state(): T {
    return this._state$.getValue();
  }

  /**
   * Update state immutably.
   * @param partialState Object to merge into current state
   */
  protected setState(partialState: Partial<T>): void {
    this._state$.next({
      ...this.state,
      ...partialState
    });
  }
}

