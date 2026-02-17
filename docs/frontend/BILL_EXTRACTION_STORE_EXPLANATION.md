# Bill Extraction Store - How It Works

## Overview

The `BillExtractionStore` is an **in-memory state management solution** built on RxJS. It stores extracted bill data temporarily in the browser's memory during the user's session.

## Where Data is Stored

### Storage Location: **Browser Memory (RAM)**
- ✅ **In-memory only** - Uses RxJS `BehaviorSubject` 
- ✅ **Session-based** - Data persists only while the app is running
- ❌ **NOT persisted** - Data is lost on page refresh/reload
- ❌ **NOT in localStorage/sessionStorage** - No browser storage is used

### Technical Implementation

```typescript
// Base Store uses BehaviorSubject (RxJS)
private _state$: BehaviorSubject<T>;

// State is stored in memory as a JavaScript object
{
  extractedData: ExtractedBillData | null,
  isExtracting: boolean,
  error: string | null,
  lastExtractedAt: Date | null
}
```

## How It Works

### 1. **State Management Pattern**
- Uses **BehaviorSubject** from RxJS to hold state
- State is **immutable** - updates create new state objects
- **Reactive** - components can subscribe to state changes

### 2. **Store Lifecycle**

```
┌─────────────────────────────────────────┐
│  App Starts                             │
│  └─> Store initialized with null state  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  User uploads bill & extracts           │
│  └─> setExtractedData() called          │
│  └─> State updated in memory             │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Other components access data           │
│  └─> getExtractedData() or subscribe    │
│  └─> Read from memory                   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Page Refresh / App Restart             │
│  └─> All data lost (memory cleared)     │
└─────────────────────────────────────────┘
```

## How to Access the Store

### Method 1: **Inject and Use Directly** (Easiest)

```typescript
import { Component, inject } from '@angular/core';
import { BillExtractionStore } from '@app/core/stores/bill-extraction.store';
import { ExtractedBillData } from '@shared/interfaces/bill-extraction.interface';

@Component({...})
export class MyComponent {
  // Inject the store
  private billExtractionStore = inject(BillExtractionStore);

  // Get data synchronously (current snapshot)
  getCurrentData(): ExtractedBillData | null {
    return this.billExtractionStore.getExtractedData();
  }

  // Use in a method
  onSomeAction() {
    const data = this.billExtractionStore.getExtractedData();
    if (data) {
      console.log('Monthly bill:', data.monthlyBillAmount.value?.total);
      console.log('Consumption:', data.recentBillConsumption.value?.total);
    }
  }
}
```

### Method 2: **Subscribe to Changes** (Reactive)

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { BillExtractionStore } from '@app/core/stores/bill-extraction.store';
import { Subscription } from 'rxjs';

@Component({...})
export class MyComponent implements OnInit, OnDestroy {
  private billExtractionStore = inject(BillExtractionStore);
  private subscription?: Subscription;
  
  extractedData: ExtractedBillData | null = null;

  ngOnInit() {
    // Subscribe to data changes
    this.subscription = this.billExtractionStore.extractedData$.subscribe(
      (data) => {
        this.extractedData = data;
        if (data) {
          // React to new data
          this.onDataReceived(data);
        }
      }
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private onDataReceived(data: ExtractedBillData) {
    // Do something with the data
  }
}
```

### Method 3: **Use with Signals** (Angular 16+)

```typescript
import { Component, inject, effect } from '@angular/core';
import { BillExtractionStore } from '@app/core/stores/bill-extraction.store';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({...})
export class MyComponent {
  private billExtractionStore = inject(BillExtractionStore);
  
  // Convert Observable to Signal
  extractedData = toSignal(this.billExtractionStore.extractedData$);

  constructor() {
    // React to changes
    effect(() => {
      const data = this.extractedData();
      if (data) {
        console.log('Data changed:', data);
      }
    });
  }
}
```

## Available Methods & Properties

### **Observables** (Reactive - Subscribe to changes)
```typescript
billExtractionStore.extractedData$    // Observable<ExtractedBillData | null>
billExtractionStore.isExtracting$      // Observable<boolean>
billExtractionStore.error$             // Observable<string | null>
billExtractionStore.lastExtractedAt$   // Observable<Date | null>
```

### **Synchronous Methods** (Get current state)
```typescript
billExtractionStore.getExtractedData()  // Returns ExtractedBillData | null
```

### **State Mutations** (Update state)
```typescript
billExtractionStore.setExtractedData(data)  // Store extracted data
billExtractionStore.setExtracting(true)     // Set loading state
billExtractionStore.setError('message')      // Set error message
billExtractionStore.clear()                  // Clear all data
```

## Real-World Usage Examples

### Example 1: **Solar Audit Component** (Pre-fill form)

```typescript
@Component({...})
export class SolarAuditComponent {
  private billExtractionStore = inject(BillExtractionStore);

  ngOnInit() {
    // Check if bill data exists
    const billData = this.billExtractionStore.getExtractedData();
    
    if (billData) {
      // Pre-fill form with extracted data
      this.form.patchValue({
        monthlyBillAmount: billData.monthlyBillAmount.value?.total,
        consumption: billData.recentBillConsumption.value?.total,
        address: billData.address.value,
        governorate: billData.governorate.value,
        // ... etc
      });
    }
  }
}
```

### Example 2: **Energy Audit Component** (Watch for changes)

```typescript
@Component({...})
export class EnergyAuditComponent implements OnInit {
  private billExtractionStore = inject(BillExtractionStore);
  
  ngOnInit() {
    // Subscribe to bill extraction
    this.billExtractionStore.extractedData$.subscribe(data => {
      if (data) {
        this.populateFormFromBill(data);
      }
    });
  }

  private populateFormFromBill(data: ExtractedBillData) {
    // Auto-populate form fields
  }
}
```

### Example 3: **Display Extracted Data** (Show in UI)

```typescript
@Component({
  template: `
    @if (billData(); as data) {
      <div class="bill-summary">
        <h3>Facture extraite</h3>
        <p>Montant: {{ data.monthlyBillAmount.value?.total }} TND</p>
        <p>Consommation: {{ data.recentBillConsumption.value?.total }} kWh</p>
        <p>Période: {{ data.periodStart.value }} - {{ data.periodEnd.value }}</p>
      </div>
    }
  `
})
export class BillSummaryComponent {
  private billExtractionStore = inject(BillExtractionStore);
  billData = toSignal(this.billExtractionStore.extractedData$);
}
```

## Data Structure

```typescript
interface ExtractedBillData {
  monthlyBillAmount: {
    value: { total: number } | null,
    explanation: string
  },
  recentBillConsumption: {
    value: { total: number } | null,
    explanation: string
  },
  periodStart: { value: string | null, explanation: string },
  periodEnd: { value: string | null, explanation: string },
  period: { value: number | null, explanation: string },
  tariffType: { value: string | null, explanation: string },
  contractedPower: { value: number | null, explanation: string },
  address: { value: string | null, explanation: string },
  clientName: { value: string | null, explanation: string },
  governorate: { value: string | null, explanation: string },
  meterNumber: { value: string | null, explanation: string },
  reference: { value: string | null, explanation: string },
  district: { value: string | null, explanation: string },
  BillAmountDividedByPeriod: { value: number | null, explanation: string }
}
```

## Important Notes

### ✅ **Advantages**
- **Easy to access** - Just inject and use
- **Reactive** - Components automatically update when data changes
- **Type-safe** - Full TypeScript support
- **Lightweight** - No external dependencies beyond RxJS
- **Shared across components** - Single source of truth

### ⚠️ **Limitations**
- **Not persistent** - Data lost on page refresh
- **Memory only** - Not saved to database or localStorage
- **Session-based** - Only available during app session

### 💡 **When to Use**
- ✅ Sharing bill data between components in the same session
- ✅ Pre-filling forms with extracted data
- ✅ Displaying extracted data in multiple places
- ✅ Temporary state during user workflow

### ❌ **When NOT to Use**
- ❌ Long-term data persistence (use backend/database)
- ❌ Data that needs to survive page refresh (use localStorage/backend)
- ❌ Sensitive data that needs encryption (use secure backend storage)

## Persistence Options (If Needed)

If you need to persist data across page refreshes, you could:

### Option 1: **localStorage** (Browser storage)
```typescript
// In store or service
setExtractedData(data: ExtractedBillData) {
  localStorage.setItem('billData', JSON.stringify(data));
  this.setState({ extractedData: data });
}

getExtractedData(): ExtractedBillData | null {
  const stored = localStorage.getItem('billData');
  return stored ? JSON.parse(stored) : null;
}
```

### Option 2: **Backend API** (Database)
```typescript
// Save to backend
this.apiService.post('/bill-extraction/save', data).subscribe();

// Load from backend
this.apiService.get('/bill-extraction/latest').subscribe();
```

## Summary

- **Storage**: Browser memory (RAM) via RxJS BehaviorSubject
- **Persistence**: None - data lost on page refresh
- **Access**: Very easy - inject `BillExtractionStore` and call methods
- **Reactivity**: Full RxJS Observable support
- **Use Case**: Temporary state sharing during user session

The store is designed to be **simple, lightweight, and easy to use** for sharing bill extraction data across components during a single user session.
