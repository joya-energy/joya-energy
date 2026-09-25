# JOYA — WhatsApp Agent Integration Guide

Reference for a conversational agent that collects user inputs, calls JOYA backend APIs, and explains results in plain language.

**Audience:** Agent developers / prompt engineers  
**Last updated:** 2026-07-16  
**Production API base:** `https://joya-energy.com/api`  
**Local dev base:** `http://localhost:3001/api`

---

## Table of contents

1. [Overview](#1-overview)
2. [General rules](#2-general-rules)
3. [Simulators map](#3-simulators-map)
4. [Pré-estimation solaire (landing, client-side)](#4-pré-estimation-solaire-landing-client-side)
5. [Audit Solaire](#5-audit-solaire)
6. [Audit Énergétique](#6-audit-énergétique)
7. [Bilan Carbone](#7-bilan-carbone)
8. [Comparateur de financements](#8-comparateur-de-financements)
9. [Analyse Facture STEG](#9-analyse-facture-steg)
10. [Extraction facture (OCR)](#10-extraction-facture-ocr)
11. [Simulateur subventions FTE (client-side)](#11-simulateur-subventions-fte-client-side)
12. [Capture de leads](#12-capture-de-leads)
13. [Enums & allowed values](#13-enums--allowed-values)
14. [Recommended agent flows](#14-recommended-agent-flows)

---

## 1. Overview

JOYA exposes several **energy & sustainability calculators** on the website. Some run entirely in the browser; most heavy calculations run on the **Express backend**.

| Resource | Page route | Backend API | Auth |
|----------|------------|-------------|------|
| Pré-estimation solaire | `/` (embedded) | None | — |
| Audit Solaire | `/audit-solaire` | `POST /audit-solaire-simulations` | Public |
| Audit Énergétique | `/audit-energetique` | `POST /audit-energetique-simulations` | Public |
| Bilan Carbone | `/bilan-carbon` | `POST /carbon-simulator/summary` | Public |
| Comparateur financements | `/comparaison-financements` | `POST /financing-comparisons` | Public |
| Analyse Facture | `/analyse-facture` | `POST /analyse-facture/analyze` | Public |
| Extraction facture (helper) | Used inside audits | `POST /bill-extraction/extract` | Public |
| Subventions FTE | `/simulateur-subventions` | None (client formula) | — |
| Leads | All forms | `POST /leads` | Public |

**Swagger UI:** `{HOST}/api-docs`  
**Health check:** `GET /api/health`

---

## 2. General rules

### 2.1 Authentication

All simulator endpoints are **public** (no JWT). Only admin lead management (`GET/PATCH/PUT /leads`) requires `Authorization: Bearer {ADMIN_PASSWORD}`.

### 2.2 Content types

| Endpoint type | Content-Type |
|---------------|--------------|
| JSON simulators | `application/json` |
| Bill upload | `multipart/form-data` (field name: `billImage`) |

### 2.3 Units & conventions

- **Money:** Tunisian Dinar (`DT` / `TND`)
- **Energy:** kWh, kWp (kilowatt-crête), kVA
- **CO₂:** kg and tonnes per year
- **Rates in financing API:** decimals (`0.11` = 11%)
- **Climate zones (API):** `Nord`, `Centre`, `Sud` (capitalized)
- **Climate zones (pré-sim form):** `nord`, `centre`, `sud` (lowercase — client only)

### 2.4 Lead side-effects

When `email` is provided, these endpoints **asynchronously** create a lead:

| Endpoint | `source` value |
|----------|----------------|
| Audit Solaire | `audit-solaire` |
| Audit Énergétique | `audit-energetique` |
| Bilan Carbone | `carbon-simulator` |
| Comparateur financements | `financing-comparison` |
| Subventions (frontend) | `subventions-simulator` |

Lead creation never blocks the main API response.

### 2.5 Error responses

Typical shape: `{ "message": "..." }` with HTTP 400/404/500. Validation errors return explicit field messages (e.g. `Invalid building type: ...`).

---

## 3. Simulators map

```
User intent                          → Action
─────────────────────────────────────────────────────────────────
Quick solar ballpark (2 questions)   → Client formula (§4) OR full audit (§5)
Full solar study                     → §10 optional → §5
Building energy performance          → §10 optional → §6
Carbon footprint                     → §7
PV financing options                 → GET locations → §8
STEG bill deep analysis (image)      → §9
STEG bill field extraction only      → §10
FTE subsidy estimate                 → §11 + POST /leads
Save contact                         → §12
```

---

## 4. Pré-estimation solaire (landing, client-side)

**Purpose:** Instant ballpark on the landing page — PV size, investment, savings, payback from only 2 inputs.  
**Frontend:** `PreAuditSolaireComponent` embedded on `/`  
**Backend:** None — replicate the formula in the agent or redirect to full Audit Solaire.

### Inputs to collect

| Field | Type | Required | Allowed values | Meaning |
|-------|------|----------|----------------|---------|
| `monthlyBillDt` | number | Yes | 0–10,000 | Monthly STEG electricity bill (DT) |
| `climateZone` | string | Yes | `nord`, `centre`, `sud` | Geographic climate band |

### Fixed assumptions (do not ask user)

| Constant | Value |
|----------|-------|
| Tariff | 0.391 DT/kWh |
| CAPEX | 2,300 DT/kWp |
| OPEX | 4% of CAPEX / year |
| Productible Nord | 1,500 kWh/kWp/year |
| Productible Centre | 1,600 kWh/kWp/year |
| Productible Sud | 1,700 kWh/kWp/year |

### Formulas

```
annualConsumptionKwh = (monthlyBillDt / 0.391) × 12
pvPowerKwp           = annualConsumptionKwh / productible[zone]
capexDt              = pvPowerKwp × 2300
opexAnnualDt         = capexDt × 0.04
annualSavingsDt      = monthlyBillDt × 12        // year-1 approximation
netAnnualGainDt      = annualSavingsDt - opexAnnualDt
paybackYears         = capexDt / netAnnualGainDt  (if netAnnualGainDt > 0)
```

### Outputs to explain to user

| Output | Unit | Significance |
|--------|------|--------------|
| Annual consumption | kWh/an | Estimated electricity use derived from bill |
| PV power | kWp | Roof/system size to cover annual consumption |
| CAPEX | DT | Estimated installation cost |
| OPEX | DT/an | Annual maintenance cost (~4% of CAPEX) |
| Annual savings | DT/an | Approximate bill reduction in year 1 |
| Payback | years | Simple return period (CAPEX ÷ net annual gain) |

**Agent tip:** This is a **rough estimate**. For geocoding, 25-year economics, NPV/IRR, and MT bills, use **Audit Solaire** (§5).

---

## 5. Audit Solaire

**Purpose:** Full photovoltaic feasibility study — geocoding, monthly consumption extrapolation, PV sizing, 25-year cash flows, NPV, IRR, ROI, CO₂ avoided.  
**Page:** `/audit-solaire`  
**Endpoint:** `POST /api/audit-solaire-simulations`

### Inputs to collect

| Field | Type | Required | Allowed values | Meaning & significance |
|-------|------|----------|----------------|------------------------|
| `address` | string | **Yes** | Non-empty | Site address — geocoded to lat/lng for solar yield |
| `fullName` | string | **Yes** | | Contact person |
| `companyName` | string | **Yes** | | Company / organization |
| `email` | string | **Yes** | Valid email | Contact + triggers lead capture |
| `phoneNumber` | string | **Yes** | | Phone (Tunisia format) |
| `buildingType` | string | **Yes** | See [BuildingTypes](#buildingtypes) | Sector — drives consumption extrapolation coefficients |
| `climateZone` | string | **Yes** | `Nord`, `Centre`, `Sud` | Climate band for seasonal extrapolation |
| `measuredAmountTnd` | number | **Yes** | ≥ 0 | **Monthly electricity bill amount (DT)** for the reference month |
| `referenceMonth` | number | **Yes** | 1–12 | Month of the bill (1=Jan … 12=Dec) — critical for seasonal extrapolation |
| `tariffTension` | string | No | `BT` (default), `MT` | Basse Tension vs Moyenne Tension |
| `operatingHoursCase` | string | If MT | `jour`, `jour_soir`, `24_7` | Operating hours profile for MT autoconsumption matrix |
| `tariffRegime` | string | If MT | `uniforme`, `horaire` | MT tariff regime |

**Significance of key fields:**
- `measuredAmountTnd` + `referenceMonth` + `buildingType` + `climateZone` → annual consumption estimate via sector/climate matrices.
- `tariffTension=MT` activates MT-specific autoconsumption sizing (pair index, self-consumption ratio, surplus limits).

### Optional pre-step: bill OCR

If the user sends a bill image, call `POST /api/bill-extraction/extract` (§10) first to pre-fill `measuredAmountTnd`, `referenceMonth` (from `MonthOfReferance`), `address`, `tariffType`.

Map `tariffType` → `tariffTension`: `Basse Tension` → `BT`, `Moyenne Tension` → `MT`.

### Request example

```bash
curl -X POST "https://joya-energy.com/api/audit-solaire-simulations" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "18 Avenue Habib Bourguiba, Tunis",
    "fullName": "Mohamed Ben Ali",
    "companyName": "STE Example",
    "email": "contact@example.tn",
    "phoneNumber": "20123456",
    "buildingType": "Bureau / Administration / Banque",
    "climateZone": "Nord",
    "measuredAmountTnd": 450,
    "referenceMonth": 7,
    "tariffTension": "BT"
  }'
```

### Response `201` — key fields to explain

The API returns a flat `IAuditSolaireSimulation` object.

#### Identity & location

| Field | Meaning |
|-------|---------|
| `id` | Simulation UUID — use for PDF retrieval later |
| `address`, `latitude`, `longitude` | Geocoded site |
| `fullName`, `companyName`, `email`, `phoneNumber` | Contact echo |

#### Consumption

| Field | Unit | Meaning |
|-------|------|---------|
| `baseConsumption` | kWh | Monthly consumption derived from bill amount |
| `annualConsumption` | kWh/an | Extrapolated annual consumption |
| `monthlyConsumptions[]` | array | Month-by-month breakdown with climatic/building coefficients |

#### PV system

| Field | Unit | Meaning |
|-------|------|---------|
| `installedPower`, `systemSize_kWp` | kWp | Recommended PV system size |
| `annualProductible`, `expectedProduction` | kWh/an | Expected PV production |
| `energyCoverageRate`, `coverage` | ratio | Share of consumption covered by PV |
| `monthlyPVProductions[]` | array | Monthly production vs net consumption |

#### Economics (year 1 & 25 years)

| Field | Unit | Meaning |
|-------|------|---------|
| `installationCost` | DT | CAPEX |
| `annualOpex` | DT/an | Operating cost |
| `annualSavings`, `averageAnnualSavings` | DT/an | Bill savings |
| `totalSavings25Years` | DT | Cumulative savings over 25 years |
| `annualBillWithoutPV`, `annualBillWithPV` | DT/an | Bills before/after PV |
| `simplePaybackYears`, `paybackMonths` | years / months | Simple payback period |
| `discountedPaybackYears` | years | Discounted payback |
| `npv` | DT | Net Present Value (VAN) |
| `irr` | ratio | Internal Rate of Return (multiply ×100 for %) |
| `roi25Years` | ratio | 25-year ROI |
| `monthlyEconomics[]` | array | Monthly bill with/without PV |
| `annualEconomics[]` | array | 25-year projection (capex, opex, cumulative cash flow) |

#### Environmental

| Field | Unit | Meaning |
|-------|------|---------|
| `annualCo2Avoided` | kg/an | CO₂ avoided in year 1 |
| `totalCo2Avoided25Years` | kg | Total CO₂ avoided over 25 years |

#### MT-specific (when `tariffTension=MT`)

| Field | Meaning |
|-------|---------|
| `mtPairIndex` | Selected autoconsumption matrix pair (1–5) |
| `mtOperatingHoursCase` | Operating hours case used |
| `mtCoverageRate` | Target coverage rate from matrix |
| `mtSelfConsumptionRatio` | Self-consumption ratio |
| `mtTheoreticalPVPower` | Theoretical PV power (kWp) |
| `mtAnnualPVProduction` | Annual PV production (kWh) |
| `mtSelfConsumedEnergy` | Self-consumed energy (kWh/an) |
| `mtGridSurplus` | Grid export surplus (kWh/an) |
| `mtSurplusWithinLimit` | Whether surplus ≤ 30% of production |
| `mtAnnualSelfConsumptionSavings` | Savings from self-consumption (DT/an) |
| `mtAnnualBillWithPVApprox` | Approximate annual bill with PV (DT/an) |

### Other endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/audit-solaire-simulations` | Paginated list (`page`, `limit`) |
| `GET` | `/audit-solaire-simulations/:id` | Retrieve simulation |
| `DELETE` | `/audit-solaire-simulations/:id` | Delete (`204`) |

---

## 6. Audit Énergétique

**Purpose:** 360° building energy audit — annual consumption, CO₂, cost, end-use breakdown (HVAC, lighting, equipment, DHW), energy class (A–E), carbon class.  
**Page:** `/audit-energetique`  
**Endpoint:** `POST /api/audit-energetique-simulations`

### Inputs to collect

#### Contact & site

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `fullName` | string | **Yes** | Contact name |
| `companyName` | string | **Yes** | Company |
| `email` | string | **Yes** | Email |
| `phoneNumber` | string | **Yes** | Phone |
| `address` | string | **Yes** | Building address |
| `governorate` | string | **Yes** | One of [24 governorates](#governorates) |

#### Building

| Field | Type | Required | Allowed values | Meaning |
|-------|------|----------|----------------|---------|
| `buildingType` | string | **Yes** | [BuildingTypes](#buildingtypes) | Sector — sets reference intensities |
| `surfaceArea` | number | **Yes** | ≥ 0 m² | Conditioned floor area |
| `floors` | number | **Yes** | integer ≥ 0 | Number of floors |
| `activityType` | string | **Yes** | Free text | Business activity description |
| `openingDaysPerWeek` | number | **Yes** | 1–7 | Operating days per week |
| `openingHoursPerDay` | number | **Yes** | 1–24 | Operating hours per day |

#### Envelope (building shell)

| Field | Type | Required | Allowed values | Meaning |
|-------|------|----------|----------------|---------|
| `insulation` | string | **Yes** | `Isolation faible`, `Isolation moyenne`, `Isolation bonne` | Thermal insulation quality |
| `glazingType` | string | **Yes** | `Simple vitrage`, `Double vitrage` | Window glazing |
| `ventilation` | string | **Yes** | `Pas de VMC`, `VMC simple flux`, `VMC double flux` | Ventilation system |
| `climateZone` | string | **Yes** | `Nord`, `Centre`, `Sud` | Climate zone |

#### Energy systems

| Field | Type | Required | Allowed values | Meaning |
|-------|------|----------|----------------|---------|
| `heatingSystem` | string | **Yes** | [HeatingSystemTypes](#heatingsystemtypes) | Main heating |
| `coolingSystem` | string | **Yes** | [CoolingSystemTypes](#coolingsystemtypes) | Main cooling / AC |
| `conditionedCoverage` | string | **Yes** | [ConditionedCoverage](#conditionedcoverage) | % of building air-conditioned |
| `domesticHotWater` | string | **Yes** | [DomesticHotWaterTypes](#domestichotwatertypes) | Hot water production |
| `lightingType` | string | **Yes** | [LightingTypes](#lightingtypes) | Dominant lighting technology |
| `equipmentCategories` | string[] | No | [EquipmentCategories](#equipmentcategories) | Major equipment loads present |
| `existingMeasures` | string[] | No | [ExistingMeasures](#existingmeasures) | Efficiency measures already installed |

#### Billing

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `tariffType` | string | **Yes** | `Basse Tension` or `Moyenne Tension` |
| `monthlyBillAmount` | number | **Yes** | Monthly bill (DT) |
| `hasRecentBill` | boolean | **Yes** | Whether user has actual consumption data |
| `recentBillConsumption` | number | If `hasRecentBill=true` | Consumption on bill (kWh) |
| `contractedPower` | number | No | Subscribed power (kVA) |
| `billAttachmentUrl` | string | No | URL to uploaded bill |

### Request example

```bash
curl -X POST "https://joya-energy.com/api/audit-energetique-simulations" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Mohamed Ben Ali",
    "companyName": "Café Central",
    "email": "contact@example.tn",
    "phoneNumber": "20123456",
    "address": "12 Rue de la République, Sfax",
    "governorate": "Sfax",
    "buildingType": "Café / Restaurant",
    "surfaceArea": 120,
    "floors": 1,
    "activityType": "Restauration",
    "openingDaysPerWeek": 6,
    "openingHoursPerDay": 10,
    "insulation": "Isolation moyenne",
    "glazingType": "Double vitrage",
    "ventilation": "Pas de VMC",
    "climateZone": "Centre",
    "heatingSystem": "Chauffage par climatisation réversible",
    "coolingSystem": "Climatisation split",
    "conditionedCoverage": "Presque tout le bâtiment",
    "domesticHotWater": "Chauffe-eau électrique",
    "lightingType": "Éclairage LED",
    "tariffType": "Basse Tension",
    "monthlyBillAmount": 450,
    "hasRecentBill": true,
    "recentBillConsumption": 1200
  }'
```

### Response `201` — structure

```json
{
  "success": true,
  "data": {
    "simulationId": "...",
    "createdAt": "ISO-8601",
    "contact": { ... },
    "building": { ... },
    "envelope": { ... },
    "systems": { ... },
    "billing": { ... },
    "existingMeasures": [],
    "results": { ... }
  },
  "metadata": { "version": "1.1.0", "calculationDate": "ISO-8601" }
}
```

### Key results to explain

#### `results.energyConsumption`

| Field | Unit | Meaning |
|-------|------|---------|
| `annual.value` | kWh/an | Total estimated annual electricity consumption |
| `monthly.value` | kWh/mois | Average monthly consumption |
| `perSquareMeter.value` | kWh/m²/an | Consumption intensity — key benchmark metric |

#### `results.co2Emissions`

| Field | Meaning |
|-------|---------|
| `annual.kilograms` / `annual.tons` | Annual CO₂ from electricity |
| `perSquareMeter.value` | CO₂ intensity (kg CO₂/m²/an) |

#### `results.energyCost`

| Field | Unit | Meaning |
|-------|------|---------|
| `annual.value` | DT/an | Estimated annual electricity cost |
| `monthly.value` | DT/mois | Average monthly cost |

#### `results.energyEndUseBreakdown` (when available)

Splits consumption & cost across:

| End use | Meaning |
|---------|---------|
| `cooling` | Air conditioning |
| `heating` | Heating |
| `lighting` | Lighting |
| `equipment` | Plug loads / machinery |
| `domesticHotWater` | Hot water |

Each item: `consumptionKwh`, `costTunisianDinar`, `sharePercent`.

#### `results.energyClassification` (when applicable)

| Field | Meaning |
|-------|---------|
| `class` | Energy label A–E (like DPE) |
| `siteIntensity` | kWh/m²/an actual |
| `referenceIntensity` | Sector reference |
| `joyaIndex` | Performance vs reference |
| `becth` | BECTh indicator |
| `description` | Human-readable class explanation |

#### `results.carbonClassification` (when applicable)

| Field | Meaning |
|-------|---------|
| `class` | Carbon label A–E |
| `intensity` | kg CO₂/m²/an |
| `totalElecKg`, `totalGasKg`, `totalKg` | Emission split |

### PDF endpoints (optional for agent)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/audit-energetique-simulations/send-pdf` | `{ "simulationId": "..." }` | Emails audit PDF |
| `POST` | `/audit-energetique-simulations/download-pdf` | `{ "simulationId": "..." }` | PDF binary |
| `POST` | `/audit-energetique-simulations/send-pv-pdf` | `{ "solaireId": "...", "energetiqueId?": "..." }` | Emails PV report |
| `POST` | `/audit-energetique-simulations/download-pv-pdf` | same | PDF binary |

---

## 7. Bilan Carbone

**Purpose:** Estimate organizational carbon footprint across GHG scopes 1, 2, and 3.  
**Page:** `/bilan-carbon`  
**Endpoint:** `POST /api/carbon-simulator/summary`

### Inputs to collect

The body has 5 sections. Server-side validation is **loose** — missing fields may yield 0 emissions for that section.

#### `electricity` — Scope 2

| Field | Type | Required | Allowed values | Meaning |
|-------|------|----------|----------------|---------|
| `monthlyAmountDt` | number | Yes* | ≥ 0 | Monthly electricity bill (DT) |
| `referenceMonth` | number | Yes* | 1–12 | Bill reference month |
| `buildingType` | string | Yes* | [BuildingTypes](#buildingtypes) label **or** enum key (e.g. `OFFICE_ADMIN_BANK`) | Sector for extrapolation |
| `climateZone` | string | Yes* | `Nord`, `Centre`, `Sud` | Climate zone |
| `tariffType` | string | Yes* | `BT`, `MT_UNIFORME`, `MT_HORAIRE` | Tariff type for rate conversion |

#### `thermal` — Scope 1 (heat)

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `hasHeatUsages` | boolean | Yes* | Any on-site heat usage (cooking, DHW, process, space heating)? |
| `annualElectricityKwh` | number | Auto | Filled by server from electricity step — agent can send `0` |
| `buildingType` | string | Yes* | Sector (selects thermal ratio r_th) |
| `selectedHeatUsages` | string[] | No | `DOMESTIC_HOT_WATER`, `COOKING_KITCHEN`, `INDUSTRIAL_PROCESS`, `SPACE_HEATING` |
| `selectedHeatEnergies` | string[] | No | `NATURAL_GAS`, `DIESEL_FUEL`, `LPG`, `UNKNOWN` |

#### `cold` — Scope 1 (refrigeration leaks)

| Field | Type | Required | Allowed values | Meaning |
|-------|------|----------|----------------|---------|
| `hasCold` | boolean | Yes* | | Refrigeration / AC refrigerant present? |
| `surfaceM2` | number | Yes* | | Conditioned / relevant floor area |
| `buildingType` | string | Yes* | | Sector (deduces cold type: Confort, Commercial, Mixte, Industriel) |
| `intensityLevel` | string | No | `Faible`, `Modérée`, `Élevée` | Usage intensity |
| `equipmentAge` | string | No | `<3 ans`, `3-7 ans`, `>7 ans`, `NSP` | Equipment age |
| `maintenanceStatus` | string | No | `Oui`, `Non`, `NSP` | Maintenance quality |

#### `vehicles` — Scope 1 (fleet)

| Field | Type | Required | Allowed values | Meaning |
|-------|------|----------|----------------|---------|
| `hasVehicles` | boolean | Yes* | | Professional vehicle fleet? |
| `numberOfVehicles` | number | No | | Fleet size |
| `kmPerVehiclePerYear` | number | No | | Annual km per vehicle |
| `usageType` | string | No | `Déplacements légers`, `Livraisons / tournées`, `Transport intensif / lourd` | Driving profile (L/100km) |
| `fuelType` | string | No | `Diesel`, `Essence`, `MIXTE` | Fuel type |

#### `scope3` — Scope 3

**`scope3.travel`**

| Field | Allowed values | Meaning |
|-------|----------------|---------|
| `planeFrequency` | `Rare`, `Moyenne`, `Fréquente`, or null | Business air travel |
| `trainFrequency` | same | Business train travel |

**`scope3.itEquipment`**

| Field | Meaning |
|-------|---------|
| `laptopCount` | Laptops (120 kg CO₂e/unit/year) |
| `desktopCount` | Desktops (200 kg CO₂e/unit/year) |
| `screenCount` | Monitors (80 kg CO₂e/unit/year) |
| `proPhoneCount` | Pro phones (50 kg CO₂e/unit/year) |

#### `personal` (optional)

| Field | Meaning |
|-------|---------|
| `fullName`, `companyName`, `email`, `phone` | Contact — `email` triggers bilan email + lead |

### Request example

```bash
curl -X POST "https://joya-energy.com/api/carbon-simulator/summary" \
  -H "Content-Type: application/json" \
  -d '{
    "electricity": {
      "monthlyAmountDt": 800,
      "referenceMonth": 6,
      "buildingType": "Bureau / Administration / Banque",
      "climateZone": "Centre",
      "tariffType": "BT"
    },
    "thermal": {
      "hasHeatUsages": false,
      "annualElectricityKwh": 0,
      "buildingType": "Bureau / Administration / Banque",
      "selectedHeatUsages": [],
      "selectedHeatEnergies": []
    },
    "cold": {
      "hasCold": true,
      "surfaceM2": 500,
      "buildingType": "Bureau / Administration / Banque",
      "intensityLevel": "Modérée",
      "equipmentAge": "3-7 ans",
      "maintenanceStatus": "NSP"
    },
    "vehicles": {
      "hasVehicles": false,
      "numberOfVehicles": 0,
      "kmPerVehiclePerYear": 0,
      "usageType": "Déplacements légers",
      "fuelType": "Diesel"
    },
    "scope3": {
      "travel": { "planeFrequency": "Rare", "trainFrequency": null },
      "itEquipment": { "laptopCount": 10, "desktopCount": 5, "screenCount": 8, "proPhoneCount": 3 }
    },
    "personal": { "email": "user@example.tn", "fullName": "Jane Doe" }
  }'
```

### Response `200`

| Field | Unit | Meaning |
|-------|------|---------|
| `co2Scope1Kg` / `co2Scope1Tonnes` | kg, t/an | Direct emissions: thermal + refrigeration leaks + vehicles |
| `co2Scope2Kg` / `co2Scope2Tonnes` | kg, t/an | Indirect emissions: purchased electricity |
| `co2Scope3Kg` / `co2Scope3Tonnes` | kg, t/an | Other indirect: travel + IT equipment |
| `co2TotalKg` / `co2TotalTonnes` | kg, t/an | **Total organizational footprint** |

**Agent tip:** Explain scopes in plain language:
- **Scope 1:** Fuel burned on-site, refrigerant leaks, company vehicles
- **Scope 2:** Electricity purchased from STEG
- **Scope 3:** Business travel and IT equipment lifecycle

---

## 8. Comparateur de financements

**Purpose:** Compare 4 PV financing models over 7 years — cash, bank credit, leasing, ESCO.  
**Page:** `/comparaison-financements`

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/financing-comparisons/locations` | Solar yield (kWh/kWp/year) per governorate |
| `GET` | `/financing-comparisons/advantages` | Pros/cons per solution type |
| `POST` | `/financing-comparisons` | Run comparison |

### Inputs to collect (`POST`)

| Field | Type | Required | Constraints | Meaning |
|-------|------|----------|-------------|---------|
| `location` | string | **Yes** | [Governorate](#governorates) | Project location — sets solar yield |
| `installationSizeKwp` | number | XOR | > 0 | PV size in kWp |
| `investmentAmountDt` | number | XOR | > 0 | Total investment in DT |
| `fullName` | string | No | | Contact |
| `companyName` | string | No | | Company |
| `email` | string | No | Valid email | Sends results by email |
| `phoneNumber` | string | No | | Phone |

**Rule:** Provide **either** `installationSizeKwp` **or** `investmentAmountDt`, never both.

#### Optional tuning parameters

| Group | Field | Default | Range | Meaning |
|-------|-------|---------|-------|---------|
| `creditParams` | `creditAnnualRate` | 0.11 | 0–1 | Bank loan annual rate |
| | `selfFinancingRate` | 0.25 | 0–1 | Down payment fraction |
| `leasingParams` | `leasingAnnualRate` | 0.15 | 0–1 | Leasing rate |
| | `leasingResidualValueRate` | 0.10 | 0–1 | Residual value % |
| | `leasingOpexMultiplier` | 1.3 | 1–3 | OPEX multiplier vs standard |
| | `selfFinancingRate` | 0.25 | 0–1 | Down payment |
| `escoParams` | `escoTargetIrrAnnual` | 0.18 | 0–1 | ESCO target IRR |
| | `escoOpexIncluded` | true | boolean | OPEX included in ESCO offer |

#### Default project assumptions (if not overridden)

| Parameter | Value |
|-----------|-------|
| Cost per kWp | 2,300 DT/kWp |
| Fallback yield | 1,550 kWh/kWp/year (location overrides via PVGIS) |
| Electricity price | 0.391 DT/kWh |
| OPEX rate | 5%/year |
| Comparison horizon | 7 years (84 months) |

### Request example

```bash
curl -X POST "https://joya-energy.com/api/financing-comparisons" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Tunis",
    "installationSizeKwp": 50,
    "email": "user@example.tn",
    "fullName": "Jane Doe"
  }'
```

### Response `201`

```json
{
  "success": true,
  "data": {
    "input": { "location": "Tunis", "installationSizeKwp": 50 },
    "projectCalculation": { ... },
    "cash": { ... },
    "credit": { ... },
    "leasing": { ... },
    "esco": { ... }
  }
}
```

#### `projectCalculation` — shared base

| Field | Meaning |
|-------|---------|
| `sizeKwp` | Installed PV size |
| `capexDt` | Total CAPEX |
| `annualProductionKwh` | Expected annual production |
| `annualGrossSavingsDt` | Gross annual bill savings |
| `monthlyGrossSavingsDt` | Monthly gross savings |
| `annualOpexDt`, `monthlyOpexDt` | Operating costs |

#### Each solution (`cash`, `credit`, `leasing`, `esco`)

| Field | Meaning |
|-------|---------|
| `type` | `cash`, `credit`, `leasing`, `esco` |
| `initialInvestment` | Upfront cash out (DT) |
| `monthlyPayment` | Financing payment (0 for cash) |
| `monthlyOpex` | Monthly operating cost |
| `totalMonthlyCost` | Payment + OPEX |
| `monthlyCashflow` | Savings − total monthly cost (**key comparison metric**) |
| `durationMonths` / `durationYears` | 84 / 7 |

**Credit-specific:** `creditAnnualRate`, `selfFinancingDt`, `financedPrincipalDt`  
**Leasing-specific:** `leasingDownPaymentDt`, `leasingResidualValueDt`  
**ESCO-specific:** `escoTargetIrrAnnual`, `escoOpexIncluded`, `isViable`, `viabilityError`

**Agent tip:** Compare `monthlyCashflow` across solutions. Positive = net gain each month. Mention `GET /advantages` for qualitative pros/cons.

---

## 9. Analyse Facture STEG

**Purpose:** Deep AI analysis of a STEG electricity bill (BT or MT) — field extraction, client-friendly display, MT power optimization recommendations, BT→MT upgrade study.  
**Page:** `/analyse-facture`  
**Endpoint:** `POST /api/analyse-facture/analyze`

### Inputs to collect

| Field | Type | Required | Constraints | Meaning |
|-------|------|----------|-------------|---------|
| `billImage` | file | **Yes** | JPG, PNG, WEBP, TIFF, PDF; max 10 MB | Photo or scan of STEG bill |

**WhatsApp note:** User sends image → agent downloads media → `curl -F "billImage=@/path/to/file"`.

### Request example

```bash
curl -X POST "https://joya-energy.com/api/analyse-facture/analyze" \
  -F "billImage=@/path/to/facture.pdf"
```

### Response `200`

```json
{
  "success": true,
  "data": {
    "facture_extraite": { ... },
    "affichage_client": { ... },
    "analyse_mt": { ... },
    "etude_bt_mt": { ... }
  }
}
```

#### `facture_extraite`

Raw extracted fields. Structure differs for **BT** vs **MT**.

**BT key fields:** `client`, `adresse_site`, `district_steg`, `date_debut_periode`, `date_fin_periode`, `puissance_souscrite_kva`, `consommation_totale_kwh`, `montant_energie`, `montant_total`, `montant_a_payer`, `gaz` (if gas present).

**MT key fields:** `mois_facturation`, `puissance_souscrite_kva`, `puissance_maximale_appelee_kva`, `consommation_totale_kwh`, time-slot consumptions (`consommation_jour_kwh`, `consommation_pointe_kwh`, …), `montant_energie`, `prime_puissance`, `montant_net_a_payer`, `cos_phi`, penalties/bonifications.

#### `affichage_client`

User-friendly map: each key → `{ valeur, explication }` in French. Use **`valeur`** for display and **`explication`** to teach the user what the field means.

#### `analyse_mt` (MT bills only)

**`indicateurs`**

| Field | Meaning |
|-------|---------|
| `ratio_puissance_pct` | Called power vs subscribed power (%) |
| `puissance_cible_kva` | Recommended target kVA |
| `economie_mensuelle_dt` / `economie_annuelle_dt` | Potential savings from power optimization |
| `marge_kva` / `depassement_kva` | Headroom or overrun vs subscribed power |

**`recommandations[]`**

| Field | Meaning |
|-------|---------|
| `categorie` | Recommendation category |
| `titre`, `description`, `conclusion` | Human-readable advice |
| `gain_mensuel_estime_dt`, `gain_annuel_estime_dt` | Estimated savings |

#### `etude_bt_mt` (BT→MT upgrade study when applicable)

| Field | Meaning |
|-------|---------|
| `consommation_annuelle_kwh` | Annualized consumption |
| `puissance_mt_theorique` / `puissance_mt_recommandee_kva` | Required MT power |
| `capex_dt` | Estimated connection investment |
| `economie_annuelle_dt` | Annual savings if switching to MT |
| `payback_simple_ans` / `payback_actualise_ans` | Payback periods |
| `van_dt` | Net Present Value |
| `tri_pct` | IRR (%) |
| `roi_pct` | ROI (%) |
| `cashflows_25_ans[]` | 25-year cash flow table |

---

## 10. Extraction facture (OCR)

**Purpose:** Lighter OCR extraction for simulators — structured fields with French tooltips. Used before Audit Solaire / Audit Énergétique when user provides a bill.  
**Endpoint:** `POST /api/bill-extraction/extract`

### Inputs

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `billImage` | file | **Yes** | JPG, PNG, PDF; max 5 MB |

### Request example

```bash
curl -X POST "https://joya-energy.com/api/bill-extraction/extract" \
  -F "billImage=@/path/to/facture.jpg"
```

### Response `200`

Each field: `{ "value": <T|null>, "explanation": "<French tooltip>" }`

| Field | Value type | Meaning | Use in simulators |
|-------|------------|---------|-------------------|
| `monthlyBillAmount` | `{ total: number }` | Electricity amount HT (DT) | → `measuredAmountTnd` / `monthlyBillAmount` |
| `recentBillConsumption` | `{ total: number }` | Consumption (kWh) | → `recentBillConsumption` |
| `periodStart` | `YYYY-MM-DD` | Billing period start | Context |
| `periodEnd` | `YYYY-MM-DD` | Billing period end | Context |
| `period` | number | Months in period | Normalize monthly amount |
| `tariffType` | string | `Basse Tension`, `Moyenne Tension`, `Haute Tension` | → `tariffType` / `tariffTension` |
| `contractedPower` | number | Subscribed power (kVA) | → `contractedPower` |
| `address` | string | Consumption point address | → `address` |
| `clientName` | string | Contract holder | Contact context |
| `governorate` | string | One of 24 governorates | → `governorate` |
| `meterNumber` | string | Meter ID | Reference |
| `reference` | string | Bill reference | Reference |
| `district` | string | STEG district | Location context |
| `BillAmountDividedByPeriod` | number | Monthly normalized amount | Cross-check |
| `MonthOfReferance` | 1–12 | Reference month | → `referenceMonth` |

**Agent tip:** Always confirm OCR values with the user before calling simulators. OCR can fail on poor images.

---

## 11. Simulateur subventions FTE (client-side)

**Purpose:** Estimate FTE (Fonds Tunisien pour l'Énergie) non-repayable grants.  
**Page:** `/simulateur-subventions`  
**Backend:** No calculation API — agent must replicate client logic or guide user to the web page.  
**Lead:** `POST /api/leads` with `source: "subventions-simulator"`

### Wizard steps & inputs

| Step | What to collect | Meaning |
|------|-----------------|---------|
| 1 | Category key | Investment family |
| 2 | Item id | Specific eligible action |
| 3 | Amount inputs | Depends on category type |
| 4 | Contact | `fullName`, `email`, `phoneNumber` |

### Categories

| Key | Title | Calculation type | Input needed |
|-----|-------|------------------|--------------|
| `immateriel` | Investissements immatériels | % of amount, capped | `montant` (DT) |
| `materiel` | Investissements matériels | % of amount, capped (or m² for solar water heating) | `montant` (DT); `surface` (m²) for `chauffage_solaire` |
| `prosol` | Autoconsommation PV raccordée | Flat per system | `quantity` (number of systems) |
| `offgrid` | Installations PV off-grid | DT/kW tiered by power | `power` (kW) |

### Calculation rules

**Percent items** (`immateriel`, most `materiel`):
```
prime = min(montant × taux, plafond)
```

**Solar m² item** (`chauffage_solaire`):
```
prime = min(montant × 0.30, surface × 250)
```

**Flat items** (`prosol`):
```
prime = quantity × amount_per_system
```
- `posol_elec`: 500 DT/system
- `prosol_eco`: 1,500 DT/system

**Off-grid** (`offgrid_pv`):
```
prime = power_kW × rate_for_tier  (capped at 50,000 DT for largest tier)
```
Tiers: ≤0.25 kW → 6,000 DT/kW; ≤0.5 → 4,500; ≤2 → 3,500; ≤5 → 3,000; ≤10 → 1,500; >10 → 1,000 (cap 50,000 DT).

### Output to explain

| Field | Meaning |
|-------|---------|
| `prime` | Estimated grant (DT) |
| `montant` | Investment base used (if applicable) |
| `tauxLabel` | Rate description shown to user |
| `capHit` | Whether the cap limited the prime |
| `capVal` | Cap value applied |
| `itemName` | Selected FTE action name |

**Source of truth for items/rates:** `packages/frontend/src/app/pages/simulateur-subventions/subventions-fte.data.ts`

---

## 12. Capture de leads

**Endpoint:** `POST /api/leads`

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `email` | string | **Yes** | Lead email (unique key) |
| `phoneNumber` | string | No | Phone |
| `name` | string | No | Full name |
| `address` | string | No | Address |
| `companyName` | string | No | Company |
| `source` | string | No | Origin tracker (see §2.4) |

**Responses:** `201` new lead; `200 { "message": "already exist" }` if email exists.

```bash
curl -X POST "https://joya-energy.com/api/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.tn",
    "name": "Mohamed Ben Ali",
    "phoneNumber": "20123456",
    "source": "simulator"
  }'
```

---

## 13. Enums & allowed values

### Governorates

`Tunis`, `Ariana`, `Ben Arous`, `Manouba`, `Bizerte`, `Béja`, `Jendouba`, `Kairouan`, `Kasserine`, `Médenine`, `Monastir`, `Nabeul`, `Sfax`, `Sousse`, `Tataouine`, `Tozeur`, `Zaghouan`, `Siliana`, `Le Kef`, `Mahdia`, `Sidi Bouzid`, `Gabès`, `Gafsa`

### BuildingTypes

`Café / Restaurant`, `Centre esthétique / Spa`, `Hôtel`, `Clinique / Centre médical`, `Bureau / Administration / Banque`, `Atelier léger / Artisanat / Menuiserie`, `Usine lourde / Mécanique / Métallurgie`, `Industrie textile / Emballage`, `Industrie alimentaire`, `Industrie plastique / Injection`, `Industrie agroalimentaire réfrigérée`, `École / Centre de formation`, `Service Tertiaire`

### ClimateZones

`Nord`, `Centre`, `Sud`

### HeatingSystemTypes

`Aucun chauffage`, `Chauffage électrique individuel`, `Chauffage par climatisation réversible`, `Chaudière gaz`, `Chaudiere électrique`, `Autre système de chauffage`

### CoolingSystemTypes

`Aucune climatisation`, `Climatisation split`, `Climatisation centrale`

### ConditionedCoverage

`Quelques pièces`, `Environ la moitié du bâtiment`, `Presque tout le bâtiment`

### DomesticHotWaterTypes

`Aucune production ECS`, `Chauffe-eau électrique`, `Chaudière gaz`, `Chauffe-eau solaire`, `Pompe à chaleur ECS`

### InsulationQualities

`Isolation faible`, `Isolation moyenne`, `Isolation bonne`

### GlazingTypes

`Simple vitrage`, `Double vitrage`

### VentilationSystems

`Pas de VMC`, `VMC simple flux`, `VMC double flux`

### LightingTypes

`Ampoules classiques`, `Tubes fluorescents`, `Éclairage LED`

### EquipmentCategories

`Éclairage (ampoules LED , tubes fluorescents, halogènes)`, `Bureautique (ordinateurs, imprimantes, photocopieuses, caisses, etc.)`, `Froid commercial / Réfrigération (réfrigérateurs, congélateurs, vitrines froides, etc.)`, `Cuisine / Cuisson (fours, plaques de cuisson, hottes, friteuses, etc.)`, `Équipements spécifiques (clim d'appoint, TV, machines à café, etc.)`, `Machines de production / Ateliers (presses, tours, fraiseuses, lignes de production, etc.)`, `Compresseurs / Air comprimé`, `Pompes & Convoyeurs`, `Froid industriel / Chambres froides`, `Équipements auxiliaires (informatique industrielle, ventilation, sécurité, éclairage d'atelier, etc.)`

### ExistingMeasures

`Éclairage à haute efficacité`, `Installation solaire photovoltaïque existante`, `Variateurs de vitesse sur moteurs /compresseurs`, `Système de suivi des consommations (monitoring)`, `Climatisation / chauffage à haute efficacité`, `Autres dispositifs d'efficacité énergétique`

### EnergyTariffTypes

`Basse Tension`, `Moyenne Tension`

### ClassificationGrade (audit results)

`A`, `B`, `C`, `D`, `E`, `N/A`

---

## 14. Recommended agent flows

### Flow A — "How much solar can I install?"

1. Ask: monthly bill (DT), climate zone, address, building type, contact info
2. Optional: bill photo → `POST /bill-extraction/extract`
3. `POST /audit-solaire-simulations`
4. Explain: `systemSize_kWp`, `installationCost`, `annualSavings`, `simplePaybackYears`, `npv`, `irr`

### Flow B — "How energy-efficient is my building?"

1. Collect building envelope, systems, billing (§6)
2. Optional: bill OCR
3. `POST /audit-energetique-simulations`
4. Explain: energy class, consumption per m², end-use breakdown, top savings opportunities

### Flow C — "What's my carbon footprint?"

1. Walk through electricity → thermal → cold → vehicles → travel/IT (§7)
2. `POST /carbon-simulator/summary`
3. Explain scopes and total tonnes CO₂e/year

### Flow D — "How should I finance my PV project?"

1. Ask governorate + (kWp **or** investment DT)
2. Optional: `GET /financing-comparisons/locations` to mention local yield
3. `POST /financing-comparisons`
4. Compare `monthlyCashflow` across cash/credit/leasing/ESCO

### Flow E — "Explain my STEG bill"

1. User sends bill image
2. `POST /analyse-facture/analyze`
3. Walk through `affichage_client` fields
4. If MT: explain `analyse_mt.recommandations`
5. If BT with upgrade potential: explain `etude_bt_mt`

### Flow F — "What FTE grant can I get?"

1. Category → item → investment amount
2. Calculate locally (§11)
3. `POST /leads` to capture contact

---

## Source files (for maintainers)

| Area | Path |
|------|------|
| API entry & routes | `packages/backend/src/server.ts` |
| Audit Solaire | `packages/backend/src/modules/audit-solaire/` |
| Audit Énergétique | `packages/backend/src/modules/audit-energetique/` |
| Bilan Carbone | `packages/backend/src/modules/carbon-simulator/` |
| Financements | `packages/backend/src/interfaces/financing-comparison/` |
| Analyse Facture | `packages/backend/src/modules/analyse-facture/` |
| Bill Extraction | `packages/backend/src/modules/bill-extraction/` |
| Shared types & enums | `packages/shared/src/interfaces/`, `packages/shared/src/enums/` |
| Pré-sim solaire | `packages/frontend/src/app/pages/pre-audit-solaire/` |
| Subventions FTE | `packages/frontend/src/app/pages/simulateur-subventions/` |
