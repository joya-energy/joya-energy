# Bill Upload Feature Analysis - Solar Audit

## Summary
**Status: ❌ NOT IMPLEMENTED**

The bill upload feature in the solar audit is **partially implemented** in the frontend but **completely missing** in the backend integration.

---

## Frontend Implementation

### ✅ What Works:
1. **UI Components**: The upload card component (`app-upload-card`) is properly integrated
2. **Form Control**: Bill file is stored in `form.get('consumption.billAttachment')?.value`
3. **File Selection**: `onBillSelected()` method correctly sets the file in the form control
4. **Conditional Display**: Upload section shows when user selects "Oui, j'ai une facture récente"

### ❌ What's Missing:
1. **File Upload**: The bill file is **NEVER sent to the backend**
2. **Bill Extraction**: No integration with bill extraction service
3. **FormData Submission**: The form is submitted as JSON, not multipart/form-data

### Current Flow:
```typescript
// solar-audit.component.ts - submitForm()
const payload: CreateSimulationPayload = {
  address: value.location?.address ?? '',
  measuredAmountTnd: value.consumption?.measuredAmountTnd ?? 0,
  referenceMonth,
  buildingType: value.building?.buildingType ?? '',
  climateZone: value.building?.climateZone ?? '',
  // ❌ billAttachment is NOT included!
};
```

---

## Backend Implementation

### Current State:
- **Endpoint**: `/audit-solaire-simulations` (POST)
- **Content-Type**: `application/json` only
- **File Support**: ❌ None
- **Bill Extraction**: ❌ Not integrated

### Controller:
```typescript
// audit-solaire.controller.ts
public createSimulation = async (req: Request, res: Response) => {
  const input = sanitizePayload(req.body); // Only expects JSON
  // No file handling
}
```

### Expected Payload:
```typescript
{
  address: string;
  buildingType: string;
  climateZone: string;
  measuredAmountTnd: number;
  referenceMonth: number;
  // No billAttachment field
}
```

---

## Comparison with Energy Audit

### Energy Audit Implementation (✅ Working):
1. **Two Endpoints**:
   - `/audit-energetique-simulations` - JSON only
   - `/audit-energetique-simulations/full-upload` - Multipart/form-data with file

2. **Bill Extraction Service**:
   ```typescript
   const extracted = await billExtractionService.extractDataFromImage(
     req.file.buffer,
     req.file.mimetype
   );
   ```

3. **Data Merging**:
   ```typescript
   const mergedBody = mergeExtractedValues(req.body, extracted);
   ```

---

## What Needs to Be Done

### Option 1: Add Bill Upload Support (Recommended)
1. **Backend**:
   - Add new endpoint: `/audit-solaire-simulations/with-bill` (multipart/form-data)
   - Integrate `billExtractionService` to extract `measuredAmountTnd` and `referenceMonth` from bill
   - Merge extracted data with form data

2. **Frontend**:
   - Modify `submitForm()` to check if bill file exists
   - If file exists, use `postFormData()` instead of `post()`
   - Create FormData with file and other fields
   - Send to new endpoint

### Option 2: Extract Data First, Then Submit
1. **Frontend**:
   - When user clicks "Extract from bill", call `/audit-energetique-simulations/extract-bill-data`
   - Populate form fields with extracted data
   - Submit normally as JSON

### Option 3: Store File Only (No Extraction)
1. **Backend**:
   - Accept file upload
   - Store file URL/path in database
   - Don't extract data (user still enters manually)

---

## Current User Experience

When a user:
1. ✅ Selects "Oui, j'ai une facture récente"
2. ✅ Uploads a bill image
3. ✅ Clicks "Extraire les données de la facture"
4. ❌ **Nothing happens** - file is ignored
5. ❌ User must manually enter `measuredAmountTnd` and `referenceMonth`
6. ❌ File is never sent to backend

---

## Files Involved

### Frontend:
- `packages/frontend/src/app/pages/solar-audit/solar-audit.component.ts` - Form submission
- `packages/frontend/src/app/core/services/audit-solaire.service.ts` - API service
- `packages/frontend/src/app/pages/solar-audit/solar-audit.component.html` - Upload UI

### Backend:
- `packages/backend/src/modules/audit-solaire/audit-solaire.controller.ts` - Controller
- `packages/backend/src/modules/audit-solaire/audit-solaire.routes.ts` - Routes
- `packages/backend/src/modules/audit-solaire/audit-solaire.service.ts` - Service

### Reference (Energy Audit):
- `packages/backend/src/modules/audit-energetique/audit-energetique.controller.ts` - Has `createSimulationWithBill`
- `packages/backend/src/modules/audit-energetique/bill-extraction.service.ts` - Extraction logic

---

## Recommendation

**Implement Option 1** - Add bill upload support similar to energy audit:
1. Reuse existing `billExtractionService` from energy audit module
2. Add new endpoint for solar audit with file upload
3. Extract `measuredAmountTnd` and `referenceMonth` from bill
4. Auto-populate form or merge with submitted data
5. Update frontend to use FormData when file is present

This provides the best user experience and maintains consistency with the energy audit feature.
