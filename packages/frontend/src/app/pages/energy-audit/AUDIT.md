# Energy Audit / Simulator – Code Audit

**Date:** 2025-01-26  
**Scope:** `packages/frontend/src/app/pages/energy-audit` (energy simulator).  
**Focus:** Logic, progression, button enable/disable, modularity.

---

## 1. What Exists & Works

### 1.1 Form service (`energy-audit-form.service.ts`)

- **`buildForm()`** – Creates a `FormGroup` with one control per step field; all required. Single place for form shape.
- **`getSteps()`** – Returns 5 steps: 1–4 form steps, 5 result step. Each step has `number`, `title`, `description?`, `fields[]`, `isResult?`, `component?`.
- **Step fields** – Metadata: `name`, `label`, `type`, `options`, `shortInput`, `useDropdown`, `condition`, tooltips, min/max. Options from enums; building categories from `BUILDING_CARD_CONFIG`.
- **Options** – Governorates, insulation, glazing, heating, cooling, etc. exposed from enums via `getEnumValues`.

### 1.2 Types (`energy-audit.types.ts`)

- `StepField`, `SimulatorStep`, `EnergyAuditFormValue`, `EnergyAuditRequest`, `EnergyAuditResponse`.
- `StepField.condition?: (form: any) => boolean` for visibility (uses `any`; should be typed).

### 1.3 Step components (modular)

- **Step 1:** `StepBuildingComponent` – building type cards, surface, floors, activity, climate zone.
- **Step 2:** `StepTechnicalComponent` – days/hours, insulation, glazing, heating, cooling.
- **Step 3:** `StepEquipmentComponent` – hot water, ventilation, lighting, coverage, equipment categories, existing measures.
- **Step 4:** `StepPersonalComponent` – personal + consumption fields.

All receive `form` as `@Input`, use `formService` for options (or parent-passed building config). Same control names as in `getSteps()`, so progress can align.

### 1.4 Main component (`energy-audit.component.ts`)

- **State:** `currentStep` signal, `stepProgress` computed from form, `canProceed` (100% step completion), `canGoBack`.
- **Sidebar:** Progress bars per step, result step rendered differently. Steps clickable only when **going back** (`stepNumber < current`).
- **Navigation:** `nextStep` / `previousStep` / `goToStep`. Validation before next; notifications on incomplete step.
- **Submit:** `submitForm` → `auditService.createSimulation` → success: set result, move to step 5, notification.
- **Payload:** `buildPayload()` maps `form.getRawValue()` → `EnergyAuditRequest`.
- **Progress reactivity:** `form.valueChanges` → `formUpdateTrigger` update + `markForCheck` so `stepProgress` updates.

### 1.5 API

- `EnergyAuditService.createSimulation` POSTs to `/energy-audit-simulations`.

---

## 2. What’s Broken or Inconsistent

### 2.1 **Critical: Nested forms**

- **Main template:** `<form [formGroup]="form" class="simulator-form">` wraps step content.
- **Each step component:** Has its own `<form [formGroup]="form" class="step-...">` around its fields.
- **Effect:** Form inside form (invalid HTML). Can break submission, validation, and keyboard behavior (e.g. Enter).

**Fix:** One form only. Either:

- **A)** Keep the form in the parent; step components render **only** fields (no `<form>`), e.g. `<div class="step-building">` with `formControlName` bindings still inside the parent `<form>`, **or**
- **B)** Remove the parent form; have a single form in one step component or a shared form wrapper, and ensure submission/validation use that.

---

### 2.2 **Critical: Navigation buttons on result step**

- **Current:** `form-actions` (Précédent / Suivant or Voir les résultats) are **always** shown, including on **step 5 (result)**.
- **Logic:** `currentStep() < steps.length - 1` → “Suivant”; else → “Voir les résultats” (submit).
- **Problem:** On step 5 we still show “Voir les résultats”. `canProceed()` is false for result step so it’s disabled, but the CTA is wrong and confusing.

**Fix:** When `currentStepData().isResult`:

- **Option A:** Hide the primary action; only show “Précédent”.
- **Option B:** Show “Précédent” + optional “Recommencer” (reset and go to step 1), and hide “Voir les résultats”.

---

### 2.3 **Critical: “Last form step” vs “result step”**

- **Current:** “Voir les résultats” is shown when `currentStep() >= steps.length - 1` (i.e. step 4 **or** 5).
- **Intent:** Submit only on **last form step** (4). Result step (5) should not show submit.

**Fix:** Use “show submit” only when **not** result **and** last form step, e.g.:

- `const lastFormStep = steps.find(s => s.isResult)?.number ?? steps.length;`
- Show “Voir les résultats” only when `currentStep() === lastFormStep - 1` (or equivalent), and hide it when `currentStepData().isResult`.

---

### 2.4 **Modularity: Two sources of truth for fields**

- **Form service:** `getSteps()` defines fields, labels, options, `useDropdown`, `shortInput`, tooltips, etc.
- **Step components:** Hardcode labels, placeholders, tooltips, variants (box vs dropdown).
- **Effect:** Duplication. Changing `getSteps()` doesn’t update step UIs. Adding a field requires edits in both. Progress uses `step.fields`, but UI doesn’t derive from it.

**Example:** `activityType` has `useDropdown: true` in config; `step-building` uses `variant="box"`.

**Fix (long-term):** Make step components **data-driven** from `step.fields` (or a per-step config derived from it). Shared field renderer (or small helpers) for input/select/box-icon so we **add/change fields in one place** (form service) and stay modular.

---

### 2.5 **Dead fallback UI**

- **Current:** `@else` in the step `@if` chain renders a “fallback” `form-fields` block that loops over `currentStepData().fields` and uses `isFieldVisible`, `shouldGroupWithNext`, etc.
- **Usage:** That block runs only when `currentStep()` is **not** 1–4. Step 5 is result (no form). There are no other steps.
- **Effect:** Fallback is **dead code**. It also contains building-type cards and other field-specific markup that duplicate step 1.

**Fix:** Remove the fallback block, or repurpose it only if you later add dynamic steps beyond 1–4. Until then, delete it to avoid confusion and double form markup.

---

### 2.6 **`formUpdateTrigger` and progress**

- **Current:** `form.valueChanges` updates `formUpdateTrigger` and calls `markForCheck`. `stepProgress` computed reads `formUpdateTrigger()` and `this.form.value`.
- **Note:** Form values aren’t signals; we force reactivity via `formUpdateTrigger`. It works but is a bit brittle.
- **Minor:** `valueChanges` also calls `updateValueAndValidity` on every control; might be unnecessary for progress. Consider doing that only when needed (e.g. before next/submit).

---

### 2.7 **`any` usage (cursorrules)**

- `trackByCategory(_: number, category: any)` in main component.
- `StepField.condition?: (form: any) => boolean`.
- **Fix:** Use proper types (e.g. `BuildingCardConfig`, form value type).

---

### 2.8 **Error handling**

- `submitForm` error handler uses `console.error`. Project rules prefer a logger; no logger exists in frontend yet.
- **Fix:** Add a small logger facade and use it; or leave a `// TODO: use logger` and replace when available.

---

### 2.9 **Result view**

- **Current:** Shows “Résultats de votre audit”, `simulationId`, `createdAt`, and “Les calculs sont en cours...” when no result.
- **Gap:** No real result metrics or structure yet (`EnergyAuditResponse.data.results` is `[key: string]: any`). Fine for now, but worth aligning with API when it’s defined.

---

## 3. Logic Summary (Progression & Buttons)

| Concept | Implementation | Status |
|--------|----------------|--------|
| Current step | `currentStep` signal (1–5) | OK |
| Step progress | `stepProgress` computed from visible, filled, valid fields | OK |
| Overall progress | `overallProgress` = progress of current step | OK |
| “Suivant” enabled | `canProceed` (current step 100% complete) | OK |
| “Précédent” enabled | `canGoBack` (step > 1) | OK |
| Sidebar step click | Only when `stepNumber < current` (go back) | OK |
| Submit / “Voir les résultats” | Shown when `currentStep() >= steps.length - 1` | **Bug:** also on result step; should be only last form step |
| Buttons on result step | Same as form steps | **Bug:** should hide primary CTA or show different actions |
| Form validation before next | `nextStep` checks `canProceed`, marks touched, shows notification | OK |
| Form validation before submit | `submitForm` checks `form.invalid`, marks touched | OK |

---

## 4. Recommended Fix Order

1. **Nested forms** – Single form only (parent **or** steps, not both). Simplest: remove `<form>` from step components, keep parent form.
2. **Button visibility on result step** – Hide “Voir les résultats” when `currentStepData().isResult`; show only “Précédent” (and optionally “Recommencer”).
3. **Submit = last form step only** – Show “Voir les résultats” only when on step 4, not on step 5.
4. **Remove dead fallback** – Delete the `@else { form-fields ... }` block (or clearly limit its use to future dynamic steps).
5. **Types** – Replace `any` in `trackByCategory` and `StepField.condition`.
6. **Data-driven steps (later)** – Refactor step components to render from `step.fields` (or derived config) so form service is the single source of truth.

---

## 5. File-Level Overview

| File | Role |
|------|------|
| `energy-audit.component.ts` | Orchestration, navigation, progress, submit, buildPayload |
| `energy-audit.component.html` | Layout, sidebar, timeline, form wrapper, step branching, form-actions |
| `energy-audit-form.service.ts` | Form build, steps + fields config, options |
| `energy-audit.service.ts` | API: createSimulation |
| `energy-audit.types.ts` | StepField, SimulatorStep, request/response types |
| `steps/step-building|technical|equipment|personal` | Per-step UI; each has its own `<form>` (nested form issue) |

---

---

## 6. Applied Fixes (2025-01-26)

- **Nested forms:** Removed `<form>` from all step components (`step-building`, `step-technical`, `step-equipment`, `step-personal`). They now render `<div class="step-...">` only. The single `<form [formGroup]="form">` lives in the main component and wraps the step content.
- **Navigation on result step:** When `currentStepData().isResult` is true, the primary CTA (Suivant / Voir les résultats) is hidden. Only "Précédent" is shown.
- **Submit vs Suivant:** "Suivant" is shown when `currentStep() < lastFormStepNumber`; "Voir les résultats" when on the last form step (4). `lastFormStepNumber` is derived from `steps` (result step number − 1).
- **Dead fallback removed:** The `@else { form-fields ... }` block has been deleted. Steps 1–4 use only the step components.
- **Cleanup:** Removed unused helpers from the main component (`getFieldOptions`, `getFieldOptionsForIcon`, `shouldUseDropdown`, `shouldGroupWithNext`, `isFirstInGroup`, `getOptionCount`, `shouldCenterSelection`, `isFeaturedBuilding`, `selectBuildingType`, `getBuildingTypeOptions`, `trackByCategory`) and unused imports (`UiSelectComponent`, `UiInputComponent`, `FieldTooltipComponent`, `SelectOption`).

**Still to do (optional):** Replace `any` in types, add logger for errors, consider data-driven step rendering from `step.fields`.
